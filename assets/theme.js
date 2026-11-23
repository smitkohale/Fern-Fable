/**
 * Fern & Fable: global script, loaded on every page as a deferred module.
 * Keep this small. Section specific scripts live in their own asset files
 * and are loaded by the section that needs them (type="module" scripts
 * with the same URL only run once, however many sections include them).
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Scroll reveals: elements with [data-reveal] get .is-revealed once,
 * when they enter the viewport. Siblings inside [data-reveal-group]
 * are staggered 60ms apart, capped at 400ms (DESIGN.md section 8).
 */
function initReveals(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.is-revealed)');
  if (!items.length) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll('[data-reveal]').forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index * 60, 400)}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );

  items.forEach((el) => observer.observe(el));
}

initReveals();

/* The theme editor re-renders sections in place: reveal new content straight away. */
document.addEventListener('shopify:section:load', (event) => initReveals(event.target));
