/**
 * <validated-form>: checks required fields and email format before submit and
 * shows a specific message under each field (skill B9, B10). Fields opt in
 * with `required` and data-error-required / data-error-email texts. Also
 * moves focus to a success message after Shopify reloads the page.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ValidatedForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.form?.addEventListener('submit', this.onSubmit);
    this.form?.addEventListener('input', (event) => {
      if (event.target.getAttribute('aria-invalid') === 'true') this.check(event.target, false);
    });
    this.querySelector('[data-focus-on-load]')?.focus();
  }

  check(field, show) {
    const value = field.value.trim();
    let message = '';
    if (field.required && !value) message = field.dataset.errorRequired || '';
    else if (field.type === 'email' && value && !EMAIL.test(value)) message = field.dataset.errorEmail || '';

    const error = document.getElementById(`${field.id}-error`);
    if (message && show) {
      field.setAttribute('aria-invalid', 'true');
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
    } else if (!message) {
      field.removeAttribute('aria-invalid');
      if (error) error.hidden = true;
    }
    return !message;
  }

  onSubmit = (event) => {
    const fields = [...this.form.querySelectorAll('[required], input[type="email"]')];
    const invalid = fields.filter((field) => !this.check(field, true));
    if (invalid.length) {
      event.preventDefault();
      invalid[0].focus();
    }
  };
}

if (!customElements.get('validated-form')) customElements.define('validated-form', ValidatedForm);
