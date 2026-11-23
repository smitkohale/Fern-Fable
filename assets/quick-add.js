/**
 * <quick-add>: adds to the cart without leaving the page.
 * Plain form posts keep working if this script never loads.
 */
import { addToCart, announce } from './cart.js';

class QuickAdd extends HTMLElement {
  connectedCallback() {
    this.details = this.querySelector('details');
    this.status = this.querySelector('[role="status"]');
    this.addEventListener('submit', this.onSubmit);
    this.addEventListener('keydown', this.onKeydown);
    this.details?.addEventListener('toggle', this.onToggle);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onOutsideClick);
  }

  onToggle = () => {
    if (this.details.open) {
      document.addEventListener('click', this.onOutsideClick);
      this.details.querySelector('.quick-add__chip:not([disabled])')?.focus();
    } else {
      document.removeEventListener('click', this.onOutsideClick);
    }
  };

  onOutsideClick = (event) => {
    if (!this.contains(event.target)) this.close();
  };

  onKeydown = (event) => {
    if (event.key === 'Escape' && this.details?.open) {
      event.stopPropagation();
      this.close(true);
    }
  };

  close(restoreFocus = false) {
    if (!this.details) return;
    this.details.open = false;
    if (restoreFocus) this.details.querySelector('summary')?.focus();
  }

  onSubmit = async (event) => {
    const form = event.target.closest('form');
    if (!form) return;
    event.preventDefault();

    const submitter = event.submitter;
    const formData = new FormData(form);
    if (submitter && submitter.name) formData.set(submitter.name, submitter.value);

    const trigger = this.details ? this.details.querySelector('summary') : submitter;
    const label = trigger?.querySelector('[data-quick-add-label]');
    const originalLabel = label?.textContent;

    this.setBusy(true, submitter, label);
    this.hideStatus();

    try {
      await addToCart(formData);
      this.close(Boolean(this.details));
      if (label) label.textContent = this.dataset.labelAdded;
      trigger?.classList.add('is-added');
      announce(this.dataset.labelAnnounce);
      window.setTimeout(() => {
        if (label) label.textContent = originalLabel;
        trigger?.classList.remove('is-added');
      }, 2000);
    } catch (error) {
      if (label) label.textContent = originalLabel;
      this.showStatus(error.message || this.dataset.labelError);
    } finally {
      this.setBusy(false, submitter);
    }
  };

  setBusy(busy, submitter, label) {
    this.toggleAttribute('aria-busy', busy);
    if (submitter) submitter.disabled = busy;
    if (busy && label) label.textContent = this.dataset.labelAdding;
  }

  showStatus(message) {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.hidden = false;
  }

  hideStatus() {
    if (this.status) this.status.hidden = true;
  }
}

if (!customElements.get('quick-add')) {
  customElements.define('quick-add', QuickAdd);
}
