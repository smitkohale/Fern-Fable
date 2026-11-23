/**
 * <collection-filters>: filters, sort, active filter pills and "Load more",
 * all without reloading. Each change builds the URL from the filter form,
 * fetches this section with ?section_id= (Section Rendering API) and swaps
 * in the fresh filters, toolbar and results. The URL is updated so the
 * filtered page can be shared and Back works.
 * On phones the filters open in a full height sheet (<dialog>).
 */
const desktop = window.matchMedia('(min-width: 990px)');

class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;

    this.addEventListener('change', this.onChange);
    this.addEventListener('input', this.onInput);
    this.addEventListener('click', this.onClick);
    this.addEventListener('submit', (event) => {
      if (event.target.matches('[data-filter-form]')) {
        event.preventDefault();
        this.applyForm();
      }
    });
    window.addEventListener('popstate', this.onPopState);

    this.sheet = this.querySelector('[data-filter-sheet]');
    this.sheet?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeSheet();
    });
    desktop.addEventListener('change', () => this.closeSheet(false));
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.onPopState);
  }

  get form() {
    return this.querySelector('[data-filter-form]');
  }

  /* ---------- Building the URL ---------- */
  formUrl() {
    const data = new FormData(this.form);
    // The sort select lives in the toolbar and joins the form through form=.
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value !== '') params.append(key, value);
    }
    const url = new URL(this.form.action, window.location.origin);
    url.search = params.toString();
    return url.toString();
  }

  onChange = (event) => {
    if (event.target.matches('[data-price-input]')) return;
    if (event.target.closest('[data-filter-form]') || event.target.matches('[data-sort]')) {
      this.applyForm();
    }
  };

  onInput = (event) => {
    if (!event.target.matches('[data-price-input]')) return;
    window.clearTimeout(this.priceTimer);
    this.priceTimer = window.setTimeout(() => this.applyForm(), 600);
  };

  applyForm() {
    this.navigate(this.formUrl());
  }

  onClick = (event) => {
    if (event.target.closest('[data-filter-open]')) {
      this.openSheet();
      return;
    }
    if (event.target.closest('[data-filter-close]')) {
      this.closeSheet();
      return;
    }
    const loadMore = event.target.closest('[data-load-more]');
    if (loadMore) {
      event.preventDefault();
      this.loadMore(loadMore);
      return;
    }
    const link = event.target.closest('a[data-ajax-link]');
    if (link) {
      event.preventDefault();
      this.navigate(link.href);
    }
  };

  onPopState = () => this.navigate(window.location.href, false);

  /* ---------- Fetch and swap ---------- */
  async fetchSection(url) {
    const fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('section_id', this.sectionId);
    this.controller?.abort();
    this.controller = new AbortController();
    const response = await fetch(fetchUrl, { signal: this.controller.signal });
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  }

  async navigate(url, push = true) {
    const results = this.querySelector('[data-results]');
    results?.setAttribute('aria-busy', 'true');
    results?.classList.add('is-loading');

    try {
      const doc = await this.fetchSection(url);
      const activeId = document.activeElement?.id;

      ['[data-filters]', '[data-results]', '[data-count]', '.collection__filter-toggle', '[data-show-results]'].forEach(
        (selector) => {
          const fresh = doc.querySelector(selector);
          const current = this.querySelector(selector);
          if (fresh && current) current.innerHTML = fresh.innerHTML;
        }
      );

      // Put focus back on the same checkbox or input (ids are stable across renders).
      if (activeId) document.getElementById(activeId)?.focus();
      if (push) window.history.pushState({}, '', url);
    } catch (error) {
      if (error.name !== 'AbortError') window.location.href = url;
    } finally {
      const fresh = this.querySelector('[data-results]');
      fresh?.removeAttribute('aria-busy');
      fresh?.classList.remove('is-loading');
    }
  }

  async loadMore(button) {
    const grid = this.querySelector('[data-grid]');
    button.setAttribute('aria-busy', 'true');
    button.classList.add('is-loading');
    try {
      const doc = await this.fetchSection(button.href);
      const items = [...doc.querySelectorAll('[data-grid-item]')];
      const firstNew = items[0];
      grid.append(...items);
      const pagination = doc.querySelector('[data-pagination]');
      const current = this.querySelector('[data-pagination]');
      if (pagination && current) current.innerHTML = pagination.innerHTML;
      // Move focus to the first new product so keyboard users carry on from there.
      firstNew?.querySelector('a.product-card__link')?.focus();
    } catch (error) {
      if (error.name !== 'AbortError') window.location.href = button.href;
    }
  }

  /* ---------- Phone sheet ---------- */
  openSheet() {
    if (!this.sheet || desktop.matches) return;
    this.opener = document.activeElement;
    this.sheet.showModal();
    requestAnimationFrame(() => this.sheet.classList.add('is-open'));
  }

  closeSheet(restoreFocus = true) {
    if (!this.sheet?.open) return;
    this.sheet.classList.remove('is-open');
    this.sheet.close();
    if (restoreFocus) this.opener?.focus();
  }
}

if (!customElements.get('collection-filters')) {
  customElements.define('collection-filters', CollectionFilters);
}
