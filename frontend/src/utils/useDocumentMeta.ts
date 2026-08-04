import { useEffect } from 'react';

/**
 * Canonical production origin. Hardcoded rather than read from
 * window.location so that preview/dev builds still emit canonical URLs
 * pointing at production — which is what we want search engines to index.
 */
export const SITE_ORIGIN = 'https://newschart.rossarnold.uk';

export interface DocumentMeta {
  /** Full <title> text, e.g. "How it works — NewsChart" */
  title: string;
  /** Meta description; also used for og:description */
  description: string;
  /** Site-root-relative path, e.g. "/method". Resolved against SITE_ORIGIN. */
  path: string;
}

type Restore = () => void;

/** Set an attribute on a head element matching `selector`, creating it if absent. */
function upsertHeadTag(selector: string, create: () => HTMLElement, attr: string, value: string): Restore {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) {
    const previous = existing.getAttribute(attr);
    existing.setAttribute(attr, value);
    return () => {
      if (previous === null) existing.removeAttribute(attr);
      else existing.setAttribute(attr, previous);
    };
  }
  const created = create();
  created.setAttribute(attr, value);
  document.head.appendChild(created);
  return () => created.remove();
}

/**
 * Applies per-route document metadata: <title>, meta description, canonical
 * link, and the Open Graph title/description/url.
 *
 * The app is client-rendered with no router, so index.html ships a single
 * static title/description for every route. Without this, /method, /credits
 * and /accessibility are indistinguishable to crawlers from the homepage, and
 * the static og:url points all of them back at "/". This corrects the document
 * during Google's JS-rendering pass — the practical ceiling for a CSR SPA
 * short of adding SSR or prerendering.
 *
 * All mutations are reverted on unmount so metadata cannot leak between
 * components (notably across test renders sharing one jsdom document).
 *
 * @author Claude Opus 5 Anthropic
 */
export function useDocumentMeta({ title, description, path }: DocumentMeta): void {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;
    const previousTitle = document.title;
    document.title = title;

    const restores: Restore[] = [
      upsertHeadTag(
        'meta[name="description"]',
        () => Object.assign(document.createElement('meta'), { name: 'description' }),
        'content',
        description
      ),
      upsertHeadTag(
        'link[rel="canonical"]',
        () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
        'href',
        url
      ),
      upsertHeadTag(
        'meta[property="og:title"]',
        () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; },
        'content',
        title
      ),
      upsertHeadTag(
        'meta[property="og:description"]',
        () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; },
        'content',
        description
      ),
      upsertHeadTag(
        'meta[property="og:url"]',
        () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); return m; },
        'content',
        url
      ),
    ];

    return () => {
      document.title = previousTitle;
      restores.forEach(restore => restore());
    };
  }, [title, description, path]);
}
