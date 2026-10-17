/**
 * Colour scheme switch. "auto" follows the system; "light"/"dark" are the
 * visitor's choice, stored in their own browser only (localStorage).
 * The inline script in BaseLayout applies the stored choice before first paint.
 */
export type ThemeChoice = 'auto' | 'light' | 'dark';
const KEY = 'cu-theme';
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

export function getChoice(): ThemeChoice {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : 'auto';
}

export function effectiveScheme(): 'light' | 'dark' {
  const c = getChoice();
  return c === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : c;
}

export function setChoice(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'auto') delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* storage unavailable (private mode): the choice lasts for this page only */
  }
  syncThemeControls();
}

/** Update every theme control on the page to match the current state. */
export function syncThemeControls(): void {
  const choice = getChoice();
  const scheme = effectiveScheme();
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.dataset.scheme = scheme;
    btn.setAttribute('aria-label', scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === choice));
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-dynamic]');
  if (meta) meta.content = scheme === 'dark' ? '#131412' : '#f2f1ec';
}

export function initThemeControls(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.addEventListener('click', () => setChoice(effectiveScheme() === 'dark' ? 'light' : 'dark'));
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
    btn.addEventListener('click', () => setChoice(btn.dataset.themeChoice as ThemeChoice));
  }
  darkQuery.addEventListener('change', syncThemeControls);
  syncThemeControls();
}
