/**
 * Generic client-side filtering, no backend.
 * <form data-filter="x"> holds controls (select or radio) whose `name` is the URL
 * parameter and whose `data-key` is the item attribute to match (space-separated list).
 * Items carry `data-filter-item="x"`. A `[data-filter-status="x"]` element gets the count.
 */
export function initFilters(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-filter]').forEach((form) => {
    const group = form.dataset.filter!;
    const items = [...document.querySelectorAll<HTMLElement>(`[data-filter-item="${group}"]`)];
    const status = document.querySelector<HTMLElement>(`[data-filter-status="${group}"]`);
    const empty = document.querySelector<HTMLElement>(`[data-filter-empty="${group}"]`);
    const controls = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name][data-key]')];
    const names = [...new Set(controls.map((c) => c.name))];
    const noun = form.dataset.noun ?? 'item';
    const nouns = form.dataset.nouns ?? `${noun}s`;

    const valueOf = (name: string) => {
      const els = controls.filter((c) => c.name === name);
      const radio = els.find((c) => c instanceof HTMLInputElement && c.type === 'radio' && c.checked);
      return (radio ?? els.find((c) => c instanceof HTMLSelectElement))?.value ?? '';
    };
    const keyOf = (name: string) => controls.find((c) => c.name === name)!.dataset.key!;

    const apply = (updateUrl: boolean) => {
      const active = names.map((n) => ({ name: n, key: keyOf(n), value: valueOf(n) })).filter((f) => f.value);
      let shown = 0;
      for (const item of items) {
        const ok = active.every((f) => (item.dataset[f.key] ?? '').split(' ').includes(f.value));
        item.hidden = !ok;
        if (ok) shown++;
      }
      if (status) status.textContent = `Showing ${shown} ${shown === 1 ? noun : nouns}`;
      if (empty) empty.hidden = shown !== 0;
      if (updateUrl) {
        const url = new URL(location.href);
        for (const n of names) url.searchParams.delete(n);
        for (const f of active) url.searchParams.set(f.name, f.value);
        history.replaceState(null, '', url);
      }
    };

    // Restore state from the URL (?country=kenya etc.).
    const params = new URLSearchParams(location.search);
    for (const name of names) {
      const v = params.get(name);
      if (!v) continue;
      for (const c of controls.filter((c) => c.name === name)) {
        if (c instanceof HTMLSelectElement && [...c.options].some((o) => o.value === v)) c.value = v;
        if (c instanceof HTMLInputElement && c.value === v) c.checked = true;
      }
    }
    form.addEventListener('change', () => apply(true));
    form.addEventListener('reset', () => setTimeout(() => apply(true)));
    form.addEventListener('submit', (e) => e.preventDefault());
    form.hidden = false;
    apply(false);
  });
}
