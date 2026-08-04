# Wheel Page Build Guide

Reference doc for building/checking individual wheel product pages under `src/pages/wheels/*.astro`
(e.g. `daytona.astro`, `sebring.astro`, `sebring-2p.astro`, `speedway.astro`, `sonoma.astro`, `talladega.astro`).

New wheel pages usually reuse one of the patterns below rather than inventing a new layout. Before
building a new one: identify which existing page it's closest to in design, use that file as the
starting template, and adjust content/assets — don't build from scratch.

## Two known template families

**"Form Forged" template** — `daytona.astro`, `sebring.astro`, `sebring-2p.astro`, `speedway.astro`.
Light background throughout, banner-style storytelling sections, 4-step process diagram.

**"Forged" template** — `sonoma.astro`, `talladega.astro`.
Side-by-side wheel image + specs/sizes/buttons layout near the top, 5-step process diagram, a
dark/black-background Finishing section (not light like the other family).

If a new wheel's Figma looks closer to one family than the other, copy that file, not the other one.
If it doesn't clearly match either, ask before assuming a hybrid is correct.

## Section-by-section (Form Forged template — most common)

1. **Hero** — full-bleed image or video via `BannerFullWidthWithLegend` (`orientation={Orientations.CENTER}`), or a raw `<iframe>` YouTube embed (used on `sebring-2p` only, others use a static hero image — video isn't the default, check the Figma/assets before assuming video)
2. **Logo + Description** — wheel logo + "Form Forged" sub-logo side by side, `<h1>` title (`font-franklin-heavy`), intro paragraph, "EXCLUSIVELY ENGINEERED FOR CORVETTES" eyebrow `<h2>`, finish tile grid (see below), primary "SHOP" button
3. **Precision Fitment** banner (`orientation={Orientations.LEFT}`) — text + secondary CTA to `PROCESS_FORM_FORGED_ROUTE`
4. **Lightweight Design** banner (`orientation={Orientations.LEFT}`) — text only, no CTA
5. **Motorsport Styling** — plain 50/50 split section (image `<div>` + text `<div>`, NOT `BannerFullWidthWithLegend`), no CTA
6. **Details Matter** banner (`orientation={Orientations.RIGHT}`) — text + secondary CTA to `GALLERY_WHEELS_ROUTE`
7. **Stills banner** — single full-bleed static image, no text
8. **Our Process** — 4-step diagram grid, each step: numbered divider (`STEP 1`–`STEP 4`), `ImageWithLegend` with diagram image, bold red step title, description paragraph
9. **Finishing** — heading + paragraph describing available finishes, no visuals (light background)
10. **Detail Images Grid** — 4 close-up shots, 2×2 `grid-cols-1 md:grid-cols-2`
11. **Gallery banner** — static image, no text
12. **"Shop [Wheel] Finishes"** — same finish tile grid as section 2, this time each tile also gets a "SHOP NOW" button underneath
13. **Second gallery banner** (`orientation={Orientations.RIGHT}`) — text + secondary CTA to gallery
14. **"Discover More Form Forged Series Wheels"** — 2-up cross-sell tiles linking to sibling wheel pages
15. **"BACK TO TOP"** — currently non-functional on `sebring-2p` (see Known Quirks) — if copying, either wire up real scroll-to-top behavior or drop it, don't just copy the dead version

## Shared components (don't reinvent)

- **`Button.vue`** (`@/core/components/Button.vue`) — always pass `link` (renders as `<a>`) for page CTAs; `primary` = red fill + `font-franklin-demi`, `secondary` = red outline + `font-sans font-black`, neither = black fill. Pass `client:visible`.
- **`ImageWithLegend.vue`** — image + centered content below via slot. Used for process steps and finish tiles.
- **`BannerFullWidthWithLegend.vue`** — full-bleed image with overlaid content. Props: `image`, `alt`, `orientation` (`LEFT`/`RIGHT`/`CENTER` from `@/core/types/App.ts` `Orientations`), `bgColor` (e.g. `"bg-black/20 lg:bg-transparent"` for mobile-only dark scrim so light text stays readable over a lighter image area on desktop), `class` for height.
- **`.wheel-finish-grid`** (global CSS in `src/assets/main.css`) — 1 column on mobile, 3 columns ≥640px. Wrap the `<a>` finish tiles in a `<div class="wheel-finish-grid">`, don't build a new grid.

## Asset & constants conventions

- All copy strings, image paths, and brand names for a wheel live in `src/pages/wheels/constants/Wheels.ts`, one block per wheel, prefixed `<WHEEL_NAME>_` (e.g. `SEBRING_2P_LOGO`, `SEBRING_2P_HERO_IMAGE`). Add a new block here for a new wheel, don't inline strings/paths in the `.astro` file.
- Images live at `/public/assets/images/<wheel-slug>/<hash>.webp` (Figma export hashes) except logos, which live at `/public/assets/images/logos/e5-<wheel-slug>.webp` or `/public/assets/images/wheels/<name>_logo.webp` (inconsistent between wheels — check an existing sibling for the exact path pattern before guessing).
- Each wheel also exports a `<WHEEL_NAME>_WHEELS` array (`{ image, finish }` per finish) — used for cross-referencing, not always rendered directly on the page itself.
- Route constants for each wheel's own page live in `src/core/constants/Routes.ts` as `WHEELS_<NAME>_ROUTE` — add one here for a new wheel page.

## Finish tiles & shop links — read before building

- Each finish tile links to a **hardcoded product URL string** built inline in the page's frontmatter, e.g. `const glossBlackUrl = '/shop/sebring-2p/black';` — not a route constant, not derived from data.
- The `<finish-slug>` segment (`black`, `bronze-black-lip`, `titanium-black-lip`, etc.) must match a finish that actually exists in the live AutoSync wheel catalog for that series — the shop's product page (`_SingleProductPage.vue`) resolves it by deduping the API's `Finish`+`Color`+`Accent` combination per series and matching against this slug. **A previous real bug**: a wrong/stale slug silently resolved to the wrong finish instead of erroring. Before hardcoding a new finish URL, verify the finish name against the live catalog (`fetchWheels()` in `ProductService.ts`) rather than guessing from the Figma label.
- The "Shop [Wheel] Finishes" section's tiles should be the same URLs as the top finish grid — don't let them drift out of sync.
- Whatever finishes/prices are named in page copy (e.g. a "Finishing" section paragraph) must match the actual finish tiles present — `sebring-2p` currently has a real mismatch (copy names a 4th finish, "Bronze Brushed Tint," that has no tile/link anywhere on the page). Don't introduce this on a new page: if the copy lists N finishes, there should be N tiles.

## Typography notes

- Only one real font file exists: `Franklin Gothic Heavy Regular.ttf`. `fonts.css` declares `Franklin Gothic Demi`/`Medium`/`Book` as separate `@font-face` families that all point to that same file at different `font-weight` values — so `font-franklin-demi`/`-medium`/`-book` are **visually identical to Heavy**, there is no real weight variation available in this font. Don't expect `font-franklin-book` to look thinner than the H1.
- `<h1>` always uses `font-franklin-heavy`. Section `<h2>`s on existing pages generally have **no explicit font class**, falling back to `body`'s `font-sans` (Tailwind's default system stack) — not Franklin Gothic. Match whichever the new page's Figma actually specifies rather than assuming H2s should inherit the H1 font.
- Primary buttons render in `font-franklin-demi`, secondary buttons in `font-sans` at `font-black` weight — two different typefaces by design (via `Button.vue`), not a bug.

## SEO / structured data

- Each page defines its own `productSchema` (JSON-LD `Product`) and `breadcrumbSchema` in frontmatter, injected via `<Fragment slot="head">`. `lowPrice`/`highPrice` in `productSchema` are hardcoded separately from the visible per-finish prices in the body — if you set a price in one place, set it in the other too, nothing keeps them in sync automatically.
- `title`/`description`/`canonicalUrl` are built per-page in frontmatter — follow the existing pattern (`"[Wheel] - Form Forged [N]-Piece Corvette Wheels | E5 Wheels"` style) rather than copying another wheel's title verbatim.

## Other conventions to carry over intentionally, not by default

- GTM click tracking (`data-gtm-event`/`data-gtm-label` on `Button.vue`) is only applied on the cross-sell "EXPLORE [Wheel]" buttons on existing pages, not on "SHOP"/"SHOP NOW" CTAs — this looks like an oversight, not a deliberate pattern. Worth adding consistently on a new page rather than copying the gap forward.
- Image alt text on gallery/detail images tends to be generic ("[Wheel] Gallery", "[Wheel] Detail 1") — prefer more descriptive alt text on new pages if you have vehicle/wheel/finish context available (this codebase already does better alt text elsewhere, e.g. the gallery pages).

## Checklist for adding a new wheel page

1. Confirm which template family (Form Forged vs. Forged) the new wheel's Figma matches — pick the closest existing `.astro` file as your starting copy.
2. Add a new constants block to `Wheels.ts` (brand name, logo, hero, banner images, detail images, process diagrams, finish images) — don't inline paths.
3. Add a `WHEELS_<NAME>_ROUTE` constant to `Routes.ts`.
4. Confirm each finish's product-page slug against the live AutoSync catalog before hardcoding the shop URLs.
5. Make sure every finish named in body copy has a corresponding tile/link, and vice versa.
6. Match fonts/sizes/spacing to the actual Figma for this wheel — don't assume identical values to the template source, only the same structural pattern.
7. Fill in `productSchema`/`breadcrumbSchema` with this wheel's real title/description/price range/URL.
8. Add cross-sell tiles in "Discover More" pointing at actual sibling wheels (not copy-pasted from the template source).
9. Run `astro check` (0 errors expected) and do a live visual check at at least mobile + desktop widths before considering it done.
