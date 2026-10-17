/**
 * Generic client-side filtering, no backend.
 * <form data-filter="x"> holds groups of checkboxes. Each checkbox's `name` is the URL
 * parameter and its `data-key` the item attribute to match (a space-separated list).
 * Within a group, any checked value matches; across groups, all groups must match.
 * An optional <input type="search" data-search="Story"> narrows items with Pagefind
 * (restricted to that result type); without an index it falls back to a text match.
 * Items carry `data-filter-item="x"` and `data-url`. `[data-filter-status="x"]` gets the count.
 * State lives in the URL: ?country=kenya,sweden&media=video&q=food
 */
import { searchSite, normalisePath } from './pagefind';

export function initFilters(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-filter]').forEach((form) => {
    const group = form.dataset.filter!;
    const items = [...document.querySelectorAll<HTMLElement>(`[data-filter-item="${group}"]`)];
    const status = document.querySelector<HTMLElement>(`[data-filter-status="${group}"]`);
    const empty = document.querySelector<HTMLElement>(`[data-filter-empty="${group}"]`);
    const boxes = [...form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name][data-key]')];
    const names = [...new Set(boxes.map((b) => b.name))];
    const searchInput = form.querySelector<HTMLInputElement>('input[data-search]');
    const noun = form.dataset.noun ?? 'item';
    const nouns = form.dataset.nouns ?? `${noun}s`;

    let matches: Set<HTMLElement> | null = null; // null = no search query
    let token = 0;

    const checked = (name: string) => boxes.filter((b) => b.name === name && b.checked).map((b) => b.value);
    const keyOf = (name: string) => boxes.find((b) => b.name === name)!.dataset.key!;
    const query = () => searchInput?.value.trim() ?? '';

    const apply = (updateUrl: boolean) => {
      const active = names.map((n) => ({ name: n, key: keyOf(n), values: checked(n) })).filter((f) => f.values.length);
      let shown = 0;
      for (const item of items) {
        const ok =
          active.every((f) => {
            const have = (item.dataset[f.key] ?? '').split(' ');
            return f.values.some((v) => have.includes(v));
          }) && (matches === null || matches.has(item));
        item.hidden = !ok;
        if (ok) shown++;
      }
      const q = query();
      if (status) status.textContent = `Showing ${shown} ${shown === 1 ? noun : nouns}${q ? ` matching “${q}”` : ''}`;
      if (empty) empty.hidden = shown !== 0;
      if (updateUrl) {
        const url = new URL(location.href);
        for (const n of names) url.searchParams.delete(n);
        url.searchParams.delete('q');
        for (const f of active) url.searchParams.set(f.name, f.values.join(','));
        if (q) url.searchParams.set('q', q);
        history.replaceState(null, '', url);
      }
    };

    const runSearch = async (updateUrl: boolean) => {
      const q = query();
      const mine = ++token;
      if (!q) {
        matches = null;
        apply(updateUrl);
        return;
      }
      const hits = await searchSite(q, searchInput?.dataset.search ? { type: searchInput.dataset.search } : {});
      if (mine !== token) return; // a newer query superseded this one
      if (hits === null) {
        // No Pagefind index (dev server): plain case-insensitive text match.
        const needle = q.toLowerCase();
        matches = new Set(items.filter((i) => (i.textContent ?? '').toLowerCase().includes(needle)));
      } else {
        const paths = new Set(hits.map((h) => normalisePath(h.url)));
        matches = new Set(items.filter((i) => i.dataset.url && paths.has(normalisePath(i.dataset.url))));
      }
      apply(updateUrl);
    };

    // Restore state from the URL.
    const params = new URLSearchParams(location.search);
    for (const name of names) {
      const wanted = new Set((params.get(name) ?? '').split(',').filter(Boolean));
      for (const b of boxes.filter((x) => x.name === name)) b.checked = wanted.has(b.value);
    }
    if (searchInput) searchInput.value = params.get('q') ?? '';

    let debounce: number | undefined;
    form.addEventListener('change', (e) => {
      if (e.target !== searchInput) apply(true);
    });
    searchInput?.addEventListener('input', () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => void runSearch(true), 200);
    });
    form.addEventListener('reset', () =>
      setTimeout(() => {
        matches = null;
        token++;
        apply(true);
      }),
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.clearTimeout(debounce);
      void runSearch(true);
    });
    form.hidden = false;
    if (query()) void runSearch(false);
    else apply(false);
  });
}
