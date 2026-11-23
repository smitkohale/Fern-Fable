/**
 * <product-recommendations>: loads the section from Shopify's recommendations
 * endpoint when it nears the screen. Tries complementary products first
 * ("Complete the look", set in the Search & Discovery app), then related ones.
 */
class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (this.children.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        this.load();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    observer.observe(this);
  }

  async load() {
    for (const intent of ['complementary', 'related']) {
      try {
        const response = await fetch(`${this.dataset.url}&intent=${intent}`);
        const text = await response.text();
        const html = new DOMParser().parseFromString(text, 'text/html');
        const fresh = html.querySelector('product-recommendations');
        if (fresh && fresh.querySelector('.product-card')) {
          this.innerHTML = fresh.innerHTML;
          return;
        }
      } catch (error) {
        return;
      }
    }
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations);
}
