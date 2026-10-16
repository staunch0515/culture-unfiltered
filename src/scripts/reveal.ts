/**
 * Fade-up reveal for `.reveal` elements that start below the fold. Skipped for reduced motion.
 * A scroll sweep (instead of IntersectionObserver alone) also catches elements that were
 * jumped past by fast scrolling, the End key or anchor links, so nothing stays hidden.
 */
export function initReveal(): void {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  const pending = new Set<HTMLElement>();
  for (const el of document.querySelectorAll<HTMLElement>('.reveal')) {
    if (el.getBoundingClientRect().top < window.innerHeight) continue;
    el.classList.add('reveal-pending');
    pending.add(el);
  }
  if (pending.size === 0) return;

  let queued = false;
  const sweep = () => {
    queued = false;
    const line = window.innerHeight * 0.92;
    for (const el of pending) {
      if (el.getBoundingClientRect().top < line) {
        el.classList.add('is-visible');
        pending.delete(el);
      }
    }
    if (pending.size === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}
