/**
 * Cart helpers shared by quick add, the product form and (later) the cart drawer.
 * Uses Shopify's Ajax Cart API and keeps the header count in sync.
 * Fires `cart:change` on document with the new cart as event.detail.
 */
const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

/**
 * Adds to the cart. Fires `cart:added` (the drawer opens on it) unless open is false.
 */
export async function addToCart(formData, { open = true } = {}) {
  const response = await fetch(`${root}cart/add.js`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.description || data.message || 'Could not add to cart');
    error.status = response.status;
    throw error;
  }
  const cart = await refreshCart();
  if (open) document.dispatchEvent(new CustomEvent('cart:added', { detail: { item: data, cart } }));
  return { item: data, cart };
}

export async function refreshCart() {
  const response = await fetch(`${root}cart.js`, { headers: { Accept: 'application/json' } });
  const cart = await response.json();
  updateCartCount(cart.item_count);
  document.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
  return cart;
}

export function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
  document.querySelectorAll('[data-cart-label]').forEach((label) => {
    const template =
      count === 0 ? label.dataset.labelEmpty : count === 1 ? label.dataset.labelOne : label.dataset.labelOther;
    if (template) label.textContent = template.replace('[count]', String(count));
  });
}

/** Polite announcement for screen readers (one shared live region). */
export function announce(message) {
  const region = document.getElementById('CartLiveRegion');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}
