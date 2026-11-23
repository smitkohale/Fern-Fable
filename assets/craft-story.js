/**
 * <craft-story>: works out how far the reader has scrolled through the steps
 * (0 to 1), marks the current step and tells the 3D block (if any) through a
 * `craft:progress` event. Scroll work runs only while the section is on screen,
 * once per animation frame. Content is fully readable without this script.
 */
class CraftStory extends HTMLElement {
  connectedCallback() {
    this.stepsList = this.querySelector('.craft__steps');
    this.steps = [...this.querySelectorAll('[data-step]')];
    this.dots = [...this.querySelectorAll('[data-progress-step]')];
    if (!this.stepsList || !this.steps.length) return;

    this.ticking = false;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          window.addEventListener('scroll', this.onScroll, { passive: true });
          window.addEventListener('resize', this.onScroll, { passive: true });
        } else {
          window.removeEventListener('scroll', this.onScroll);
          window.removeEventListener('resize', this.onScroll);
        }
        this.update();
      },
      { rootMargin: '200px 0px' }
    );
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }

  onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  };

  update() {
    // 0 when the first step's top reaches the middle of the screen,
    // 1 when the last step's bottom does.
    const rect = this.stepsList.getBoundingClientRect();
    const middle = window.innerHeight * 0.55;
    const progress = Math.min(Math.max((middle - rect.top) / rect.height, 0), 1);
    const active = Math.min(this.steps.length - 1, Math.floor(progress * this.steps.length));

    if (active !== this.active) {
      this.active = active;
      this.steps.forEach((step, i) => step.classList.toggle('is-active', i === active));
      this.dots.forEach((dot, i) => dot.classList.toggle('is-active', i <= active));
    }

    this.progress = progress;
    this.dispatchEvent(new CustomEvent('craft:progress', { detail: { progress } }));
  }
}

if (!customElements.get('craft-story')) {
  customElements.define('craft-story', CraftStory);
}
