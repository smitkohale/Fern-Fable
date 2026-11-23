/**
 * <shop-the-look>: hotspot cards and "Add the whole look".
 * - One card open at a time. Escape or an outside click closes it and returns
 *   focus to its dot.
 * - Hovering or focusing a list item highlights its dot, and the other way round.
 * - The whole look posts every included variant in one /cart/add.js call.
 */
import { addToCart, announce } from './cart.js';

class ShopTheLook extends HTMLElement {
  connectedCallback() {
    this.hotspots = [...this.querySelectorAll('[data-hotspot]')];
    this.openHotspot = null;

    this.hotspots.forEach((hotspot) => {
      hotspot.querySelector('[data-dot]').addEventListener('click', () => {
        if (this.openHotspot === hotspot) this.close();
        else this.open(hotspot);
      });
      hotspot.querySelector('[data-close]')?.addEventListener('click', () => this.close(true));
      hotspot.addEventListener('pointerenter', () => this.highlight(hotspot.dataset.hotspot, true));
      hotspot.addEventListener('pointerleave', () => this.highlight(hotspot.dataset.hotspot, false));
    });

    this.querySelectorAll('[data-item]').forEach((item) => {
      const on = () => this.highlight(item.dataset.item, true);
      const off = () => this.highlight(item.dataset.item, false);
      item.addEventListener('pointerenter', on);
      item.addEventListener('pointerleave', off);
      item.addEventListener('focusin', on);
      item.addEventListener('focusout', off);
    });

    this.addEventListener('keydown', this.onKeydown);
    document.addEventListener('click', this.onDocumentClick);

    this.form = this.querySelector('[data-look-form]');
    this.form?.addEventListener('submit', this.onLookSubmit);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  open(hotspot) {
    this.close();
    const dot = hotspot.querySelector('[data-dot]');
    const card = hotspot.querySelector('[data-card]');
    this.openHotspot = hotspot;
    hotspot.classList.add('is-open');
    dot.setAttribute('aria-expanded', 'true');
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add('is-visible'));
  }

  close(restoreFocus = false) {
    const hotspot = this.openHotspot;
    if (!hotspot) return;
    const dot = hotspot.querySelector('[data-dot]');
    const card = hotspot.querySelector('[data-card]');
    this.openHotspot = null;
    hotspot.classList.remove('is-open');
    dot.setAttribute('aria-expanded', 'false');
    card.classList.remove('is-visible');
    card.hidden = true;
    if (restoreFocus) dot.focus();
  }

  highlight(index, on) {
    this.querySelector(`[data-hotspot="${index}"]`)?.classList.toggle('is-highlighted', on);
    this.querySelector(`[data-item="${index}"]`)?.classList.toggle('is-highlighted', on);
  }

  onKeydown = (event) => {
    if (event.key !== 'Escape' || !this.openHotspot) return;
    // Let an open quick add panel inside the card close first.
    if (this.openHotspot.querySelector('details[open]')) return;
    this.close(true);
  };

  onDocumentClick = (event) => {
    if (this.openHotspot && !this.openHotspot.contains(event.target)) this.close();
  };

  onLookSubmit = async (event) => {
    event.preventDefault();
    const button = this.form.querySelector('button[type="submit"]');
    const label = button.querySelector('[data-label]');
    const status = this.form.querySelector('[data-look-status]');
    const original = label.textContent;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = button.dataset.labelAdding;
    status.hidden = true;

    try {
      await addToCart(new FormData(this.form));
      label.textContent = button.dataset.labelAdded;
      button.classList.add('is-added');
      announce(button.dataset.labelAnnounce);
      window.setTimeout(() => {
        label.textContent = original;
        button.classList.remove('is-added');
      }, 2500);
    } catch (error) {
      label.textContent = original;
      status.textContent = error.message;
      status.hidden = false;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  };
}

if (!customElements.get('shop-the-look')) {
  customElements.define('shop-the-look', ShopTheLook);
}
