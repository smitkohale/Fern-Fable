# Fern & Fable: a custom Shopify theme

A hand built Online Store 2.0 theme for a made up D2C brand selling hand block printed cotton linens for Indian homes. Built from Shopify's Skeleton theme with Liquid, CSS and plain JavaScript (custom elements), no frameworks and no build step.

> **Demo store.** Fern & Fable is not a real brand. Products, reviews and copy are sample content for a portfolio project.

**Preview:** _add your store link and password here_ · **Video walkthrough:** _add link_

<!-- Screenshots to add once real products and photos are in:
     docs/screenshots/home-desktop.png   (hero with the 3D runner landed)
     docs/screenshots/home-mobile.png
     docs/screenshots/product.png        (variant picker open)
     docs/screenshots/cart-drawer.png
     docs/screenshots/collection-filters.png
-->

---

## Highlights

| | |
|---|---|
| **3D hero, hand written WebGL2** | A block printed runner drops and unrolls across the page. The roll is an Archimedean spiral in the vertex shader, so its layers never overlap. The print is drawn procedurally on a 2D canvas, so no image is downloaded. About 7 KB gzipped, no three.js. |
| **3D craft story** | A pinned panel follows the reader's scroll: a carved wooden block turns, dips into indigo and stamps the cloth. The carving is a height map lit with derivative bump mapping, so the block stays a simple box with no model file. |
| **Shop the look** | Numbered hotspots open product cards with quick add (a bottom sheet on phones). "Add the whole look" posts every piece in one `items[]` request and works without JavaScript. |
| **Cart drawer** | Quantity and remove use `/cart/change.js` with Section Rendering, so Shopify returns the drawer already rendered. Free shipping progress, gift wrap (cart attribute), card note, "pairs well" suggestions. Focus stays on the control the shopper used. |
| **Collection filters** | Storefront filters as a sidebar on desktop and a full height sheet on phones (one `<dialog>`, shown as a block on desktop). Filters, sort, active pills and "Load more" update in place with shareable URLs. |
| **Predictive search** | An ARIA combobox overlay: arrow keys through suggestions, products, collections and pages, cached and abortable requests. |
| **Product page** | Swipe or stacked gallery with zoom, video and 3D/AR media. Variant chips switch to a select for long names. Sold out values are marked, and price, stock, photo and URL update without a reload. Sticky add to cart bar on phones. |
| **Festive mode** | One theme setting adds a hint of Christmas: Winter Berry print in the hero, a few drifting stars, a Festive Edit tile. Off in January with one click. |

## Quality

- **Accessibility:** axe-core (WCAG 2.1 AA and best practice) shows **0 violations** on home, product, collection, search, cart drawer, 404, blog and mobile menu. Lighthouse accessibility **100** on home, product and collection.
- **SEO:** Lighthouse **100**. Product structured data, meta description and share image fallbacks.
- **Reduced motion:** every animation has an end state with no movement. The 3D scenes show the finished frame.
- **Responsive:** checked at 320, 390, 768, 1024, 1440 and 1920 px with no horizontal overflow.
- **Performance work:** below the fold CSS loads without blocking render, and the hero headline is LCP safe. Shaders compile in parallel, and GPU setup is split into short tasks. Phones get lighter frames, and software WebGL gets a flat fallback. Theme settings turn the 3D off on phones only. _Add Lighthouse scores from the published store here._
- `shopify theme check`: **0 errors**, run in CI on every push (`.github/workflows/ci.yml`).

## Design system

- `DESIGN.md` holds every token: indigo, madder and turmeric on raw cotton, Fraunces (display) and Manrope (body), a fixed spacing scale, radius rules and motion curves. Contrast is checked for every colour pairing.
- Tokens live as CSS custom properties in `snippets/css-variables.liquid`. Six colour schemes are editable in the theme editor.
- Fonts are self hosted and trimmed to the axes in use, with a separate tiny file for the ₹ sign (about 58 KB total).

## Sections and blocks

Every section has a full schema with presets and translated settings, so a store owner can rebuild every page in the theme editor.

**Homepage:** announcement bar · header (mega menu) · hero (3D) · shop by collection · product reels · bestsellers and new arrivals tabs · tagline reveal · shop the look · craft story (3D) · gift finder · reviews (labelled as samples) · newsletter · footer

**Shopping:** product · product recommendations · collection with filters · all collections · search · cart page · cart drawer

**Content:** rich text · image with text · About template · blog ("Hosting notes") · article · contact form · plain page · 404 · password · gift card

## Key technical decisions

- **Skeleton v1 (sections and JSON templates), not v2 (block only).** v2 has no sections or presets, which would stop merchants rebuilding pages in the editor.
- **Plain WebGL2 instead of three.js.** Two small scenes did not justify 150 KB+ of library. The shared helpers live in `assets/gl-kit.js`.
- **One `cart.js` module** for add, refresh, count and announcements, shared by quick add, the product page, Shop the look, the drawer and the cart page.
- **Section Rendering API everywhere server HTML exists** (cart, filters, recommendations, predictive search), so prices and totals always come from Shopify.
- **Works without JavaScript:** forms post, filters submit, pagination links work, and the 3D falls back to images.

## Run it locally

```bash
npm install -g @shopify/cli@latest
shopify theme dev --store your-store.myshopify.com
```

Then open http://127.0.0.1:9292. To load the demo catalogue, import `products.csv` in the Shopify admin (Products → Import).

## Project files

- `PRODUCT.md`, `DESIGN.md`, `PLAN.md`, `CLAUDE.md`: brief, design system, build plan and working rules
- `products.csv`: 26 demo products
- `docs/hosting-notes-drafts.md`: three sample blog posts

## Credits

- Built on [Shopify Skeleton theme](https://github.com/Shopify/skeleton-theme) (MIT, see `LICENSE.md`).
- Fonts: Fraunces and Manrope (SIL Open Font License).
- Icons: [Phosphor](https://phosphoricons.com) (MIT).
- Built with AI pair programming (Claude Code); design direction, review and decisions by the author.
