# Wheel Page Build Guide

Reference doc for building/checking individual wheel product pages under `src/pages/wheels/*.astro`
(e.g. `daytona.astro`, `sebring.astro`, `sebring-2p.astro`, `speedway.astro`, `sonoma.astro`, `talladega.astro`, `laguna.astro`).

New wheel pages usually reuse one of the patterns below rather than inventing a new layout. Before
building a new one: identify which existing page it's closest to in design, use that file as the
starting template, and adjust content/assets — don't build from scratch.

**`laguna.astro` is the current gold-standard reference for the "Forged" family (2026-08-05).** It
started as a straight copy of `talladega.astro`, then went through several rounds of real user review
that fixed genuine issues in the original template (dead buttons, an oversized image, an awkward
3-column layout, a too-heavy H1). When building or reviewing a "Forged"-family page, use `laguna.astro`
as the base, not `talladega.astro`/`sonoma.astro` directly — those still have the unfixed issues
described below.

## Two known template families

**"Form Forged" template** — `daytona.astro`, `sebring.astro`, `sebring-2p.astro`, `speedway.astro`.
Light background throughout, banner-style storytelling sections, 4-step process diagram.

**"Forged" template** — `sonoma.astro`, `talladega.astro`, `laguna.astro` (reference copy).
Side-by-side wheel image + specs/sizes/buttons layout near the top, 5-step process diagram, a
dark/black-background Finishing section (not light like the other family), plus an "Available
Finishes" gallery (added on `laguna.astro`, not yet backported to `sonoma`/`talladega`).

If a new wheel's Figma looks closer to one family than the other, copy that file, not the other one.
If it doesn't clearly match either, ask before assuming a hybrid is correct.

## Section-by-section — "Forged" template (use `laguna.astro` as the source)

1. **Hero** — full-width static image, `h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] object-cover object-center`, no text overlay
2. **Logo + Badge + Title + Description** (`max-w-[1100px] mx-auto`) — wheel brand logo (sized to dominate, see Typography notes) on the left, small "E5 FORGED" badge on the right, `<h1>` title, description paragraph, "EXCLUSIVELY FORGED FOR..." fitment line
3. **Wheel Image + Specs** (`max-w-[1100px] mx-auto`) — **one 2-column flex row**: wheel render image (`md:w-1/2`) on the left, a single stacked column on the right (`md:w-1/2`) containing Sizes → Finish → Buttons, in that order. Do **not** split Finish into its own third column — that was tried on `laguna.astro` first and produced an awkward, sparse layout with a disconnected "Finish" floating in empty space; reverted back to Talladega's original tight 2-column stack, which is correct.
4. **Available Finishes** (new, `laguna.astro` only so far) — 3-tile grid (`grid-cols-1 sm:grid-cols-3`) of `ImageWithLegend` tiles, one per real finish, each wrapped in a link to that finish's shop URL, caption below each image (finish name, uppercase, letter-spaced, no price/stock text). Add this section whenever the wheel has more than one real finish to show.
5. **The Forging Process** — heading, "FORGED IN THE USA..." eyebrow with inline USA flag icon, intro paragraph ending in the actual compatible vehicles (e.g. "...for the C8 Z06, ZR1, and E-Ray."), 5-step diagram grid (`grid-cols-2 md:grid-cols-5`: Material → Forging → Machine → Refine → Finish), "LEARN MORE" button
6. **Finishing** (dark section, `bg-black`) — a detail-shot image as a 30%-opacity absolute background, "FINISHING" heading + description paragraph naming the *actual* finishes available (keep this in sync with the Available Finishes section above it)
7. **Detail Images Grid** — 2 images side by side (`grid-cols-1 md:grid-cols-2`), then a 3rd full-width image below. **Watch the height on that 3rd image** — see Known Quirks below, it has no aspect-ratio safety net.
8. **Gallery Banners** — two banners stacked: "VETTE GALLERY" (links to `GALLERY_VEHICLES_ROUTE`) and "WHEEL GALLERY" (links to `GALLERY_WHEELS_ROUTE`), each with a heading, one line of copy, and a "VIEW GALLERY" button. Both banners need a real button+link — the original template had neither wired up (see Known Quirks).
9. **Related Wheels** — 2-up cross-sell tiles linking to sibling wheels in the same family (real, working links via `buildWheelUrl`)
10. **Footer Red Section** — E5 Wheels logo mark on a red background, wrapped in a link to `HOME_ROUTE`

## Shared components (don't reinvent)

- **`Button.vue`** (`@/core/components/Button.vue`) — used on Form Forged pages. The Forged-family pages (`talladega`/`sonoma`/`laguna`) instead hand-roll `<a>`/`<button>` tags styled inline with the same red-fill/outline pattern — stay consistent with whichever family you're extending, don't mix `Button.vue` into a Forged-family page.
- **`ImageWithLegend.vue`** — image + centered content below via slot. Used for process steps, Form Forged finish tiles, and the Forged family's new "Available Finishes" tiles.
- **`BannerFullWidthWithLegend.vue`** — Form Forged family only. Props: `image`, `alt`, `orientation` (`LEFT`/`RIGHT`/`CENTER` from `@/core/types/App.ts` `Orientations`), `bgColor`, `class` for height.
- **`.wheel-finish-grid`** (global CSS in `src/assets/main.css`) — Form Forged family's finish-grid class. The Forged family's "Available Finishes" section uses a plain `grid grid-cols-1 sm:grid-cols-3` instead — don't mix the two.

## Asset & constants conventions

- All copy strings, image paths, and brand names for a wheel live in `src/pages/wheels/constants/Wheels.ts`, one block per wheel, prefixed `<WHEEL_NAME>_`. Add a new block here for a new wheel, don't inline strings/paths in the `.astro` file.
- Wheel render images can be either a local `/public/assets/images/...webp` file **or** a direct AutoSync CDN URL (`https://wheels.autosyncstudio.com/webp/E5/<Model>_<Code>_<Finish>_Front_5-lug_0001.webp`) — `laguna.astro` uses the CDN URL directly for all 4 finish renders since those already exist there and don't need a local copy. Verify the URL resolves (`curl -o /dev/null -w "%{http_code}"`) before wiring it in.
- **Never repoint a shared constant to a new wheel's image.** `VETTE_GALLERY_IMAGE_1` and `WHEEL_GALLERY_STUDIO_BANNER` are imported by multiple wheel pages (`sonoma`, `talladega`, and previously `laguna`) — changing their value would silently change images on sibling pages too. Always add a new `<WHEEL_NAME>_`-prefixed constant instead (see `LAGUNA_VETTE_GALLERY`, `LAGUNA_WHEEL_GALLERY_BANNER` for the pattern) and import that on the new page only.
- Route constants for each wheel's own page live in `src/core/constants/Routes.ts` as `WHEELS_<NAME>_ROUTE` — add one here for a new wheel page.
- If a wheel isn't fully ready (missing images, unconfirmed pricing/copy/fitment), it's fine to scaffold the page with clearly marked placeholders (`// TODO: ...` comments) rather than waiting — but never fabricate pricing or vehicle-fitment claims; leave those as explicit TODOs until confirmed. Use the live AutoSync catalog (`fetchWheels()` / direct API query) for anything checkable (sizes, offsets, bolt pattern, real finish names) instead of guessing from a Figma label.

## Finish tiles & shop links — read before building

- Build finish URLs with `buildWheelUrl(BRAND_NAME, 'Finish Name')` (from `@/core/utils/wheelUrl`) — don't hand-write the slug.
- The finish name passed in must match a finish that actually exists in the live AutoSync wheel catalog for that series — the shop's product page resolves it by deduping the API's `Finish`+`Color`+`Accent` combination per series and matching against the slug. **A previous real bug**: a wrong/stale slug silently resolved to the wrong finish instead of erroring. Verify finish names against the live catalog before using them.
- Whatever finishes are named in body copy (fitment line, Finishing section, specs "FINISH" field) must stay consistent with each other and with the Available Finishes tiles actually on the page. `sebring-2p` (Form Forged family) has a known unfixed mismatch here — don't repeat it.
- Double-check that a wheel render image's finish actually matches the "FINISH" label displayed next to it — these are easy to mix up when sourcing images and labels from different messages/screenshots. (Caught and fixed once already on `laguna.astro`: the specs-section wheel image was originally Polished while the label said Brushed Aluminum.)

## Typography notes

- Only one real font file exists: `Franklin Gothic Heavy Regular.ttf`. `fonts.css` declares `Franklin Gothic Demi`/`Medium`/`Book` (and `Excon Variable`) as separate `@font-face` families that all point to that same file at different declared `font-weight` values — so `font-franklin-demi`/`-medium`/`-book`/`excon` are **visually identical to Heavy**. Switching between those class names is a no-op; there is no real weight variation available in this font family.
- The only genuinely different typeface available on the site is the plain default (`font-sans` with no custom class) — the browser/OS system sans-serif, used for most body copy site-wide. If a Figma calls for a visually lighter/different H1 than the blocky Franklin Gothic look, `font-sans` is the real alternative, not another `font-franklin-*` variant.
- `laguna.astro`'s `<h1>` ended up as `font-sans`, sized small and letter-spaced (`text-[16px] md:text-[20px] lg:text-[24px] tracking-[6px] md:tracking-[9px] lg:tracking-[12.8px]`) rather than the large `font-franklin-heavy` treatment on `talladega.astro`/`sonoma.astro` — a deliberate, user-confirmed style choice for this page, not a universal rule. Match whatever the specific wheel's Figma calls for; don't copy Laguna's exact H1 styling onto a different wheel without checking its own design first.

## SEO / structured data

- Each page defines its own `productSchema` (JSON-LD `Product`) and `breadcrumbSchema` in frontmatter, injected via `<Fragment slot="head">`. `lowPrice`/`highPrice` are hardcoded separately from the visible per-finish prices in the body — if you set a price in one place, set it in the other too, nothing keeps them in sync automatically.
- If the catalog has no real price yet (`Price: null` on every variant, as with Laguna at launch), use `"availability": "https://schema.org/PreOrder"` with placeholder `0` prices and a `// TODO` comment, rather than inventing numbers.
- `title`/`description`/`canonicalUrl` are built per-page in frontmatter — write real copy for the specific wheel rather than copying another wheel's title verbatim.

## Known quirks in the original Talladega/Sonoma template — check for these on any page copied from them

- **Dead buttons**: the original template has multiple buttons with no `href`/link at all — the "Wheel Gallery" banner's "VIEW GALLERY" button, the "LEARN MORE" button under the Forging Process, the "EXPLORE E5 FORGED" button in the specs section, and the "Vette Gallery" banner has no button at all. All of these were fixed on `laguna.astro` (linked to `GALLERY_WHEELS_ROUTE`, `PROCESS_FORGED_ROUTE`, `PROCESS_FORGED_ROUTE`, and `GALLERY_VEHICLES_ROUTE` respectively) but are still broken on `talladega.astro`/`sonoma.astro` themselves. Audit every button/CTA on a new page for a real link — don't assume the template already has one just because it looks like a button.
- **Unconstrained full-width image height**: the 3rd image in the Detail Images Grid renders with `w-full h-auto` and no `max-w` on its container — if the source image is landscape-but-not-ultra-wide (Laguna's was 1920×1280), it renders at full native height on wide viewports (~1280px tall in that case), way more than intended. Always give full-bleed images an explicit responsive height range (`h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]`) with `object-cover object-center` instead of `h-auto`.
- **Footer logo mark not linked**: the E5 Wheels logo in the red footer strip had no link — added `href={HOME_ROUTE}` on `laguna.astro`, still unlinked on `talladega`/`sonoma`.
- GTM click tracking (`data-gtm-event`/`data-gtm-label`) is inconsistently applied across buttons in the original template — add it consistently on a new page rather than copying the gaps forward.
- Image alt text on gallery/detail images tends to be generic ("[Wheel] Gallery", "[Wheel] Detail 1") — prefer more descriptive alt text on new pages if you have vehicle/wheel/finish context available.

## Checklist for adding a new wheel page

1. Confirm which template family (Form Forged vs. Forged) the new wheel's Figma matches. For Forged-family pages, start from `laguna.astro`, not `talladega.astro`/`sonoma.astro`.
2. Check the live AutoSync catalog for this wheel's real specs (sizes, offsets, bolt pattern) and real finish names — use those instead of guessing.
3. Add a new constants block to `Wheels.ts` (brand name, logo, hero, banner images, detail images, process diagrams, finish images) — don't inline paths, and never repoint a constant already used by another wheel page.
4. Add a `WHEELS_<NAME>_ROUTE` constant to `Routes.ts`.
5. Build finish/shop URLs with `buildWheelUrl()`, verified against the live catalog.
6. Make sure every finish named in body copy has a corresponding tile/link, and vice versa; make sure every wheel-render image's finish matches its adjacent label.
7. Audit every button/CTA for a real, working link — see Known Quirks above.
8. Cap the height of any full-bleed/full-width image with `object-cover object-center`, don't rely on `h-auto`.
9. Fill in `productSchema`/`breadcrumbSchema` with this wheel's real title/description/price range/URL — mark clearly with `// TODO` anything not yet confirmed (pricing, fitment, marketing copy).
10. Match fonts/sizes/spacing to the actual Figma for this specific wheel — don't assume identical values to the template source, only the same structural pattern.
11. Run `astro check` (0 errors expected) and do a live visual check at mobile + desktop widths before considering it done.
