/**
 * <cart-drawer>: the slide out cart.
 * - Opens from the header cart link and after anything is added (`cart:added`).
 * - Quantity and remove go through /cart/change.js with `sections`, so the
 *   drawer's HTML comes back already rendered by Shopify in the same request.
 * - Gift wrap is a cart attribute, the card note is the cart note (/cart/update.js).
 * - Focus stays on the control the shopper used, even after the HTML is swapped.
 */
import { addToCart, announce, updateCartCount } from './cart.js';

const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('[data-drawer]');
    this.sectionId = this.dataset.sectionId;
    this.openOnAdd = document.body.dataset.cartOpenOnAdd !== 'false';

    document.querySelectorAll('[data-cart-link]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(link);
      });
    });

    document.addEventListener('cart:change', this.onCartChange);
    document.addEventListener('cart:added', this.onCartAdded);

    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
    this.addEventListener('input', this.onInput);
    this.addEventListener('submit', this.onSubmit);
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.close();
    });
  }

  disconnectedCallback() {
    document.removeEventListener('cart:change', this.onCartChange);
    document.removeEventListener('cart:added', this.onCartAdded);
  }

  /* ---------- Open and close ---------- */
  open(opener = document.activeElement) {
    this.opener = opener;
    if (!this.dialog.open) this.dialog.showModal();
    requestAnimationFrame(() => this.dialog.classList.add('is-open'));
    this.dialog.querySelector('[data-drawer-close]')?.focus();
  }

  close() {
    if (!this.dialog.open) return;
    this.dialog.classList.remove('is-open');
    const finish = () => {
      if (!this.dialog.classList.contains('is-open')) this.dialog.close();
      if (this.opener && document.contains(this.opener)) this.opener.focus();
    };
    if (reducedMotion.matches) finish();
    else window.setTimeout(finish, 500);
  }

  /* ---------- Keep in sync with adds made elsewhere ---------- */
  onCartChange = () => {
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.refresh(), 30);
  };

  onCartAdded = async () => {
    await this.refresh();
    if (this.openOnAdd) this.open(document.activeElement);
  };

  async refresh() {
    try {
      const response = await fetch(`${root}?sections=${this.sectionId}`);
      const data = await response.json();
      this.render(data[this.sectionId]);
    } catch (error) {
      /* keep what is shown */
    }
  }

  render(html) {
    if (!html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-drawer-content]');
    const current = this.querySelector('[data-drawer-content]');
    if (!fresh || !current) return;

    // Remember where focus was so we can put it back on the same control.
    const active = document.activeElement;
    const activeLine = active?.closest('[data-key]')?.dataset.key;
    const activeRole = active?.matches('[data-quantity-input]')
      ? 'input'
      : active?.dataset.change !== undefined
        ? `change-${[...(active.closest('[data-key]')?.querySelectorAll('[data-change]') || [])].indexOf(active)}`
        : null;
    const scroll = current.querySelector('.cart-drawer__body')?.scrollTop || 0;

    current.innerHTML = fresh.innerHTML;

    const body = current.querySelector('.cart-drawer__body');
    if (body) body.scrollTop = scroll;

    if (this.dialog.open && current.contains(active) === false) {
      const line = activeLine && current.querySelector(`[data-key="${CSS.escape(activeLine)}"]`);
      let target = null;
      if (line && activeRole === 'input') target = line.querySelector('[data-quantity-input]');
      else if (line && activeRole?.startsWith('change-')) {
        target = line.querySelectorAll('[data-change]')[Number(activeRole.split('-')[1])];
      }
      (target || current.querySelector('[data-drawer-close]'))?.focus();
    }
  }

  /* ---------- Quantity and remove ---------- */
  onClick = (event) => {
    if (event.target.closest('[data-drawer-close]')) {
      this.close();
      return;
    }
    const button = event.target.closest('[data-change]');
    if (!button) return;
    const line = button.closest('[data-line]');
    this.changeLine(line, Number(button.dataset.change));
  };

  onChange = (event) => {
    if (event.target.matches('[data-quantity-input]')) {
      const value = Math.max(0, parseInt(event.target.value, 10) || 0);
      this.changeLine(event.target.closest('[data-line]'), value);
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

  async changeLine(line, quantity) {
    if (!line) return;
    const error = line.querySelector('[data-line-error]');
    line.setAttribute('aria-busy', 'true');
    line.classList.add('is-busy');
    if (error) error.hidden = true;

    try {
      const response = await fetch(`${root}cart/change.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(line.dataset.line), quantity, sections: this.sectionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.description || data.message);
      this.render(data.sections?.[this.sectionId]);
      updateCartCount(data.item_count);
      announce(this.dataset.labelUpdated || 'Cart updated.');
    } catch (err) {
      line.removeAttribute('aria-busy');
      line.classList.remove('is-busy');
      if (error) {
        error.textContent = err.message || this.dataset.labelError || 'Could not update your cart.';
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
      /* the note and gift wrap are saved again on the next change */
    }
  }

  /* ---------- "Pairs well" quick add inside the drawer ---------- */
  onSubmit = async (event) => {
    const form = event.target.closest('[data-pair-form]');
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      await addToCart(new FormData(form), { open: false });
    } catch (error) {
      button.disabled = false;
    }
  };
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
