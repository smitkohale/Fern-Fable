/**
 * <cart-page>: quantity and remove without reloading (/cart/change.js with
 * `sections`, so Shopify returns this section already rendered). Gift wrap and
 * the note save on their own. Without JavaScript the form posts normally.
 */
import { announce, updateCartCount } from './cart.js';

const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

class CartPage extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
    this.addEventListener('input', this.onInput);
  }

  onClick = (event) => {
    const control = event.target.closest('[data-change]');
    if (!control) return;
    event.preventDefault();
    this.changeLine(control.closest('[data-line]'), Number(control.dataset.change), control);
  };

  onChange = (event) => {
    if (event.target.matches('[data-quantity-input]')) {
      this.changeLine(event.target.closest('[data-line]'), Math.max(0, parseInt(event.target.value, 10) || 0), event.target);
    }
    if (event.target.matches('[data-gift-wrap]')) {
      this.update({ attributes: { 'Gift wrap': event.target.checked ? 'Yes' : '' } });
    }
  };

  onInput = (event) => {
    if (!event.target.matches('[data-cart-note]')) return;
    window.clearTimeout(this.noteTimer);
    const note = event.target.value;
    this.noteTimer = window.setTimeout(() => this.update({ note }), 600);
  };

  async changeLine(line, quantity, control) {
    if (!line) return;
    const key = line.dataset.key;
    const controlIndex = [...line.querySelectorAll('[data-change], [data-quantity-input]')].indexOf(control);
    const error = line.querySelector('[data-line-error]');
    line.classList.add('is-busy');
    line.setAttribute('aria-busy', 'true');
    if (error) error.hidden = true;

    try {
      const response = await fetch(`${root}cart/change.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(line.dataset.line), quantity, sections: this.sectionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message);

      const doc = new DOMParser().parseFromString(data.sections[this.sectionId], 'text/html');
      const fresh = doc.querySelector('[data-cart-content]');
      const current = this.querySelector('[data-cart-content]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;

      updateCartCount(data.item_count);
      document.dispatchEvent(new CustomEvent('cart:change', { detail: data }));
      announce(this.dataset.labelUpdated || 'Cart updated.');

      // Put focus back on the same control of the same line, or on the title if it was removed.
      const sameLine = this.querySelector(`[data-key="${CSS.escape(key)}"]`);
      const target = sameLine?.querySelectorAll('[data-change], [data-quantity-input]')[controlIndex];
      (target || this.querySelector('.cart-page__title'))?.focus?.();
    } catch (err) {
      line.classList.remove('is-busy');
      line.removeAttribute('aria-busy');
      if (error) {
        error.textContent = err.message;
        error.hidden = false;
      }
    }
  }

  async update(body) {
    try {
      await fetch(`${root}cart/update.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      /* saved with the form on checkout anyway */
    }
  }
}

if (!customElements.get('cart-page')) customElements.define('cart-page', CartPage);
