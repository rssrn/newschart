import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentMeta, SITE_ORIGIN } from './useDocumentMeta';

const content = (selector: string): string | null =>
  document.head.querySelector(selector)?.getAttribute('content') ?? null;

const href = (selector: string): string | null =>
  document.head.querySelector(selector)?.getAttribute('href') ?? null;

describe('useDocumentMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('sets title, description, canonical and og tags', () => {
    renderHook(() => useDocumentMeta({ title: 'How it works — NewsChart', description: 'Pipeline explainer', path: '/method' }));

    expect(document.title).toBe('How it works — NewsChart');
    expect(content('meta[name="description"]')).toBe('Pipeline explainer');
    expect(href('link[rel="canonical"]')).toBe(`${SITE_ORIGIN}/method`);
    expect(content('meta[property="og:title"]')).toBe('How it works — NewsChart');
    expect(content('meta[property="og:description"]')).toBe('Pipeline explainer');
    expect(content('meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/method`);
  });

  it('overwrites tags that index.html already ships', () => {
    document.head.innerHTML =
      '<meta name="description" content="static"><meta property="og:url" content="https://newschart.rossarnold.uk/">';

    renderHook(() => useDocumentMeta({ title: 'Credits — NewsChart', description: 'Attribution', path: '/credits' }));

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(content('meta[name="description"]')).toBe('Attribution');
    expect(content('meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/credits`);
  });

  it('restores the previous document state on unmount', () => {
    // Order matters: assigning head.innerHTML replaces the <title> element,
    // so set the title after seeding the rest of the head.
    document.head.innerHTML = '<meta name="description" content="static">';
    document.title = 'NewsChart';

    const { unmount } = renderHook(() =>
      useDocumentMeta({ title: 'Accessibility — NewsChart', description: 'Statement', path: '/accessibility' })
    );
    unmount();

    expect(document.title).toBe('NewsChart');
    expect(content('meta[name="description"]')).toBe('static');
    // Tags the hook created rather than modified are removed entirely.
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
  });

  it('resolves the homepage path to a bare origin canonical', () => {
    renderHook(() => useDocumentMeta({ title: 'NewsChart', description: 'Map', path: '/' }));

    expect(href('link[rel="canonical"]')).toBe(`${SITE_ORIGIN}/`);
  });
});
