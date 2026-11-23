# DESIGN.md: Fern & Fable

The single source for every CSS token. If code and this file disagree, fix one of them so they match.
Values follow `.claude/skills/landing-page-design/SKILL.md` unless a rule here says it overrides it (see CLAUDE.md, Skill precedence).

---

## 1. Direction: "The Dye House"

**The idea:** the store looks like a page printed in a block printer's workshop. Raw cotton paper, deep indigo ink, flashes of madder red and turmeric where the dye splashed. Huge soft serif headlines feel stamped onto the page. Things don't slide in like an app; they **ink in** (a quick press and settle) and **unfold** (like cloth opening out).

**Why this one:** it comes straight from the product. The colours are the actual dyes, the motion is the actual craft (stamp, unfold), and the 3D moments show the real objects (cloth and carved block). That makes it memorable and impossible to mistake for a template.

**Rejected:** "Quiet linen" (pale neutrals, thin serif, lots of white space). Elegant, but it is exactly the beige minimal look the brief rules out.

**Three rules that keep it premium, not kitschy**
1. One loud thing per screen. A turmeric block **or** a madder headline **or** a pattern band, never all three at once.
2. Pattern is used like a material, in bands and edges, never as wallpaper behind text.
3. Photography carries the colour. Flat UI surfaces stay kora or indigo.

---

## 2. Colour

### Base palette
| Token | Hex | Use |
|---|---|---|
| `--color-kora` | `#F5EFE4` | Page background (raw cotton) |
| `--color-kora-2` | `#EBE2D1` | Raised surfaces: cards, inputs, drawer |
| `--color-line` | `#D6CBB6` | Borders and dividers (decorative only) |
| `--color-ink` | `#1A1A22` | Body text on kora |
| `--color-muted` | `#5D5A66` | Secondary text, captions |
| `--color-indigo` | `#1C2754` | Brand primary: headlines, buttons, dark sections |
| `--color-indigo-deep` | `#121A3B` | Footer, hero overlay, darkest section |
| `--color-madder` | `#A3302A` | Sale price, sale badge, accent headlines, errors |
| `--color-turmeric` | `#E3A72F` | Highlights, fills, focus ring on dark. **Never text on kora.** |
| `--color-forest` | `#2E5B41` | Festive accent only (`festive_mode`) |
| `--color-success` | `#2E5B41` | In stock, added to cart (with an icon, never colour alone) |

### Contrast (WCAG 2.1, checked)
| Text on background | Ratio | OK for |
|---|---|---|
| ink on kora | 15.1 | everything |
| indigo on kora | 12.5 | everything |
| madder on kora | 6.1 | everything |
| muted on kora | 5.9 | body and captions |
| muted on kora 2 | 5.2 | body and captions |
| kora on indigo | 12.5 | everything |
| turmeric on indigo | 6.7 | everything |
| indigo on turmeric | 6.7 | everything |
| kora on madder | 6.1 | everything |
| kora on forest | 6.8 | everything |
| turmeric on kora | **1.9** | **never use** |

### Colour schemes (Shopify `color_scheme_group` in settings_schema)
A store owner picks one per section.
| Scheme | Background | Text | Heading | Button bg / text | Accent |
|---|---|---|---|---|---|
| `kora` (default) | kora | ink | indigo | indigo / kora | madder |
| `kora-2` | kora 2 | ink | indigo | indigo / kora | madder |
| `indigo` | indigo | kora | kora | turmeric / indigo | turmeric |
| `indigo-deep` | indigo deep | kora | kora | turmeric / indigo | turmeric |
| `turmeric` | turmeric | ink | indigo | indigo / kora | madder |
| `madder` | madder | kora | kora | kora / madder | turmeric |

Backgrounds are always flat. No gradients on any background (skill B4).
There is no dark mode: the indigo schemes play that role section by section. The skill's dark mode grey list does not apply.

---

## 3. Typography

### Families (two only, self hosted WOFF2 in `assets/`)
- **Display: Fraunces** (SIL OFL). Variable font, settings for headlines: `font-variation-settings: "SOFT" 100, "WONK" 0, "opsz" 144`. The soft axis rounds the serifs so the letters look pressed into cloth. Roman only, **never italic** (skill B1). Weight 600 for headings, never above 600.
- **Body and UI: Manrope** (SIL OFL). Weights 400, 500, 600.
- Subset both to Latin plus `₹` (U+20B9). **Check before shipping:** if Manrope has no `₹` glyph, prices use the system fallback; make sure it still lines up.
- `font-display: swap`. Preload only Fraunces 600 (the hero font).
- Budget: both families together under 140 KB.
- Fallback stacks: `Fraunces, "Iowan Old Style", Georgia, serif` and `Manrope, "Segoe UI", system-ui, sans-serif`.

This is the brief's override of the skill's "one typeface" rule. Fraunces is used only for Display and Heading styles. Everything else is Manrope.

### Text styles
Sizes come from the skill's type scale (Tailwind steps). Each style is one CSS class with the same name: `.heading-1`, `.body-3`, `.button-md`…

**Display (override: the brief asks for a huge headline; the skill's largest style is 60px)**
| Style | Mobile | Desktop (≥ 990px) | Weight | Font | Tracking |
|---|---|---|---|---|---|
| Display 1 (hero only) | 48 / 48 | 128 / 128 | 600 | Fraunces | -0.03em |
| Display 2 (tagline reveal, footer wordmark) | 36 / 40 | 96 / 96 | 600 | Fraunces | -0.02em |

**Headings (Fraunces 600 for Heading 1 to 4; Manrope 600 for Heading 5 and 6)**
| Style | Mobile | Desktop |
|---|---|---|
| Heading 1 | 36 / 40 | 60 / 60 |
| Heading 2 | 30 / 36 | 48 / 48 |
| Heading 3 | 24 / 32 | 36 / 40 |
| Heading 4 | 20 / 28 | 30 / 36 |
| Heading 5 | 20 / 28 | 24 / 32 |
| Heading 6 | 18 / 28 | 20 / 28 |

**Title, Body, Button, Caption:** exactly as the skill's table (Manrope). Most used:
- Product card title: Title 3. Price: Body 2. Compare-at price: Body 6, muted, struck through.
- Running text: Body 3. Product description: Body 3, max 64ch.
- Main buttons: Button-md. Header buttons: Button-sm.
- Badges, metadata: Caption 3, uppercase, letter spacing 0.08em (the only uppercase in the theme).

Rules: `text-wrap: balance` on all headings, `text-wrap: pretty` on body. Hero heading and subheading max width 680px on mobile and tablet; on desktop the hero heading is allowed to 1080px because of Display 1, and the subheading stays 680px.

---

## 4. Spacing, layout, radius

### Spacing tokens (skill B2, nothing else allowed)
`--space-0: 0` · `--space-25: 2px` · `--space-50: 4px` · `--space-75: 8px` · `--space-100: 12px` · `--space-200: 16px` · `--space-300: 24px` · `--space-400: 32px` · `--space-500: 40px` · `--space-600: 48px` · `--space-700: 64px` · `--space-800: 80px` · `--space-900: 96px`

- Page gutter: 16px mobile, 24px tablet, 48px desktop.
- Section padding: 64px mobile, 96px desktop. Signature sections may run full bleed.
- Max content width: 1440px. Text column: 680px.
- Grid: 4 columns mobile, 12 columns desktop, gap 16px mobile, 24px desktop.
- Product grid: 2 columns at 390px, 3 at 750px, 4 at 1200px.

### Radius (Tailwind values only, skill B3)
The look is cut cloth and paper, so mostly square.
| Element | Radius |
|---|---|
| Images, product cards, sections, drawers | 0 |
| Buttons, inputs, selects | 4px (`rounded`) |
| Badges, variant chips, hotspot dots | 9999px (`rounded-full`) |
| Popover cards (shop the look, quick add) | 8px (`rounded-lg`); anything inside with 4px gap gets 4px |

### Borders and shadows
- Borders: 1px `--color-line`, all four sides or none (skill B4). Inputs use 1px `--color-muted` so the edge passes 3:1.
- Shadows: almost none. One shadow for floating things (nav bar, popovers, drawer): `0 8px 24px rgb(18 26 59 / 0.12)`.

---

## 5. Pattern and texture (the brand's signature graphic)
- Three motifs drawn as SVG, in `assets/`: **fern** (the brand mark), **buti** (small repeat), **jaal** (lattice for bands).
- They look block printed: slightly uneven edges and a faint ink speckle, baked into the SVG (no filters at runtime).
- Used as: a 24px pattern band between big sections, the cart drawer edge, the 404 page, the password page, the loading skeleton tint. Never behind running text.
- One colour per band (indigo on kora, or turmeric on indigo).
- Paper grain: an optional 4% opacity noise PNG on kora backgrounds, under 8 KB, off by default in the theme settings.

## 6. Icons
**Phosphor** (MIT), regular weight, 20px in UI and 24px in the header, inlined as SVG snippets. Stroke inherits `currentColor`. No Material icons, no emoji.

## 7. Photography
- Warm daylight from the left, soft natural shadows, oak tables, brass and terracotta props, Indian homes.
- Three shots per product: main (4:5), print close up (4:5, shows the texture), in use (4:5).
- Collection tiles 4:5. Hero 16:9 desktop, 4:5 mobile (separate image setting). Reels 9:16.
- Same grading everywhere: warm, slightly lifted shadows, no heavy filters.
- Use the photo prompt in START.md. Never photos from real brands.

---

## 8. Motion
"Fabric unfolding": confident, smooth, weighted, never bouncy or jittery.

### Tokens
| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Everything by default (skill B7) |
| `--ease-press` | `cubic-bezier(0.65, 0, 0.35, 1)` | The "ink in" press only |
| `--dur-hover` | 300ms | Colour and opacity on hover (never below 200ms) |
| `--dur-move` | 500ms | Layout and position changes, drawers, menus |
| `--dur-reveal` | 700ms | Section scroll reveals |
| `--dur-hero` | 1400ms | Hero cloth unfurl, headline |

Animate only `transform` and `opacity` (plus `clip-path` for the ink reveal, which does not cause layout).

### Named animations
- **Ink in** (default reveal for images and cards): starts at `scale(1.02)`, opacity 0 and an uneven clip mask; settles to `scale(1)` over 700ms. Like a block lifting off fresh print. Each once, via `IntersectionObserver`.
- **Rise** (text blocks): up 32px and fade in, 700ms, `--ease-out`. Siblings step 60ms apart, max 400ms total.
- **Unfold** (drawers, mega menu, accordions): `scaleY` from 0.96 plus opacity from the top edge, 500ms.
- **Hero headline:** words rise in one by one (GSAP SplitText) after the cloth lands.
- **Hero cloth (three.js):** the runner drops and unfurls across the table in 1.4s, then rests with a faint breathing ripple (stops after 6s to save battery).
- **Craft story (GSAP ScrollTrigger plus three.js):** section pins; the carved block rotates (carve), dips (dye), then stamps down and the print appears on the cloth (print).
- **Tagline reveal:** each word goes from 30% opacity to 100% as it crosses 60% of the viewport height (skill B11).
- **Nav:** floating bar 12px off the top, translucent kora at 80% with a 16px backdrop blur; hides on scroll down, returns on scroll up.

### Reduced motion
`prefers-reduced-motion: reduce` shows the end state of everything: no unfurl (the hero shows the still photo), no pin scrolling (craft steps stack normally), tagline fully inked, reels show posters, stars do not drift. Opacity fades of 200ms or less are allowed.

### Loading
- GSAP and three.js are loaded only by the sections that use them, after the LCP image has painted.
- The three.js scene does not start on devices with fewer than 4 CPU cores, with Save Data on, or without WebGL2. They keep the photo or video.

---

## 9. Components
- **Primary button:** indigo background, kora text, Button-md, padding 8px by 12px (skill B2), min height 44px for touch, radius 4px. Hover: background moves to indigo deep and the label shifts up 1px. Active: `scale(0.98)`. Focus: 2px turmeric outline with a 2px offset (on kora, a 2px indigo outline).
- **Secondary button:** transparent, 1px indigo border all round, indigo text.
- **Text link:** indigo, underline 1px offset 3px; hover thickens to 2px.
- **Product card:** square image (4:5), hover shows the second image with ink in, quick add button slides up on hover (always visible on touch). Title 3, price Body 2. Sale badge top left from the compare-at price (madder pill, Caption 3). Sold out badge: muted pill, the card stays clickable.
- **Variant picker:** chips (rounded full) for 1 to 4 short values; a select for long ones (the tablecloth). Sold out values crossed through and still selectable to show "Sold out".
- **Price:** sale price madder, compare-at muted and struck through, with a visually hidden "Regular price" label.
- **Inputs:** kora 2 background, 1px muted border, 4px radius, 44px height. Errors inline below in madder with an icon and specific text ("Enter an email like name@example.com").
- **Cart drawer:** slides in from the right with Unfold, kora 2, free shipping progress bar (turmeric fill on indigo track) toward ₹1,499, gift wrap toggle, a designed empty state with the fern motif and links to Bestsellers.
- **Skeletons:** kora 2 blocks shaped like the real layout with a slow shimmer (off under reduced motion). No spinners.
- **Mega menu:** full width panel, collection links in Title 2 on the left, one featured photo with a caption on the right.
- **Mobile menu:** full height panel, kora at 96% with a 24px blur, links rise in 60ms apart (max 400ms).

---

## 10. Festive layer (`festive_mode`)
When on:
- Announcement bar leads with "The Festive Edit is here".
- Hero cloth uses the Winter Berry print texture instead of the Ajrakh one.
- 8 small block printed stars (turmeric and kora, 12 to 24px) drift very slowly down the hero only (CSS transform, 20 to 40s loops). Off under reduced motion and on Save Data.
- Gift finder's Festive Edit tile uses the `forest` accent.
- Nothing else changes. No snow, no red and green page, no sound, no countdown timers.

---

## 11. Homepage plan
Section order from START.md, with copy and motion. ★ is a signature moment.

| # | Section | Scheme | Copy (draft) | Motion |
|---|---|---|---|---|
| 1 | Announcement bar | indigo deep | "Free shipping over ₹1,499" · "Free gift wrap on every order" · "The Festive Edit is here" | Messages swap every 5s with a fade; pause on hover and focus |
| 2 | Header | kora at 80% | Kitchen, Table, Bed, Living, Gifts · search · account · cart | Floating bar, Unfold mega menu |
| 3 | ★ Hero | indigo deep overlay on 3D or photo | **Set a table / they'll remember.** Sub: "Cotton linens printed by hand with carved wooden blocks, in indigo, madder and turmeric." CTA: "Shop the table". Proof: "Printed by hand, one block at a time" | Cloth unfurl, words rise, stars if festive |
| 4 | Shop by collection | kora | Heading: "Start with a room" · 5 tiles | Ink in; hover zooms the photo 1.04 and inks the label underline |
| 5 | ★ Product reels | indigo | Heading: "See it on the table" · 6 reels with product name, price, quick add | Autoplay muted while visible, pause off screen; posters under reduced motion |
| 6 | Bestsellers / New arrivals | kora | Tabs: "Bestsellers" · "New arrivals" | Grid ink in, second image on hover |
| 7 | Tagline reveal | kora | **Every pattern starts as a block of wood / and ends up on your table.** | Word by word inking |
| 8 | ★ Shop the look | kora 2 | "The Indigo Table" · "Runner, napkins, placemats and coasters, styled for six." CTA: "Add the whole look" | Dots pulse once on reveal; cards Unfold |
| 9 | ★ The craft story | indigo | 1 "Carve": "A printer's block starts as a slab of sheesham, carved by hand over days." 2 "Dye": "Indigo, madder and turmeric are mixed in small batches." 3 "Print": "Each length of cloth is stamped one block at a time, so no two are quite the same." | Pinned, 3D block |
| 10 | Gift finder | kora | Heading: "Gifts they'll actually use" · tiles: "Under ₹999" · "For hosts" · "The Festive Edit" | Ink in |
| 11 | Reviews | kora 2 | Heading: "What people say" · label: "Sample reviews for this demo store" | Rise |
| 12 | Newsletter + WhatsApp | turmeric | "Hosting notes, new prints, first look at sales." CTA: "Sign me up". Floating WhatsApp button bottom right | Rise; success message inline: "You're on the list. Check your inbox." |
| 13 | Footer | indigo deep | Huge wordmark "Fern & Fable" (Display 2) · menus · social · "Demo store: a portfolio project. Fern & Fable is not a real brand." · Privacy policy, Terms | Wordmark inks in |

Factual claims on the page (shipping threshold, gift wrap) come from START.md. Craft claims describe the made up brand and stay general; no invented statistics, customer counts or press logos.

---

## 12. Quality bar
- Every font size, spacing value, radius and duration comes from the tokens above. No arbitrary values.
- Checked at 390px and 1440px: no horizontal scroll, primary action visible on the first screen.
- Keyboard: skip link, visible focus everywhere, drawers trap focus and close on Escape.
- Lighthouse mobile on home, product, collection: performance 75+ (60 minimum), accessibility 90+.
