# CLAUDE.md

## Project
A custom Shopify theme (Online Store 2.0) built on Shopify's Skeleton theme, for **[BRAND]**, a made-up D2C brand. It's my portfolio piece for Shopify developer jobs.

Goal: a bold, magazine-style storefront that grabs attention but is still fast, accessible, and fully editable by a store owner in the theme editor.

Read these before any design work:
- `PRODUCT.md`: brand, audience, purpose (written by `/impeccable init`)
- `DESIGN.md`: colors, type, spacing, motion. The single source for every CSS token.
- `PLAN.md`: build phases and progress so far.

## Stack rules
- Use only Liquid, HTML, CSS and plain JavaScript (custom elements). No React, jQuery, Tailwind or CSS frameworks. No build step unless I approve one.
- If a skill suggests React, Tailwind or npm packages, rebuild the idea in Liquid, CSS and plain JS. Shopify's rules and this file beat any skill's defaults.
- Online Store 2.0 only: JSON templates, section groups for the header and footer, and theme blocks in `blocks/` for anything used in more than one section.
- Every section and block gets a complete `{% schema %}`: useful settings, presets, and text strings in `locales/en.default.json`. A store owner must be able to rebuild every page in the theme editor without touching code.
- Use `{% render %}`, never `{% include %}`. Pass variables explicitly.
- Never invent Liquid objects, filters, tags or schema setting types. If unsure, check with the Shopify AI Toolkit first.
- Images: `image_url` + `image_tag` with `widths` and `sizes`. Lazy-load anything below the first screen. Use `fetchpriority: 'high'` only on the main hero image (the LCP image). Always write meaningful alt text.
- Fonts: at most 2 families (one display, one body), self-hosted WOFF2 files in `assets/`, `font-display: swap`, and preload only the hero font.
- CSS: turn the DESIGN.md tokens into custom properties in one snippet. Scope each section's CSS with that section's class prefix. No `!important`.
- JS: `defer` everything. Load a section's script only when that section is on the page. Nothing global unless every page needs it.

## Motion rules
- Try CSS first: transitions, scroll-snap, scroll-driven animations. Use GSAP (ScrollTrigger, SplitText) only for the 2–3 signature moments, and load it only in those sections. GSAP files go in `assets/` (copied minified builds), not a CDN.
- Every animation respects `prefers-reduced-motion: reduce`: show the end state with no movement.
- No hijacking the scroll, no autoplay sound, no layout jumps caused by animation, and no animation that blocks reading or clicking.

## Design rules
- Not minimal: big magazine-style type, confident color, layered images, motion with a purpose.
- Go big only on the signature moments listed in PRODUCT.md and PLAN.md. Product, collection, cart and search pages stay calm, clear and fast.
- Avoid the generic AI look: purple-blue gradients, a centered hero over three feature cards, Inter or system fonts everywhere, emoji as icons, rows of identical rounded cards.
- Made-up brand only. Never use a real brand's name, logo, copy or photos. Label any sample reviews or testimonials as demo content.

## Tools
- **Shopify AI Toolkit**: Shopify docs, plus checking Liquid, schema and API code. Use it for anything Shopify-specific.
- **Impeccable** (`/impeccable <command>`): design work. I pick the command. Run one at a time.
- **playwright-cli**: your eyes. After every section, screenshot the page at http://127.0.0.1:9292 at 390px and 1440px wide, compare it to DESIGN.md, fix problems, then show me. Also use it to click through flows: add to cart, cart drawer, search, filters, variant changes.
- **web-design-guidelines**: accessibility and usability audit at the end of each phase.

## Commands
- I run the dev server myself in another terminal (`shopify theme dev`). Preview: http://127.0.0.1:9292. If it isn't responding, ask me. Don't start a second one, and never write the store password into any file.
- Lint: `shopify theme check`. It must show zero errors before every commit.
- Upload a copy: `shopify theme push --unpublished`

## Done means (every section)
1. Full schema, presets and locale strings, and it works in the theme editor.
2. `shopify theme check` passes.
3. Screenshots at 390px and 1440px checked: nothing spills off-screen, nothing jumps, and it matches DESIGN.md.
4. Usable by keyboard, visible focus outline, alt text, enough color contrast (WCAG AA), reduced motion handled.
5. Committed as `feat(<section>): <what>`, with the PLAN.md checkbox ticked.

## Quality bar for the whole theme
- Lighthouse on mobile for the home, product and collection pages: performance 60 or higher (aim for 75+), accessibility 90 or higher.
- Main content readable without JavaScript. JS only adds to it.

## Working style
- One section or component per task. Use plan mode for anything bigger (header, product page, cart drawer).
- Ask before adding a dependency, moving folders around, or deleting files.
- Don't hand-edit `config/settings_data.json` unless I ask.
