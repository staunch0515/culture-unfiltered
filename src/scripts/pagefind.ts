/**
 * Thin, typed loader for the Pagefind index generated at build time (dist/pagefind).
 * Returns null when the index is missing (e.g. `astro dev`), so callers can fall back.
 */
export interface SearchHit {
  url: string;
  excerpt: string;
  meta: { title?: string; image?: string; type?: string };
}

interface PagefindResult {
  id: string;
  data(): Promise<SearchHit>;
}

interface PagefindModule {
  options?(opts: Record<string, unknown>): Promise<void>;
  init?(): Promise<void>;
  search(
    query: string,
    opts?: { filters?: Record<string, string | string[]> },
  ): Promise<{ results: PagefindResult[] } | null>;
}

const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
let loading: Promise<PagefindModule | null> | undefined;

export function loadPagefind(): Promise<PagefindModule | null> {
  loading ??= import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)
    .then(async (mod: PagefindModule) => {
      await mod.options?.({ baseUrl: base, excerptLength: 24 });
      await mod.init?.();
      return mod;
    })
    .catch(() => null);
  return loading;
}

/** Normalise a URL to a comparable pathname ending in a slash. */
export function normalisePath(url: string): string {
  const path = new URL(url, location.origin).pathname.replace(/index\.html$/, '');
  return path.endsWith('/') ? path : `${path}/`;
}

/** Search and return hydrated hits, at most `limit` of them. */
export async function searchSite(
  query: string,
  filters: Record<string, string | string[]> = {},
  limit = 50,
): Promise<SearchHit[] | null> {
  const pf = await loadPagefind();
  if (!pf) return null;
  const res = await pf.search(query, { filters });
  if (!res) return [];
  return Promise.all(res.results.slice(0, limit).map((r) => r.data()));
}
