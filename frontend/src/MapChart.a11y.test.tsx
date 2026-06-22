// @author Claude Sonnet 4.6 Anthropic
import { render, act, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach } from 'vitest';
import App from './App';
import calloutsFixture from './__tests__/a11y/fixtures/callouts-for-day.json';
import allSourcesFixture from './__tests__/a11y/fixtures/callouts-all-sources.json';
import availableDaysFixture from './__tests__/a11y/fixtures/available-days.json';
import statsFixture from './__tests__/a11y/fixtures/stats-all-callouts.json';

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('availableDays')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(availableDaysFixture) });
    }
    if (url.includes('calloutsForDay')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(calloutsFixture) });
    }
    if (url.includes('statsAllCallouts')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(statsFixture) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }));
}

function stubFetchAllSources() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('availableDays')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(availableDaysFixture) });
    }
    if (url.includes('calloutsForDay')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(allSourcesFixture) });
    }
    if (url.includes('statsAllCallouts')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(statsFixture) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('MapChart (App) accessibility', () => {
  it('has no axe violations in initial consensus view (default)', async () => {
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
    stubFetch();
    await act(async () => { render(<App />); });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in day view', async () => {
    localStorage.setItem('viewMode', 'day');
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
    stubFetch();
    await act(async () => { render(<App />); });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // CP6: multi-source badge rows, count in aria-label, no count chip
  it('has no axe violations in consensus view with all sources present', async () => {
    localStorage.setItem('viewMode', 'consensus');
    stubFetchAllSources();
    await act(async () => { render(<App />); });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // CP6 D25: absent sources are hidden (not disabled) — verify no axe violations and sources not rendered
  it('has no axe violations in consensus view with hidden highlight radios (partial-source day)', async () => {
    // Single-source fixture → radios for absent sources are hidden entirely
    localStorage.setItem('viewMode', 'consensus');
    stubFetch();
    await act(async () => { render(<App />); });
    const allHighlightRadios = document.querySelectorAll('input[name="highlight-source"]');
    // Only present sources + "All Sources" should be rendered; absent sources hidden
    expect(allHighlightRadios.length).toBeGreaterThan(0);
    expect(document.querySelectorAll('input[name="highlight-source"][disabled]').length).toBe(0);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // CP6: highlight-active context banner (role="status") — verify no axe violations
  it('has no axe violations in consensus view with highlight active and context banner', async () => {
    localStorage.setItem('viewMode', 'consensus');
    stubFetchAllSources();
    await act(async () => { render(<App />); });
    const geminiRadio = document.querySelector('input[name="highlight-source"][value="GOOGLE_GEMINI"]') as HTMLInputElement;
    expect(geminiRadio).not.toBeNull();
    await act(async () => { fireEvent.click(geminiRadio); });
    const banner = document.querySelector('.consensus-context-banner');
    expect(banner).not.toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
