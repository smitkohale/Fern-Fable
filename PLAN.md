# PLAN.md: Fern & Fable Shopify theme

There are 8 phases (0–7). Do one per Claude Code session and type `/clear` between phases. Start each session with:

> Read CLAUDE.md, PRODUCT.md, DESIGN.md and PLAN.md, then continue with Phase N.

Rough time: 4–5 weeks full-time, or about 8 weeks at 3–4 hours a day.

---

## Tools (already decided)

| Tool | Job |
|---|---|
| Shopify AI Toolkit | Shopify docs + checks your Liquid and schema |
| Impeccable | Picks the design direction and refines it, one command at a time |
| Playwright CLI | Takes screenshots and clicks through the site |
| web-design-guidelines (Vercel) | Accessibility and usability audit |
| GSAP (ScrollTrigger, SplitText) | Big animations, only on signature moments |
| better-typography (optional) | Checks body text is easy to read |

Left out on purpose:
- taste-skill, Hallmark, Anthropic's frontend-design: they overlap with Impeccable, and two design skills give clashing rules. You can use taste-skill instead of Impeccable, never alongside it.
- interface-design: made for dashboards, not stores.
- hue: Impeccable's `colorize` already covers color.
- awesome-design-md: look at it for the DESIGN.md format only. Don't copy a real brand.

---

## Phase 0: Setup (one evening)

### 0.1 Install
- [x] Node.js 20+ (LTS version) and Git
- [x] Claude Code
  - macOS / Linux / WSL: `curl -fsSL https://claude.ai/install.sh | bash`
  - Windows PowerShell: `irm https://claude.ai/install.ps1 | iex` (also install Git for Windows)
- [x] Shopify CLI 3.84.0 or newer (5.0.2 installed). Older versions no longer work with password-protected dev stores.
  ```bash
  npm install -g @shopify/cli@latest
  shopify version
  ```

### 0.2 Create the theme
- [x] Theme lives at the root of the `Fern & Fable` folder, copied from Skeleton **v1.0.0** (sections + JSON templates; see CLAUDE.md "Base theme" for why not v2). Git initialised on `main`.
- [x] `CLAUDE.md`, `PLAN.md`, `START.md` and `products.csv` in this folder. Brand set to Fern & Fable.
- [x] `landing-page-design` skill installed at `.claude/skills/landing-page-design/SKILL.md`.
- [x] Create a free Shopify Partner account and a development store (only I can do this).
- [x] Open a second terminal, start the dev server, and leave it running:
  ```bash
  shopify theme dev --store your-store --store-password "your-store-password"
  ```
  Open http://127.0.0.1:9292 to check it works. Type the password only here, never in a file.

### 0.3 Install the AI tools (inside the theme folder)
```bash
# Impeccable (main design skill). It may offer an optional hook; either answer is fine.
npx impeccable install

# Playwright CLI and its skill
npm install -g @playwright/cli@latest
playwright-cli install --skills

# Vercel web-design-guidelines (audit)
npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent claude-code

# Optional: typography readability check
npx skills add jakubkrehel/skills --skill better-typography --agent claude-code
```

Then start Claude Code (`claude`) and install the Shopify AI Toolkit from the official plugin marketplace:
```
/plugin install shopify-ai-toolkit@claude-plugins-official
```
When it asks where to install, pick "Install for you".

Optional: stop the toolkit sending usage data to Shopify:
- macOS / Linux: `mkdir -p ~/.config/shopify-ai-toolkit && touch ~/.config/shopify-ai-toolkit/opt-out`
- Windows PowerShell: `New-Item -ItemType File -Force "$HOME\.config\shopify-ai-toolkit\opt-out"`

- [x] Skipped: Impeccable, playwright-cli, web-design-guidelines and the Shopify toolkit are not installed. Claude covers them: design work by hand from DESIGN.md, screenshots with the app's built-in browser, Liquid checks with `shopify theme check`. Wherever this plan says `/impeccable …` or `playwright-cli`, do the same job that way.
- [x] (was) Type `/` in Claude Code and check that `impeccable`, `playwright-cli`, `web-design-guidelines` and the Shopify toolkit skills all appear.
- [x] First prompt: `Read CLAUDE.md and PLAN.md. Explain the Skeleton theme's folder structure to me in 10 lines, then stop.`

---

## Phase 1: Brand and look (1–2 days)

Decide what will make the site memorable before writing any code.

- [x] Pick a made-up brand and a category with 8–15 products (coffee, skincare, sneakers, streetwear, audio...).
- [ ] Collect 5–8 sites you like (Awwwards e-commerce, Godly, premium Shopify themes). Write one line on what you like about each: type, layout, motion or color. Use them for ideas only; don't copy.
- [ ] Get product photos in one consistent style (free stock photos or AI-generated). A consistent style matters more than perfect photos.

Fill in this brief:
```
Brand: [name] — [what it sells, one line]
Audience: [who they are, what they care about]
Personality: [3 adjectives, e.g. loud, playful, premium]
Must not feel: [3 things]
Sites I like: [site — what I like about it]
Signature moments (pick 2–3): [e.g. animated-headline hero, scroll story, shoppable lookbook]
Constraints: Shopify Online Store 2.0 theme, Liquid + plain JS, Lighthouse mobile performance 60+ and accessibility 90+, every section editable in the theme editor.
```

Prompts, in this order:
1. `/impeccable init`: answer its questions using the brief. This writes PRODUCT.md.
2. `Propose 2 very different visual directions for Fern & Fable: font pairing, color palette with hex values, photo style, how things move, and a rough sketch of the hero for each. No theme code yet.` Pick one, or mix them.
3. `Write DESIGN.md for the chosen direction: color tokens (with contrast notes), type sizes, spacing scale, corner radii, shadows, motion (durations, easing, what moves and what doesn't), and notes on components. This will be the source for all CSS tokens.`
4. `/impeccable shape the homepage around these signature moments: [list]. Plan the order of sections, the text for each one, and where motion goes.`

Phase 1 is done when PRODUCT.md and DESIGN.md exist and you'd be proud to show the direction.

- [x] PRODUCT.md written from START.md.
- [x] Direction chosen: "The Dye House" (DESIGN.md section 1). DESIGN.md written, homepage plan in DESIGN.md section 11.
- [ ] Product photos and videos (my checklist in START.md).

---

## Phase 2: Foundation (2–3 days)

- [x] **Tokens + fonts**: `Turn DESIGN.md into CSS custom properties in one snippet loaded from layout/theme.liquid. Add our two self-hosted fonts. Add color schemes to config/settings_schema.json so a store owner can recolor sections.`
- [x] **Layout** (View Transitions done in CSS with `@view-transition`; section scripts load as `type="module"` from their own section, so no loader helper is needed): `Set up layout/theme.liquid with: critical CSS, deferred global JS, a small helper that loads a section's script only when that section is on the page, a skip-to-content link, and smooth page-to-page transitions using the View Transitions API (only in browsers that support it).`
- [x] **Header**: announcement bar with rotating messages; header with a large dropdown (mega) menu on desktop and a full-screen animated menu on mobile; header hides when scrolling down and comes back when scrolling up.
- [x] **Footer**: huge brand name, newsletter signup (Shopify's customer form), menus, social links, payment icons.

Use this prompt for every section, here and in later phases:
```
Build the [name] section. Follow CLAUDE.md and DESIGN.md.
Requirements: [bullets]
When done: run shopify theme check, take playwright-cli screenshots of http://127.0.0.1:9292 at 390px and 1440px, compare against DESIGN.md, fix what's off, then show me the screenshots.
```

---

## Phase 3: Signature homepage (4–6 days)

Go big on 2–3 of these. Keep the rest clean and simple.

Fern & Fable picks (from START.md): ★ hero with a three.js cloth unfurling onto the table, ★ product reels, ★ Shop the look "The Indigo Table", and the sticky craft story with a 3D carved block. Plus the landing-page-design skill's tagline reveal section, and the `festive_mode` Christmas hint (see CLAUDE.md).

- [x] Hero (built as: WebGL2 runner that drops and unrolls, words rise in CSS, festive stars, flat runner fallback). Original idea: headline that animates in letter by letter (GSAP SplitText) over a full-width video or image, or one huge product photo with layers that move at different speeds as you scroll
- [x] Tagline reveal (skill B11): words light up in reading order over half a screen of scrolling, accent words with *stars*
- [ ] Scrolling strip of brand claims or press quotes (CSS only; it stops on hover and for people who turn off motion)
- [x] Craft story: steps scroll past a pinned 3D carved block that turns (carve), dips in indigo (dye) and stamps the cloth (print); follows scroll, never hijacks it; flat print fallback
- [x] Product reels: swipeable 9:16 video row with quick add; plays only in view, per reel pause, posters for reduced motion and Save Data
- [x] Gift finder: Under ₹999, For hosts, The Festive Edit (festive only) tiles; tag links work before collections exist; product photos fan out on hover
- [ ] Magazine-style image + text with huge numbers and mixed type sizes
- [x] Shop the look, The Indigo Table: numbered dots open product cards with quick add (bottom sheet on phones), matching list, total and "Add the whole look" (items[] form, works without JS)
- [x] Shop by collection: staggered row of 5 tiles, hover and focus react, swipe row on phones
- [x] Bestsellers / New arrivals tabs: product card (second photo on hover, sale badge from compare at price, sold out), quick add with variant chips, header cart count
- [x] Reviews (always labelled as sample reviews, no review structured data)
- [x] Newsletter banner (footer signup hides when it is on the page) + floating WhatsApp button (Theme settings, shows once a number is set)

For each section:
1. Build it with the section prompt above.
2. Push it further: `/impeccable bolder [section]`, `/impeccable animate [section]` or `/impeccable delight [section]`. Use `/impeccable overdrive [section]` on one signature moment at most.
3. Review it: `/impeccable critique [section]`, then fix the top three problems.
4. If it uses video, GSAP or WebGL: `/impeccable optimize [section]`.
5. Commit.

---

## Phase 4: Shopping pages (5–7 days)

Calm, fast, no bugs. Agencies judge this part hardest.

- [x] **Product page** (built: swipe/stacked gallery with zoom dialog, video, 3D + AR; variant chips or select for long names, sold out values marked, price/stock/photo/URL update; quantity; dynamic checkout; promises; collapsible rows; craft note; sticky phone bar; Complete the look via recommendations API): gallery (photos, video, 3D models if you have them) with zoom; picking a size or color updates the price, photos, stock and URL; color swatches; add-to-cart button that stays on screen on mobile; size guide or ingredients from metafields; "Complete the look" product suggestions.
- [ ] **Collection page**: filters and sorting (Shopify's free Search & Discovery app), cards that show a second photo on hover, quick add, a "load more" button.
- [ ] **Cart drawer**: add, change and remove items without reloading the page (Cart API + Section Rendering API), free-shipping progress bar, a row of suggested products, a designed empty-cart state.
- [ ] **Search suggestions** as you type, usable by keyboard.
- [ ] **Test the flows**: `Use playwright-cli to test: add to cart from a product card, add from the product page with a variant, change quantity in the drawer, remove an item, and click through to checkout. Screenshot each step and tell me anything broken.`

Switch to plan mode (Shift+Tab) before starting the product page and the cart drawer.

---

## Phase 5: Content pages (2–3 days)

- [ ] About: the brand story as a page that unfolds as you scroll (reuse your signature sections)
- [ ] Blog list and article pages with a magazine layout
- [ ] Contact page (contact form)
- [ ] Search results page
- [ ] 404 page with personality
- [ ] Password page (the theme's own `password.liquid`)

---

## Phase 6: Polish and testing (3–4 days)

- [ ] `/impeccable audit`, then fix what it finds
- [ ] `Use the web-design-guidelines skill to review layout/, sections/, blocks/ and snippets/. Fix everything it finds.`
- [ ] `/impeccable harden`: long product names, missing images, sold-out variants, no search results, very long translations
- [ ] `/impeccable adapt`: check every screen width from 320px to 1920px
- [ ] `/impeccable polish`
- [ ] Turn on "reduce motion" in your computer's settings and check every animated section
- [ ] `shopify theme check`: zero errors
- [ ] Lighthouse: run `shopify theme push --unpublished`, then `shopify theme publish` (pick your theme) on your dev store. In the Shopify admin, click the eye icon next to Online Store, copy the preview link from the bar at the top, and run `npx lighthouse <preview-link>` on the home, product and collection pages. Targets: performance 60+, accessibility 90+.
- [ ] `/impeccable document`: update DESIGN.md so it matches what you actually built
- [ ] Test on a real phone

---

## Phase 7: Ship the portfolio (1–2 days)

- [ ] Push to a public GitHub repo and connect it in the admin (Online Store → Themes → Add theme → Connect from GitHub)
- [ ] README: what it is, list of features, list of sections and blocks, key technical decisions, screenshots or GIFs, Lighthouse scores, how to run it locally
- [ ] 60–90 second video: editing in the theme editor → phone view → add to cart → cart drawer → checkout
- [ ] Resume and LinkedIn: store link + password, GitHub repo, video

---

## When things go wrong
- Claude makes up a Liquid filter or schema type: `Check this against Shopify's docs with the Shopify AI Toolkit and fix it.`
- The design looks generic: `/impeccable critique`, then `/impeccable bolder`
- Too loud or too slow: `/impeccable quieter` or `/impeccable optimize`
- Claude drifts away from the plan: `/clear`, then the start-of-session prompt at the top of this file
