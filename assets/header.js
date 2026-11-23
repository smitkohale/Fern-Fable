/**
 * <site-header>: mega menus, mobile menu dialog, hide on scroll down.
 * Scroll work is throttled to one run per animation frame (skill B7).
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopHover = window.matchMedia('(hover: hover) and (min-width: 990px)');

const OPEN_DELAY = 80;
const CLOSE_DELAY = 200;

function afterTransition(element, fallback = 500) {
  return new Promise((resolve) => {
    if (reducedMotion.matches) {
      resolve();
      return;
    }
    const done = () => {
      element.removeEventListener('transitionend', onEnd);
      window.clearTimeout(timer);
      resolve();
    };
    const onEnd = (event) => {
      if (event.target === element) done();
    };
    const timer = window.setTimeout(done, fallback);
    element.addEventListener('transitionend', onEnd);
  });
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.shopify-section') || this;
    this.items = [...this.querySelectorAll('[data-mega-item]')];
    this.openItem = null;
    this.timers = new WeakMap();

    this.items.forEach((item) => this.bindMegaItem(item));
    this.addEventListener('keydown', this.onKeydown);
    document.addEventListener('click', this.onDocumentClick);

    this.dialog = this.querySelector('[data-mobile-menu]');
    this.openButton = this.querySelector('[data-mobile-menu-open]');
    this.openButton?.addEventListener('click', () => this.openMobileMenu());
    this.dialog?.querySelector('[data-mobile-menu-close]')?.addEventListener('click', () =>
      this.closeMobileMenu()
    );
    this.dialog?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeMobileMenu();
    });
    this.dialog?.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) this.closeMobileMenu({ restoreFocus: false });
    });
    window.matchMedia('(min-width: 990px)').addEventListener('change', (event) => {
      if (event.matches) this.closeMobileMenu({ restoreFocus: false });
    });

    this.lastY = window.scrollY;
    this.ticking = false;
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('click', this.onDocumentClick);
  }

  /* ---------- Mega menus ---------- */
  bindMegaItem(item) {
    const trigger = item.querySelector('[data-mega-trigger]');
    trigger.addEventListener('click', () => {
      if (this.openItem === item) this.closeMega(item);
      else this.openMega(item);
    });

    item.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !desktopHover.matches) return;
      this.schedule(item, () => this.openMega(item), OPEN_DELAY);
    });
    item.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse' || !desktopHover.matches) return;
      this.schedule(item, () => this.closeMega(item), CLOSE_DELAY);
    });
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) this.closeMega(item);
    });
  }

  schedule(item, callback, delay) {
    window.clearTimeout(this.timers.get(item));
    this.timers.set(item, window.setTimeout(callback, delay));
  }

  openMega(item) {
    if (this.openItem && this.openItem !== item) this.closeMega(this.openItem, { instant: true });
    const trigger = item.querySelector('[data-mega-trigger]');
    const panel = item.querySelector('[data-mega-panel]');
    window.clearTimeout(this.timers.get(item));
    this.openItem = item;
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
  }

  async closeMega(item, { instant = false } = {}) {
    const trigger = item.querySelector('[data-mega-trigger]');
    const panel = item.querySelector('[data-mega-panel]');
    if (trigger.getAttribute('aria-expanded') !== 'true') return;
    window.clearTimeout(this.timers.get(item));
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    if (this.openItem === item) this.openItem = null;
    if (!instant) await afterTransition(panel);
    if (trigger.getAttribute('aria-expanded') === 'false') panel.hidden = true;
  }

  onKeydown = (event) => {
    if (event.key !== 'Escape' || !this.openItem) return;
    const item = this.openItem;
    this.closeMega(item);
    item.querySelector('[data-mega-trigger]').focus();
  };

  onDocumentClick = (event) => {
    if (this.openItem && !this.openItem.contains(event.target)) this.closeMega(this.openItem);
  };

  /* ---------- Mobile menu ---------- */
  openMobileMenu() {
    if (!this.dialog || this.dialog.open) return;
    this.dialog.showModal();
    this.openButton.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => this.dialog.classList.add('is-open'));
  }

  async closeMobileMenu({ restoreFocus = true } = {}) {
    if (!this.dialog?.open) return;
    this.dialog.classList.remove('is-open');
    this.openButton.setAttribute('aria-expanded', 'false');
    await afterTransition(this.dialog);
    if (!this.dialog.classList.contains('is-open')) this.dialog.close();
    if (restoreFocus) this.openButton.focus();
  }

  /* ---------- Hide on scroll down, show on scroll up ---------- */
  onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.updateScroll();
      this.ticking = false;
    });
  };

  updateScroll() {
    const y = Math.max(window.scrollY, 0);
    const delta = y - this.lastY;
    // Keep the bar in view while a menu is open or a keyboard user is inside it.
    const busy = this.openItem || this.querySelector(':focus-visible') || this.dialog?.open;

    this.section.classList.toggle('is-scrolled', y > 8);

    if (busy || y < 120) {
      this.section.classList.remove('is-hidden');
    } else if (delta > 4) {
      this.section.classList.add('is-hidden');
    } else if (delta < -4) {
      this.section.classList.remove('is-hidden');
    }

    this.lastY = y;
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}
