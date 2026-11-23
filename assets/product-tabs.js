/**
 * <product-tabs>: ARIA tabs. Click or Left/Right/Home/End to switch.
 * Panels are visible without JavaScript; this hides the inactive ones.
 */
class ProductTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('[role="tab"]')];
    if (!this.tabs.length) return;
    this.tabs.forEach((tab) => tab.addEventListener('click', () => this.select(tab)));
    this.querySelector('[role="tablist"]')?.addEventListener('keydown', this.onKeydown);
  }

  onKeydown = (event) => {
    const index = this.tabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = this.tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    this.select(this.tabs[next]);
    this.tabs[next].focus();
  };

  select(selected) {
    this.tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = this.querySelector(`#${tab.getAttribute('aria-controls')}`);
      if (!panel) return;
      panel.toggleAttribute('data-inactive', !active);
      if (active) {
        panel.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
      }
    });
  }
}

if (!customElements.get('product-tabs')) {
  customElements.define('product-tabs', ProductTabs);
}
