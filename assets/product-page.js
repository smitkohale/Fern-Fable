/**
 * Product page behaviour.
 * <variant-picker>: works out the chosen variant from the option fields, marks
 *   values that are sold out with the current selection, and fires
 *   `variant:change` with the variant (or null for a combination that does not exist).
 * <product-page>: reacts to that (price, stock, button, hidden id, URL, photo),
 *   adds to cart in place, runs the quantity stepper, the zoom dialog, the
 *   phone gallery counter, the sticky add bar and 3D/AR models.
 */
import { addToCart, announce } from './cart.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 990px)');

class VariantPicker extends HTMLElement {
  connectedCallback() {
    try {
      this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
    } catch (error) {
      this.variants = [];
    }
    this.addEventListener('change', this.onChange);
    this.markAvailability();
  }

  selectedOptions() {
    const options = [];
    this.querySelectorAll('select[data-option-index]').forEach((select) => {
      options[Number(select.dataset.optionIndex)] = select.value;
    });
    this.querySelectorAll('input[type="radio"][data-option-index]:checked').forEach((input) => {
      options[Number(input.dataset.optionIndex)] = input.value;
    });
    return options;
  }

  onChange = (event) => {
    const field = event.target.closest('[data-option-index]');
    if (!field) return;
    const options = this.selectedOptions();
    const variant = this.variants.find((v) => v.options.every((value, i) => value === options[i])) || null;

    const legendValue = field.closest('fieldset')?.querySelector('[data-selected-value]');
    if (legendValue) legendValue.textContent = field.value;

    this.markAvailability();
    this.dispatchEvent(new CustomEvent('variant:change', { bubbles: true, detail: { variant } }));
  };

  /* A value is available if some in stock variant has it together with the other current choices. */
  markAvailability() {
    const options = this.selectedOptions();
    const isAvailable = (index, value) =>
      this.variants.some(
        (v) => v.available && v.options[index] === value && v.options.every((o, i) => i === index || o === options[i])
      );

    this.querySelectorAll('input[type="radio"][data-option-index]').forEach((input) => {
      const available = isAvailable(Number(input.dataset.optionIndex), input.value);
      const chip = input.closest('.variant-chip');
      chip?.classList.toggle('is-unavailable', !available);
      const status = chip?.querySelector('[data-chip-status]');
      if (status) status.textContent = available ? '' : `, ${this.dataset.soldOut || 'Sold out'}`;
    });
  }
}

class ProductPage extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form[action*="/cart/add"]');
    this.idInput = this.querySelector('[data-variant-id]');
    this.addButton = this.querySelector('[data-add-button]');
    this.status = this.querySelector('[data-form-status]');

    this.addEventListener('variant:change', (event) => this.onVariantChange(event.detail.variant));
    this.form?.addEventListener('submit', this.onSubmit);
    this.initQuantity();
    this.initGallery();
    this.initLightbox();
    this.initStickyBar();
    this.initModels();

    const picker = this.querySelector('variant-picker');
    if (picker && this.addButton) picker.dataset.soldOut = this.addButton.dataset.labelSoldOut;
  }

  /* ---------- Variant change ---------- */
  onVariantChange(variant) {
    const button = this.addButton;
    const sticky = this.querySelector('[data-sticky-add]');
    const label = button?.querySelector('[data-add-label]');

    if (!variant) {
      if (button) button.disabled = true;
      if (label) label.textContent = this.dataset.labelUnavailable || button.dataset.labelSoldOut;
      if (sticky) sticky.disabled = true;
      return;
    }

    if (this.idInput) this.idInput.value = variant.id;

    this.querySelectorAll('[data-price], [data-sticky-price]').forEach((el) => {
      el.innerHTML = variant.price;
    });

    if (button) {
      button.disabled = !variant.available;
      if (label) label.textContent = variant.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
    }
    if (sticky) {
      sticky.disabled = !variant.available;
      sticky.textContent = variant.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
    }

    const stock = this.querySelector('[data-stock]');
    const stockText = this.querySelector('[data-stock-text]');
    if (stock && stockText) {
      stock.hidden = !variant.low;
      if (variant.low) stockText.textContent = (this.dataset.lowStock || 'Only [count] left').replace('[count]', variant.low);
    }

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);

    if (variant.media) this.showMedia(variant.media);
  }

  showMedia(mediaId) {
    const item = this.querySelector(`[data-media-id="${mediaId}"]`);
    const list = this.querySelector('[data-media-list]');
    if (!item || !list) return;
    this.querySelectorAll('[data-media-id][data-current]').forEach((el) => el.removeAttribute('data-current'));
    item.setAttribute('data-current', '');
    if (desktop.matches) {
      // Desktop: bring the variant's photo to the top of the stack.
      list.prepend(item);
      if (!reducedMotion.matches) {
        item.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    } else {
      list.scrollTo({ left: item.offsetLeft - list.offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }

  /* ---------- Add to cart ---------- */
  onSubmit = async (event) => {
    event.preventDefault();
    const button = this.addButton;
    const label = button?.querySelector('[data-add-label]');
    if (!button || button.disabled) return;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = button.dataset.labelAdding;
    this.status.hidden = true;

    try {
      await addToCart(new FormData(this.form));
      if (label) label.textContent = button.dataset.labelAdded;
      button.classList.add('is-added');
      const title = this.querySelector('.product__title')?.textContent.trim() || '';
      announce(`${title} ${this.dataset.addedSuffix || 'added to your cart.'}`);
      window.setTimeout(() => {
        if (label) label.textContent = button.dataset.labelAdd;
        button.classList.remove('is-added');
      }, 2000);
    } catch (error) {
      if (label) label.textContent = button.dataset.labelAdd;
      this.status.textContent = error.message;
      this.status.hidden = false;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  };

  /* ---------- Quantity stepper ---------- */
  initQuantity() {
    const wrap = this.querySelector('[data-quantity]');
    const input = wrap?.querySelector('input');
    if (!input) return;
    wrap.addEventListener('click', (event) => {
      const step = event.target.closest('[data-step]');
      if (!step) return;
      const min = Number(input.min) || 1;
      const max = Number(input.max) || 99;
      const next = Math.min(max, Math.max(min, (Number(input.value) || min) + Number(step.dataset.step)));
      input.value = next;
    });
  }

  /* ---------- Phone gallery counter ---------- */
  initGallery() {
    const list = this.querySelector('[data-media-list]');
    const current = this.querySelector('[data-media-current]');
    if (!list || !current) return;
    let ticking = false;
    list.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const index = Math.round(list.scrollLeft / Math.max(list.clientWidth, 1));
          current.textContent = String(Math.min(index + 1, list.children.length));
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Zoom ---------- */
  initLightbox() {
    const dialog = this.querySelector('[data-lightbox]');
    if (!dialog) return;
    const items = [...dialog.querySelectorAll('[data-lightbox-item]')];
    let opener = null;

    this.querySelectorAll('[data-zoom]').forEach((button) => {
      button.addEventListener('click', () => {
        opener = button;
        dialog.showModal();
        items[Number(button.dataset.zoom)]?.scrollIntoView({ block: 'start' });
      });
    });
    const close = () => {
      dialog.close();
      opener?.focus();
    };
    dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
  }

  /* ---------- Sticky add bar (phones) ---------- */
  initStickyBar() {
    // A scroll check (once per frame) rather than an IntersectionObserver: a jump
    // past the button (anchor link, fast fling) never crosses the viewport, so an
    // observer would miss it.
    const bar = this.querySelector('[data-sticky-bar]');
    if (!bar || !this.addButton) return;
    let ticking = false;
    let shown = false;
    const update = () => {
      ticking = false;
      const show = !desktop.matches && this.addButton.getBoundingClientRect().bottom < 0;
      if (show === shown) return;
      shown = show;
      bar.classList.toggle('is-visible', show);
      bar.toggleAttribute('inert', !show);
      bar.setAttribute('aria-hidden', String(!show));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------- 3D models and AR (Shopify's own viewer UI) ---------- */
  initModels() {
    const data = this.querySelector('[data-models]');
    if (!data || !window.Shopify || !window.Shopify.loadFeatures) return;
    window.Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: () => {
          try {
            window.ShopifyXR.addModels(JSON.parse(data.textContent));
            window.ShopifyXR.setupXRElements();
          } catch (error) {
            /* AR is optional */
          }
        },
      },
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: () => {
          this.querySelectorAll('model-viewer').forEach((viewer) => {
            if (window.Shopify.ModelViewerUI) new window.Shopify.ModelViewerUI(viewer);
          });
        },
      },
    ]);
  }
}

if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
if (!customElements.get('product-page')) customElements.define('product-page', ProductPage);
