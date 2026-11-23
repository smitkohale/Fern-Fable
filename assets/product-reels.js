/**
 * <product-reels>: muted videos play only while mostly on screen, pause when
 * scrolled away or when the tab is hidden, and each has its own pause button
 * (WCAG 2.2.2). Reduced motion or Save Data: nothing plays on its own; the
 * button plays a reel on request. Arrow buttons scroll the row by one reel.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = Boolean(navigator.connection && navigator.connection.saveData);

class ProductReels extends HTMLElement {
  connectedCallback() {
    this.list = this.querySelector('[data-reels-list]');
    this.reels = [...this.querySelectorAll('[data-reel]')]
      .map((reel) => ({
        element: reel,
        video: reel.querySelector('video'),
        toggle: reel.querySelector('[data-reel-toggle]'),
        visible: false,
        userPaused: false,
        userPlayed: false,
      }))
      .filter((reel) => reel.video);

    this.autoplay = !reducedMotion.matches && !saveData;

    this.reels.forEach((reel) => {
      reel.video.muted = true;
      reel.video.setAttribute('muted', '');
      reel.toggle?.addEventListener('click', () => this.onToggle(reel));
      reel.video.addEventListener('play', () => this.setState(reel, true));
      reel.video.addEventListener('pause', () => this.setState(reel, false));
    });

    if (this.reels.length && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const reel = this.reels.find((r) => r.element === entry.target);
            if (!reel) return;
            reel.visible = entry.intersectionRatio >= 0.6;
            this.sync(reel);
          });
        },
        { threshold: [0, 0.6, 1] }
      );
      this.reels.forEach((reel) => this.observer.observe(reel.element));
    }

    document.addEventListener('visibilitychange', this.onVisibility);

    this.querySelectorAll('[data-scroll]').forEach((button) => {
      button.addEventListener('click', () => this.scrollRow(Number(button.dataset.scroll)));
    });
    this.list?.addEventListener('scroll', this.updateArrows, { passive: true });
    this.updateArrows();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  shouldPlay(reel) {
    if (document.hidden || !reel.visible || reel.userPaused) return false;
    return this.autoplay || reel.userPlayed;
  }

  sync(reel) {
    if (this.shouldPlay(reel)) {
      if (reel.video.paused) {
        reel.video.preload = 'auto';
        reel.video.play().catch(() => this.setState(reel, false));
      }
    } else if (!reel.video.paused) {
      reel.video.pause();
    }
  }

  onToggle(reel) {
    if (reel.video.paused) {
      reel.userPaused = false;
      reel.userPlayed = true;
      reel.visible = true;
    } else {
      reel.userPaused = true;
      reel.userPlayed = false;
    }
    this.sync(reel);
  }

  setState(reel, playing) {
    if (!reel.toggle) return;
    reel.toggle.setAttribute('aria-pressed', String(playing));
    reel.toggle.setAttribute(
      'aria-label',
      playing ? reel.toggle.dataset.labelPause : reel.toggle.dataset.labelPlay
    );
    reel.element.classList.toggle('is-playing', playing);
  }

  onVisibility = () => this.reels.forEach((reel) => this.sync(reel));

  scrollRow(direction) {
    const item = this.list?.querySelector('.reels__item');
    if (!item) return;
    const gap = parseFloat(getComputedStyle(this.list).columnGap) || 0;
    this.list.scrollBy({
      left: direction * (item.getBoundingClientRect().width + gap),
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }

  updateArrows = () => {
    if (!this.list) return;
    const max = this.list.scrollWidth - this.list.clientWidth - 2;
    this.querySelectorAll('[data-scroll]').forEach((button) => {
      const atEnd = Number(button.dataset.scroll) < 0 ? this.list.scrollLeft <= 2 : this.list.scrollLeft >= max;
      button.setAttribute('aria-disabled', String(atEnd));
    });
  };
}

if (!customElements.get('product-reels')) {
  customElements.define('product-reels', ProductReels);
}
