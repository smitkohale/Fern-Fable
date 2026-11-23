/**
 * <predictive-search>: the search overlay.
 * - Opens from any [data-search-open] link (the header icon and the mobile menu).
 * - Typing asks /search/suggest for the predictive-search section (debounced,
 *   cancels stale requests, caches answers) and shows it as a listbox.
 * - Combobox keys: Down/Up move through results, Enter opens the highlighted
 *   one (or searches), Escape clears the text first, then closes.
 */
const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('[data-search-dialog]');
    this.input = this.querySelector('[data-search-input]');
    this.results = this.querySelector('[data-search-results]');
    this.start = this.querySelector('[data-search-start]');
    this.status = this.querySelector('[data-search-status]');
    this.cache = new Map();

    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-search-open]');
      if (!opener) return;
      event.preventDefault();
      this.open(opener);
    });

    this.input.addEventListener('input', this.onInput);
    this.input.addEventListener('keydown', this.onKeydown);
    this.querySelector('[data-search-close]')?.addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.close();
    });
    this.querySelectorAll('[data-search-term]').forEach((chip) => {
      chip.addEventListener('click', (event) => {
        event.preventDefault();
        this.input.value = chip.dataset.searchTerm;
        this.input.focus();
        this.search(this.input.value);
      });
    });
  }

  open(opener) {
    this.opener = opener;
    // Close the mobile menu first if the search was opened from it.
    document.querySelectorAll('dialog[open]').forEach((d) => {
      if (d !== this.dialog) d.close();
    });
    this.dialog.showModal();
    requestAnimationFrame(() => this.dialog.classList.add('is-open'));
    this.input.focus();
    this.input.select();
  }

  close() {
    this.dialog.classList.remove('is-open');
    this.dialog.close();
    this.setExpanded(false);
    if (this.opener && document.contains(this.opener)) this.opener.focus();
  }

  onInput = () => {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.search(this.input.value), 250);
  };

  async search(value) {
    const term = value.trim();
    if (!term) {
      this.results.innerHTML = '';
      this.start.hidden = false;
      this.setExpanded(false);
      return;
    }
    this.start.hidden = true;

    if (this.cache.has(term)) {
      this.render(this.cache.get(term));
      return;
    }

    this.controller?.abort();
    this.controller = new AbortController();
    const url = `${root}search/suggest?q=${encodeURIComponent(term)}&section_id=predictive-search&resources[type]=product,collection,page,query&resources[limit]=4&resources[limit_scope]=each&resources[options][fields]=title,product_type,tag,variants.title,vendor`;

    this.results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { signal: this.controller.signal });
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, 'text/html').querySelector('[data-predictive-results]');
      const markup = html ? html.outerHTML : '';
      this.cache.set(term, markup);
      if (this.input.value.trim() === term) this.render(markup);
    } catch (error) {
      if (error.name !== 'AbortError') this.results.innerHTML = '';
    } finally {
      this.results.removeAttribute('aria-busy');
    }
  }

  render(markup) {
    this.results.innerHTML = markup;
    this.activeIndex = -1;
    this.input.removeAttribute('aria-activedescendant');
    this.setExpanded(Boolean(markup));
    const count = this.results.querySelector('[data-predictive-results]')?.dataset.count || '0';
    if (this.status) this.status.textContent = (this.dataset.statusTemplate || '[count] products found').replace('[count]', count);
  }

  setExpanded(expanded) {
    this.input.setAttribute('aria-expanded', String(expanded));
  }

  get options() {
    return [...this.results.querySelectorAll('[role="option"]')];
  }

  onKeydown = (event) => {
    const options = this.options;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex = (this.activeIndex + step + options.length) % options.length;
      options.forEach((option, i) => option.setAttribute('aria-selected', String(i === this.activeIndex)));
      const active = options[this.activeIndex];
      this.input.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && this.activeIndex >= 0 && options[this.activeIndex]) {
      event.preventDefault();
      window.location.href = options[this.activeIndex].href;
    } else if (event.key === 'Escape' && this.input.value) {
      event.preventDefault();
      event.stopPropagation();
      this.input.value = '';
      this.search('');
    }
  };
}

if (!customElements.get('predictive-search')) {
  customElements.define('predictive-search', PredictiveSearch);
}
