/**
 * <newsletter-form>: client side checks for the email field.
 * Shows a specific inline error and blocks submit until the email looks valid.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class NewsletterForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.input = this.querySelector('input[type="email"]');
    this.message = this.querySelector('.newsletter-form__message--error');
    this.text = this.message?.querySelector('[data-error-text]');
    if (!this.form || !this.input || !this.message) return;

    this.form.addEventListener('submit', this.onSubmit);
    this.input.addEventListener('input', () => {
      if (this.input.getAttribute('aria-invalid') === 'true' && this.validate(false)) {
        this.clearError();
      }
    });

    // After a successful post the page reloads at the form: move focus to the message.
    this.querySelector('.newsletter-form__message--success')?.focus();
  }

  onSubmit = (event) => {
    if (!this.validate(true)) {
      event.preventDefault();
      this.input.focus();
    }
  };

  validate(show) {
    const value = this.input.value.trim();
    let error = '';
    if (!value) error = this.input.dataset.errorRequired;
    else if (!EMAIL_PATTERN.test(value)) error = this.input.dataset.errorEmail;

    if (error && show) this.showError(error);
    return !error;
  }

  showError(text) {
    this.text.textContent = text;
    this.message.hidden = false;
    this.input.setAttribute('aria-invalid', 'true');
  }

  clearError() {
    this.message.hidden = true;
    this.input.removeAttribute('aria-invalid');
  }
}

if (!customElements.get('newsletter-form')) {
  customElements.define('newsletter-form', NewsletterForm);
}
