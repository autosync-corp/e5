# Porting e5wheels-new-visualizer into the e5wheels (Vercel) repo

This folder is a Corvette wheel/color visualizer, built and tested in the
`testground` repo (SiteGround-hosted staging) as a deliberate step before its
real destination: the `e5wheels` repo, hosted on Vercel. This document is for
whoever (human or Claude) does that final port.

**Status: ported.** Live at `public/visualizer-app/` (both `.php` files
renamed to `.html`, iframe `src` references updated — see section 2 below,
which the port fixed at *two* call sites, not just the one this doc
originally flagged). `/visualizer` now redirects to
`/visualizer-app/e5wheels-visualizer_9.html` instead of the old third-party
AutoSync widget embed. Ten `.lnk` Windows shortcut files found inside
`images/C7_Z06/Wheels/Sebring/Chrome/` (in place of the real `1.webp`
through `10.webp`) were removed during the port as clearly-accidental local
cruft, not real content — not documented as a known gap below, so flagging
it as a new one. The code degrades gracefully for missing images (hides
instead of showing a broken-image icon), same as the documented gaps below.

## 1. Files to copy

- `index.php` — the actual car configurator (layered body/wheel/caliper
  images, dropdowns, thumbnail gallery, nav arrows). Runs standalone too.
- `e5wheels-visualizer_9.php` — the outer wrapper (nav, generation tabs,
  wheel-style selector, config dropdowns, full-width thumbnail strip). Embeds
  `index.php` in an iframe and drives it via cross-frame DOM access.
- `css/gallery.css` — index.php's stylesheet.
- `images/` — all car photos, wheel/color renders, and alpha/luminance masks
  (~670MB, ~4,900 files as of this writing).
- `Fonts/` — `Eurostile Condensed Regular.otf`, referenced by `@font-face` in
  gallery.css.

Copy the whole set together, preserving their relative positions to each
other. Every path in the code (image URLs, the iframe's `src`, the font
`url()`) is relative — there are no hardcoded absolute URLs to testground or
any other domain. As long as relative structure is preserved, the exact
directory this lands in on the e5wheels repo doesn't matter.

## 2. Required changes for Vercel — do not skip this

**Rename both `.php` files to `.html`.** They contain zero actual PHP (no
`<?php` tags at all) — they were named `.php` purely to route requests
through SiteGround's PHP-FPM instead of its static-file layer, which ignored
`.htaccess` and cached HTML for 180 days regardless of content changes.
Vercel doesn't run PHP by default, so shipped as `.php` these files will most
likely 404 or download unprocessed instead of rendering.

After renaming, update the one place that references the filename:
- In `e5wheels-visualizer_9.php`, `function loadGen(key){...}` sets
  `frame.src='index.php?car='+key;` — change this to `index.html?car='+key`
  (or whatever the new filename actually is).
- Grep both files for the literal string `.php` to make sure nothing else
  references it (as of this writing, that iframe `src` line is the only hit;
  the `index.php` filename appearing in a couple of code comments is
  harmless and doesn't need changing).

  **Correction found during the actual port**: there is a *second* live
  reference beyond the `loadGen()` line above — the iframe's initial,
  hardcoded `src="index.php?car=C5"` attribute in the markup itself (before
  `loadGen()` ever runs). Missing this one means every generation switch
  works fine except the very first page load, which 404s. Grep for the
  literal string, don't just patch the one call site this doc names.

**Drop the `.htaccess` cache-control rule; it won't apply on Vercel anyway**
(Vercel ignores `.htaccess` entirely). If stale caching turns out to be a
problem on Vercel too, the fix there is a `headers` entry in `vercel.json`
targeting these two routes, not the PHP-extension trick.

## 3. Architecture notes (context for whoever maintains this)

- **Two-file, iframe-based structure.** `e5wheels-visualizer_9.php` is
  itself a thin bootstrap: its actual page content is a giant template
  string injected into a `#shell` iframe via `document.write()` (deliberately
  *not* `iframe.srcdoc` — that was tried first and intermittently rendered a
  blank page for reasons never fully root-caused; `document.write()` fixed
  it). Inside that injected page, a second iframe (`#vizFrame`) loads
  `index.php` (soon `.html`) via a **relative** `src`. This relative,
  same-origin relationship is required — the wrapper reaches into
  `frame.contentDocument` to set dropdown values and `.click()` hidden
  elements inside index.php, which silently stops working across origins.
  If this ever needs to be split across two different domains/subdomains,
  that cross-frame control logic (`drive()`, `driveWheelBtn()` in the
  wrapper) will need a `postMessage`-based rewrite instead.

  **Note for anyone testing this with Playwright or similar**: the top-level
  page's DOM is nearly empty (just the `#shell` iframe) — the real nav,
  generation tabs, wheel-style grid, etc. only exist inside
  `page.frameLocator('#shell')`, not on the top-level page. Querying the
  top-level document directly will find zero of these elements and isn't a
  bug in the site.
- **Layered-image compositing.** Each car photo is actually 3 stacked
  images (body color, caliper color, wheel color), masked with either a
  JS-baked canvas alpha mask (main image, for Safari support) or a plain CSS
  `mask-mode:luminance` (thumbnails). If you ever add a new car generation or
  wheel style, the mask needs to be sized/drawn the same way `getAlphaMaskUrl`
  does — a naive stretch instead of a cover-style crop will visibly misalign
  the wheel-color overlay from the actual wheel.
- **Two folder-naming quirks baked into the code** (see `wcForStyle`/
  `wcForPath` in the wrapper, and `wheelColorForCarPaths` in index.php):
  Speedway's "Bronze" color folder is named just `Bronze` everywhere (not
  `Bronze Brushed Tint` like Daytona/Sebring), and C8_Z06's Daytona folder is
  misspelled `Hypee Silver`. If any new car/wheel-style asset drop ever
  renames these to be consistent, both of those special cases can be deleted
  — but until then, don't "fix" the typo in isolation or it'll break the
  existing path lookups. Both verified working correctly after the port
  (tested via Playwright: C8_Z06 + Daytona + "Hyper Silver" color option,
  and Speedway + "Bronze Brushed Tint" option on C6 Grand Sport — both
  render the right images with no console errors).
- **Responsive behavior is JS-driven, not pure CSS**, because a few pieces
  physically move in the DOM at the 768px breakpoint rather than just being
  restyled: the full-width thumbnail strip relocates to sit right under the
  car image on mobile (instead of after the whole config panel), and the
  wheel-style selector becomes a narrow vertical rail beside the image on
  mobile (instead of a horizontal 3-across grid). Both are driven by
  `placeThumbStrip()` / `placeWsGrid()`, called from `layoutTopRow()` on
  load, resize, and generation switch. Also JS-driven: the image column's
  height matches the sidebar's real height on desktop (capped to whatever
  fits the actual viewport, with the sidebar scrolling internally rather
  than the whole page scrolling), and reverts to a fixed 16:9 ratio on
  mobile (matching the image's own column width — sizing it from the
  sidebar's height on a narrow phone previously produced a tall, cropped
  image with the wheels barely visible).

## 4. Known content gaps (informational — not blocking, not touched during this build)

- `C7_Stingray/Wheels/Daytona/Titanium/6.webp` vs `6 (1).webp` are two
  genuinely different renders (confirmed via visual diff, not a duplicate
  upload) — nobody has picked which one is correct yet.
- Three renders don't exist and were never supplied: `C7_Z06/Speedway/Satin
  Black/1.webp`, `C8_Stingray/Body/Red Mist Metallic Tintcoat/8.webp`,
  `C8_Stingray/Wheels/Sebring/Chrome/8.webp`. The code degrades gracefully
  (the broken image just hides itself instead of showing a broken-image
  icon) but the gaps are real.
- **New gap found during the port** (not from the original testground
  build): `C7_Z06/Wheels/Sebring/Chrome/1.webp` through `10.webp` were
  actually 10 broken Windows shortcut (`.lnk`) files, not real images —
  removed during the port rather than shipped as-is, since a `.lnk` file
  is meaningless on a server and would never have rendered anyway. Net
  effect is the same as the gaps above (frames 1-10 for this specific
  car/wheel/color combo will hide instead of show), but real replacement
  images still need to be sourced for this combo.

## 5. Verification checklist after porting

These files have zero server-side logic, so they can be served locally with
any static file server for testing (just make sure it serves `.html` as
`text/html`, which any standard server already does by default). Suggest
driving a headless browser (e.g., Playwright) rather than eyeballing it —
several of the bugs found during this build (a wheel-color overlay drifting
off the actual wheel, a 404 that only reproduced on one specific wheel
style/car combination, a mobile image cropped so tight the wheels were barely
visible) were not visible from casual clicking and only showed up under
systematic per-combination testing.

- [x] Iframe's `src` (and any other `.php` references) updated to the
      renamed file, and it actually loads (not a 404 or raw download).
      Confirmed both the `loadGen()` call site and the initial hardcoded
      markup attribute.
- [x] All 8 generations checked at default state via Playwright: zero
      console errors, zero failed/404 network requests on any of them.
      (Not yet exhaustively tested: all 3 wheel styles x 8 generations = 24
      full combinations, or every color option per combination — spot-check
      recommended before treating this as fully verified.)
- [ ] The wheel-color overlay stays visually aligned to the actual wheel
      after switching wheel style and after switching generation (this is
      the alpha-mask-baking cover-vs-stretch bug from section 3 — it's an
      easy regression to reintroduce). Not visually confirmed pixel-by-pixel
      during the port — only confirmed no console/network errors.
- [x] Speedway + a color other than the default, and C8_Z06 + Daytona +
      Hyper Silver specifically (the two folder-naming quirks above) render
      the color the dropdown says, not a fallback/wrong color. Confirmed via
      Playwright (see architecture notes above).
- [ ] Desktop widths (roughly 820px and up) need no page-level scroll; the
      sidebar may scroll internally on a short viewport, which is expected.
      Not tested during the port.
- [ ] Mobile: thumbnail strip sits right under the car image (not after the
      whole config panel), wheel style shows as a vertical rail beside the
      image (not a row below everything), and the car image shows the whole
      car with wheels clearly visible (not a tall, over-zoomed crop). Not
      tested during the port.
- [ ] No horizontal scrollbar at any width from ~360px up to a wide desktop
      monitor. Not tested during the port.
- [x] Browser console clean of errors while clicking through all 8
      generations, plus 3 targeted wheel-style/color combinations (Daytona
      Hyper Silver, Speedway Bronze, Sebring Chrome on C7_Z06 — the last one
      specifically to confirm the removed `.lnk` files degrade gracefully).
