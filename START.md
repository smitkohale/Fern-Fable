# START.md: kickoff brief for Claude Code

Paste this whole file into Claude Code, or save it in your theme folder (next to CLAUDE.md and PLAN.md) and type:

> Read START.md and do Step 1.

---

## Context
I'm building a portfolio Shopify theme to get hired as a Shopify developer. CLAUDE.md has the rules and PLAN.md has the phases. This file adds the brand, the products, the homepage plan, and your first tasks. Everything here is made up and only for display.

## The brand
- **Name:** Fern & Fable (fern and leaf motifs are a classic of block printing, and every piece carries a story, its fable, from the carver, the dyer and the printer). Renamed from the working name Neelkora.
- **One line:** Hand-block-printed cotton linens for Indian tables and homes.
- **Sells:** home textiles in 5 collections: Kitchen, Table, Bed, Living, Gifts. Prices from ₹599 to ₹3,299.
- **Audience:** 25–40, living in Indian cities, setting up first homes, love having friends over, buy thoughtful gifts, find brands on Instagram.
- **Personality:** bold, warm, handmade. **Must not feel:** beige and minimal, kitschy, or like a souvenir shop.
- **Story:** every piece is printed by hand with carved wooden blocks. Showing the craft (blocks, dye, hands, fabric) is the brand's big visual idea.
- **Demo labels:** footer line "Demo store: a portfolio project. Fern & Fable is not a real brand." No personal name anywhere on the site. Any reviews are labeled as sample reviews.

## Look and feel (starting point; DESIGN.md makes it final)
- **Color:** deep indigo, madder red and turmeric yellow on an off-white like raw cotton. The colors come from the dyes.
- **Type:** a huge serif with character for headlines; a clean sans-serif for everything else.
- **Photos:** warm daylight, set tables, close-ups of the print texture, hands at work. One consistent photo style across the whole store.
- **Motion:** like fabric unfolding: confident, smooth, never jittery.

## Homepage, top to bottom
These are standard home-textile store sections, built your own way. ★ = signature moment (go big).
1. Announcement bar: rotating messages (free shipping over ₹1,499 · free gift wrap · the Festive Edit is here)
2. Header: mega menu (Kitchen, Table, Bed, Living, Gifts) with a featured photo in each menu; search; account; cart
3. ★ Hero: a big headline that animates in, over a full-width video or photo of a table being set. Headline idea: "Set a table they'll remember."
4. Shop by collection: 5 tiles that react on hover
5. ★ Product reels: a row of short, muted, autoplaying vertical videos, each linked to a product with quick add (still photos for people who turn off motion)
6. Bestsellers / New arrivals: a product grid with tabs; hovering a card shows a second photo; quick add
7. ★ Shop the look, "The Indigo Table": a styled table photo with dots that open product cards, plus an "Add the whole look to cart" button
8. The craft story: the section stays on screen while 3 steps scroll past (carve the block → dye → print)
9. Gift finder: tiles for Under ₹999, For hosts, and the Festive Edit
10. Reviews: sample reviews, clearly labeled as samples
11. Newsletter signup + WhatsApp chat button
12. Footer: huge brand name, menus, social links, the demo-store line

Other pages: collection, product, cart drawer, search, About (the craft story), blog ("Hosting notes"), contact, 404, password.

## The products
`products.csv` holds these 16 products; I import it into Shopify myself (see my checklist below). Use these products whenever you need examples.

| # | Product | Collection | Options | Price (₹) | Notes |
|---|---|---|---|---|---|
| 1 | Indigo Dabu Napkins (Set of 4) | Kitchen | - | 649 | in the Indigo Table look |
| 2 | Marigold Bagru Napkins (Set of 4) | Kitchen | - | 649 | on sale |
| 3 | Kantha Stripe Apron | Kitchen | Color: Indigo, Rust, Sage | 799 | Sage is sold out |
| 4 | Quilted Oven Mitt and Pot Holder Set | Kitchen | - | 599 | |
| 5 | Moonj Grass Bread Basket | Kitchen | Size: Small, Large | 699–949 | |
| 6 | Ajrakh Table Runner | Table | Length: 150 cm, 200 cm | 1,199–1,499 | in the Indigo Table look |
| 7 | Sunlit Khadi Tablecloth | Table | Size: 4-seater, 6-seater, 8-seater (with measurements) | 1,899–2,699 | long option names |
| 8 | Paisley Placemats (Set of 6) | Table | - | 1,299 | on sale, in the Indigo Table look |
| 9 | Winter Berry Table Runner | Table | Length: 150 cm, 200 cm | 1,299–1,599 | festive |
| 10 | Monsoon Mulmul Bedsheet Set | Bed | Size: Queen, King | 2,199–2,499 | |
| 11 | Kantha Quilted Dohar | Bed | Size: Single, Double | 2,499–3,299 | |
| 12 | Chikankari Cushion Cover | Living | Color: Ivory, Sage, Blush | 799 | |
| 13 | Handloom Waffle Throw | Living | Color: Rust, Charcoal | 2,299 | |
| 14 | Ikat Lumbar Cushion Cover | Living | - | 899 | |
| 15 | The Dinner Party Box | Gifts | - | 2,799 | on sale, in the Indigo Table look |
| 16 | The Housewarming Kitchen Kit | Gifts | - | 1,799 | on sale |

**Added later (rows 17 to 26 in products.csv):**

| # | Product | Collection | Options | Price (₹) | Notes |
|---|---|---|---|---|---|
| 17 | Dabu Tea Towels (Set of 3) | Kitchen | - | 749 | new |
| 18 | Block Print Roti Cover | Kitchen | - | 599 | bestseller |
| 19 | Indigo Coasters (Set of 6) | Table | - | 649 | in the Indigo Table look |
| 20 | Winter Berry Napkins (Set of 4) | Table | - | 649 | festive, pairs with the Winter Berry runner |
| 21 | Block Print Star Ornaments (Set of 6) | Gifts | - | 599 | festive, the Christmas hint |
| 22 | Sanganeri Pillow Covers (Pair) | Bed | - | 1,149 | new |
| 23 | Jaipuri Cotton Razai | Bed | Size: Single, Double | 2,599–3,199 | Double has only 3 left (tests low stock) |
| 24 | Kantha Floor Cushion Cover | Living | - | 1,399 | |
| 25 | Block Print Curtain Panel | Living | Length: 5 ft, 7 ft | 1,499–1,799 | |
| 26 | The Festive Host Box | Gifts | - | 3,099 | on sale (compare-at 3,496), festive |

Gift card: create "Fern & Fable Gift Card" in the admin (Products → Gift cards), ₹500 to ₹5,000. It is not in the CSV.

**Tags to build collections and sections from:**
- `bestseller` and `new`: the Bestsellers / New arrivals tabs
- `festive`: the Festive Edit banner and collection
- `gift-under-999` and `gift-for-hosts`: the gift finder tiles
- `look-indigo-table`: the Shop the look products ("Add the whole look" adds the runner, napkins and placemats, not the gift box)
- `sale`: a Sale collection. Sale badges must come from the compare-at price, not from this tag.

**Test cases included on purpose:** the Kantha Stripe Apron in Sage is sold out (to test sold-out states). Five products have a compare-at price (to test sale badges). The tablecloth's long option names stress-test the variant picker layout.

---

## Your tasks, Claude

### Step 1: set up (no theme code yet)
1. In CLAUDE.md and PLAN.md, replace `[BRAND]` with `Fern & Fable` (done).
2. In CLAUDE.md, under Commands, add: "At the start of every session, run `git pull`. Shopify commits theme-editor changes to the connected GitHub branch."
3. Read the Skeleton theme and summarize its structure in 10 lines.
4. Stop and tell me to run `/impeccable init`.

### Step 2: brand and look (I start it)
I'll run `/impeccable init`. Answer its questions from this file and ask me only what's missing. Then follow prompts 2–4 of PLAN.md Phase 1: propose 2 visual directions → I pick one → write DESIGN.md → `/impeccable shape` the homepage above.

### Step 3: build
Follow PLAN.md from Phase 2, one section at a time, using the "Done means" checklist in CLAUDE.md.

---

## My checklist (things only I can do in the Shopify admin)
- [ ] **Currency:** in Settings → General, set the store currency to Indian Rupee (INR) before importing.
- [ ] **Import products:** Products → Import → upload `products.csv` → Import products. If there's an error, paste it into Claude Code and ask it to fix the CSV.
- [ ] **Collections:** check that Kitchen, Table, Bed, Living and Gifts exist under Products → Collections (create any that are missing). Then create automatic collections by tag: Bestsellers (tag `bestseller`), New arrivals (tag `new`), Festive Edit (tag `festive`), Sale (tag `sale`).
- [ ] **Pages and policies:** create About and Contact pages (Online Store → Pages) and fill in the policies (Settings → Policies).
- [ ] **Menus:** Online Store → Navigation. Main menu: Kitchen, Table, Bed, Living, Gifts. Footer menu: About, Contact, Shipping, Returns.
- [ ] **Filters:** install Shopify's free Search & Discovery app and turn on filters for Color, Size, Length, Price and Availability.
- [ ] **Photos:** 2–3 per product (main shot, close-up, in use), all in the same style, uploaded on each product's page. Never use photos from real brands' websites.
- [ ] **Videos:** 4–6 short vertical clips for the reels and one hero clip. Free stock sites like Pexels work; search "block printing", "table setting", "linen".
- [ ] **GitHub:** after the first push, go to Online Store → Themes → Add theme → Connect from GitHub, pick the repo's `main` branch, then publish the theme.

### Photo prompt (works in any AI image generator)
> Editorial product photo of [PRODUCT], hand block-printed cotton in deep indigo, madder red and turmeric on off-white unbleached cotton, styled on a warm oak table with brass and terracotta props, soft morning window light from the left, natural shadows, shallow depth of field, Indian home interior, magazine quality, no text, no logos, 4:5 portrait.

Change the scene for each collection: a set table for Table and Kitchen, a made bed for Bed, a sofa corner for Living, a wrapped box for Gifts.
