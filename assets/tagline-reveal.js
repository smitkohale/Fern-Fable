/**
 * <tagline-reveal>: words light up one by one, in reading order, as the text
 * scrolls up through the viewport, and dim again when scrolled back.
 * The scroll listener is only attached while the section is on screen and is
 * throttled to one run per animation frame (skill B7, B11).
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
/* The text's top travels from 80% to 30% of the viewport while the words light up. */
const START = 0.8;
const END = 0.3;

class TaglineReveal extends HTMLElement {
  connectedCallback() {
    this.words = [...this.querySelectorAll('[data-word]')];
    this.text = this.querySelector('.tagline-reveal__text');
    if (!this.words.length) return;

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      this.lightAll();
      return;
    }

    this.classList.add('is-interactive');
    this.ticking = false;
    this.observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll, { passive: true });
        this.update();
      } else {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
        this.update();
      }
    });
    this.observer.observe(this);
    reducedMotion.addEventListener('change', this.onMotionChange);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    reducedMotion.removeEventListener('change', this.onMotionChange);
  }

  onMotionChange = () => {
    if (reducedMotion.matches) {
      this.observer?.disconnect();
      window.removeEventListener('scroll', this.onScroll);
      this.lightAll();
    }
  };

  onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  };

  update() {
    // Spread the reveal over half a screen of scrolling, whatever the line count:
    // it starts when the text's top reaches START and ends when it reaches END.
    const height = window.innerHeight;
    const top = this.text.getBoundingClientRect().top;
    const start = height * START;
    const end = height * END;
    const progress = Math.min(Math.max((start - top) / (start - end), 0), 1);
    const litCount = Math.round(progress * this.words.length);
    // Reading order: the first litCount words are lit.
    this.words.forEach((word, index) => word.classList.toggle('is-lit', index < litCount));
  }

  lightAll() {
    this.classList.remove('is-interactive');
    this.words.forEach((word) => word.classList.add('is-lit'));
  }
}

if (!customElements.get('tagline-reveal')) {
  customElements.define('tagline-reveal', TaglineReveal);
}
