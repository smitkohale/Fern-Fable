/**
 * <announcement-bar>: rotates its [data-slide] children.
 * Pauses on hover, on focus inside, when the tab is hidden, and when the
 * shopper presses pause. Never rotates on its own under reduced motion.
 */
class AnnouncementBar extends HTMLElement {
  connectedCallback() {
    this.slides = [...this.querySelectorAll('[data-slide]')];
    if (this.slides.length < 2) return;

    this.index = 0;
    this.interval = Number(this.dataset.interval) || 5000;
    this.userPaused = false;
    this.hovered = false;
    this.focused = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.toggleButton = this.querySelector('[data-action="toggle"]');

    this.addEventListener('click', this.onClick);
    this.addEventListener('pointerenter', () => this.setHover(true));
    this.addEventListener('pointerleave', () => this.setHover(false));
    this.addEventListener('focusin', () => this.setFocus(true));
    this.addEventListener('focusout', (event) => {
      if (!this.contains(event.relatedTarget)) this.setFocus(false);
    });
    document.addEventListener('visibilitychange', this.sync);
    this.reducedMotion.addEventListener('change', this.sync);

    this.sync();
  }

  disconnectedCallback() {
    this.stop();
    document.removeEventListener('visibilitychange', this.sync);
    this.reducedMotion?.removeEventListener('change', this.sync);
  }

  onClick = (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'next') this.go(this.index + 1);
    if (action === 'prev') this.go(this.index - 1);
    if (action === 'toggle') {
      this.userPaused = !this.userPaused;
      button.setAttribute('aria-pressed', String(this.userPaused));
      button.setAttribute(
        'aria-label',
        this.userPaused ? button.dataset.labelPlay : button.dataset.labelPause
      );
      this.sync();
    }
  };

  setHover(value) {
    this.hovered = value;
    this.sync();
  }

  setFocus(value) {
    this.focused = value;
    this.sync();
  }

  go(nextIndex) {
    const count = this.slides.length;
    this.index = (nextIndex + count) % count;
    this.slides.forEach((slide, i) => {
      const active = i === this.index;
      slide.classList.toggle('is-active', active);
      slide.toggleAttribute('inert', !active);
      if (active) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });
    // Announce changes only when the shopper drives them.
    this.querySelector('.announcement-bar__track')?.setAttribute(
      'aria-live',
      this.shouldPlay() ? 'off' : 'polite'
    );
  }

  shouldPlay() {
    return (
      !this.userPaused &&
      !this.hovered &&
      !this.focused &&
      !document.hidden &&
      !this.reducedMotion.matches
    );
  }

  sync = () => {
    this.stop();
    if (this.shouldPlay()) {
      this.timer = window.setInterval(() => this.go(this.index + 1), this.interval);
    }
  };

  stop() {
    window.clearInterval(this.timer);
  }
}

if (!customElements.get('announcement-bar')) {
  customElements.define('announcement-bar', AnnouncementBar);
}
