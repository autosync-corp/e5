# E5 client portal

Private CMS for Dave’s client. Built in small PRs off `main`. Nothing goes live until Dave replies **go live** on that PR.

Live URL: **https://portal.e5wheels.com** (same Vercel project; add the `portal.e5wheels.com` domain when this section goes live).

Staff ops (orders, coupons, events, attendees, tracking) stay at **`/admin`** on the main site and still use `ADMIN_PASSWORD` plus `x-admin-password` on `/api/coupons`, `/api/orders`, `/api/events`, `/api/attendees`, and `/api/tracking`.

## Host routing

| Host | Behavior |
|---|---|
| `portal.e5wheels.com` | `/` 302s to `/login`. `/login` is login or dashboard depending on the session. `/logout`, `/dashboard`, and section paths are the portal. `robots.txt` is `Disallow: /`. Everything else (shop, wheels, prerendered pages) 302s to `https://www.e5wheels.com` + the same path. All responses send `X-Robots-Tag: noindex, nofollow`. |
| `www.e5wheels.com` | `/portal` 301s to `https://portal.e5wheels.com/login`. `/portal/*` 301s to `https://portal.e5wheels.com` (prefix stripped). |
| Preview / localhost | `/portal` is the portal (no subdomain). Use this to test before DNS. |

Internal Astro routes live under `/portal/*`. Middleware rewrites SSR paths on the portal host onto those routes. The marketing homepage is a prerendered `index.html`, and Vercel serves the filesystem before rewrites, so `vercel.json` **redirects** `portal.e5wheels.com/` to `/login` (302) before that file can be cached. A catch-all 302 on the portal host sends any path outside the portal allowlist (login, logout, dashboard, sections, robots.txt, `_astro`/`assets`/`js`/favicon) to www. `/login` and section slugs are dest-rewritten at the edge so they still beat prerendered files such as `/blog`.

Portal HTML is cookie-varying (login vs dashboard), so it must never be CDN-cached. The homepage `Cache-Control: public, s-maxage=3600` rule on `source: "/"` is skipped when the host is `portal.e5wheels.com`. The portal host instead gets `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow` on `/` and `/(.*)`. Middleware also sets `private, no-store` on every portal-host response, every `/portal/*` response, and any response that sets `Set-Cookie`.

## Section 1

Login + shell. Shipped.

- Production: `https://portal.e5wheels.com`
- Preview: `/portal` on the Vercel preview host
- `noindex, nofollow` on portal pages; portal host also noindexes every response
- Sitemap excludes `/admin` and `/portal`
- Main-site `robots.txt` disallows `/admin/` and `/portal/`
- Shared client password, httpOnly signed session cookie `e5_portal`
  - Portal host: cookie path `/` (host-only, not shared with www)
  - Preview: cookie path `/portal`
- Logout at `/logout` (portal host) or `/portal/logout` (preview)
- Login rate limit: 8 attempts / 15 minutes per IP (`e5:portal:login:{ip}` in Redis, in-memory fallback)

### Env vars

Both are **required**. If either is missing, login is disabled and the form shows an error. There is no `ADMIN_PASSWORD` fallback.

| Variable | Required | What it is |
|---|---|---|
| `PORTAL_PASSWORD_HASH` | Yes | scrypt hash of the shared client password. Generate with `node scripts/hash-portal-password.mjs 'the-password'` |
| `PORTAL_SESSION_SECRET` | Yes | Random 32+ byte secret used to HMAC-sign the session cookie |

These are already set on the Vercel project (Production + Preview).

Later sections can add more users (table in Redis keyed by username) without changing the cookie format. Section 1 ships one user: `id=e5`.

### Go-live DNS

In Vercel, add domain `portal.e5wheels.com` to the e5 project (same deployment as www). Point DNS to Vercel. Do not merge this PR until Dave replies **go live**.

## Section 2

Homepage banner slides. Shipped.

- Portal host: `https://portal.e5wheels.com/slides`
- Preview: `/portal/slides`
- Redis key `e5:portal:slides` (JSON). First GET seeds it from the current hardcoded slides. Empty Redis or Redis errors fall back to those slides, so the homepage does not change until the client saves an edit.
- Public `GET /api/home-slides` is `s-maxage=60` (stale-while-revalidate 600). The homepage stays prerendered with `s-maxage=3600` and one SSR H1; the slider hydrates from this API so edits show within about a minute without hurting PageSpeed.
- Auth-protected `GET/PUT /api/portal/slides` (preview: `/portal/api/slides`) and image upload `POST .../slides/upload`
- Images go to the `e5-portal` Vercel Blob store (`BLOB_READ_WRITE_TOKEN`). JPEG/PNG/WebP, max 4 MB. Relative `/…` or `https://(www.)e5wheels.com/…` links only.
- Film-poster layout (neon, Watch the Film lightbox) stays; copy and photo are editable.

## Section 3

Header and footer links.

- Portal host: `https://portal.e5wheels.com/links`
- Preview: `/portal/links`
- Redis key `e5:portal:nav` (one versioned JSON document). First GET seeds it from the current hardcoded header/footer. Empty Redis or Redis errors fall back to that seed, so the public site does not change until the client saves an edit.
- Saves publish live immediately (no draft). Auth-protected `GET/PUT /api/portal/nav` (preview: `/portal/api/nav`) with the same session cookie and Origin check as slides.
- Public `GET /api/site-nav` is `s-maxage=60` (stale-while-revalidate 600).
- Allowed hrefs: site-relative paths, `https://www.e5wheels.com` / `e5wheels.com`, `tel:`, `mailto:`, E5 social profiles, and the existing Google Maps address link. `javascript:` and other unsafe schemes are rejected.
- Logo, cart, and staff `/admin` are not editable. Wheel prices stay on AutoSync.

### Crawlable nav tradeoff

Most pages are SSR (`output: 'server'`). `MainLayout` and `Footer` load `e5:portal:nav` at request time (60s in-memory cache, same pattern as tracking) and emit live `<a href>` in HTML. Dropdown children stay in the desktop markup (CSS hover, not `v-if`) so they are crawlable too.

Three pages are prerendered for PageSpeed: `/`, plus two gallery detail routes. Those bake the seed (or last-build snapshot) into HTML. Visitors still see live edits within about a minute via `/api/site-nav` hydrate on the Vue navbar and the footer. Crawlers of those three pages see the baked links until the next deploy. Dropping homepage prerender would put live nav in that HTML immediately but would undo the LCP work from the PageSpeed/slides PRs, so this PR keeps prerender on those routes.

Do not merge until Dave replies **go live**.

## Section 4 (this PR)

Blog posts.

- Portal host: `https://portal.e5wheels.com/blog`
- Preview: `/portal/blog`
- Live public blog still reads **WordPress** at `https://post.e5wheels.com` for unedited posts, so current URLs, HTML, and SEO stay the same until the client saves an edit.
- Redis keys `e5:portal:posts:{slug}` + `e5:portal:posts:index`. A save writes an overlay for that slug only. Unpublished overlays 404; deleted overlays 410; both drop from the blog index and `/sitemap-blog.xml`.
- Auth-protected `GET/PUT/DELETE /api/portal/posts` (preview: `/portal/api/posts`) and image upload `POST .../posts/upload` to the `e5-portal` Blob store. JPEG/PNG/WebP, max 4 MB.
- Public `/blog` and `/blog/{slug}` stay server-rendered. New live posts appear in the index and sitemap without a redeploy (`robots.txt` lists `/sitemap-blog.xml`).
- Rendered HTML from portal edits is sanitized (no script/iframe/on* attributes; links limited to http(s)/mailto/tel). Unedited WordPress HTML is passed through unchanged.
- The post editor decodes WordPress excerpt entities (en dashes, ellipses) and drops a trailing `[&hellip;]` / `[...]` so a save does not write those into the live meta description. Public pages keep the WordPress excerpt until the client saves.

Do not merge until Dave replies **go live**.

## Section 6 (this PR)

Site Performance.

- Portal host: `https://portal.e5wheels.com/performance`
- Preview: `/portal/performance`
- Read-only. No Redis. The page reads a committed snapshot under `src/data/performance/` (`compare.json`, `latest.json`, `history.json`, and `runs/<YYYY-MM-DD>/` JSON + PNG score cards).
- Primary view is latest vs the November 1, 2026 baseline (mobile and desktop). Better/worse comes from each metric’s `direction` field in `compare.json` — do not recompute it.
- Caveats on the page are rewritten from `compare.json.caveats` into client language (lab test, not real visitors; Nov 1 mobile score spread; testing tool version change). Do not invent numbers.
- PNG score cards are imported into the auth-gated page (hashed `/_astro/` URLs). They are not linked from the public site.

### Monthly refresh

When the Website Performance Audit bot drops a new v2 export:

1. Replace `src/data/performance/compare.json`, `latest.json`, `history.json`.
2. Copy the new `runs/<YYYY-MM-DD>/` folder (summary.json + mobile.png + desktop.png + compare.png on the latest run).
3. Point the three PNG imports in `src/pages/portal/performance.astro` at that new dated folder.
4. Open a small preview PR. Do not merge until Dave replies **go live**.

Do not merge until Dave replies **go live**.

## Section 7 (this PR)

Sales & Prospects.

- Portal host: `https://portal.e5wheels.com/sales`
- Preview: `/portal/sales`
- Read-only. The page never creates, edits, or deletes CRM records. Range switching is a GET (`?days=7|30|90`, default 30).
- Server-side fetch of contacts, opportunities, pipelines, and contact custom-field definitions. Results are cached about 5 minutes in memory and at `e5:portal:sales:v1:{days}` in Redis when Redis is up, so repeat views do not hit the CRM on every click.
- Contacts are loaded with a date-ranged search, then GET `/contacts/` if that search fails. Opportunities use GET `/opportunities/search` with `date` / `endDate`. Both paginate (100 per page).
- Summary cards: new contacts, open deals + value, won deals + value, and win rate (`won / (won + lost)`) for the selected period. If nothing closed, win rate is an em dash.
- Pipeline boards are opportunities **created in the selected period**, grouped by current stage. Empty stages still list so the board matches the CRM.
- Recent prospects: newest 25 contacts in the period. Name, date added, source, tags, and linked deal stage. No phone or email columns; those fields are dropped before the HTML is rendered.
- Lead sources: counts of the contact `source` field, including “Not set”.
- Checkout “How did you hear about us?” is **not** a contact custom field and **not** a location tag in this account. Checkout sends it on the order webhook (`how_did_you_hear` plus a line in order notes). The page only shows a hear-about chart if a matching contact field or tag actually has values; otherwise that block is omitted.
- Env vars (already on the Vercel project, Production + Preview): `GHL_PRIVATE_TOKEN` (server-side only — never sent to the browser, logged, or committed) and `GHL_LOCATION_ID`. If either is missing or the CRM request fails, the page shows “Couldn't load sales data right now.”
- CRM fetches send `User-Agent: E5Portal/1.0` (LeadConnector’s edge 403s some default agents). Failed requests log one line (`step`, HTTP status or `missing-env`/`network`/`timeout`/`parse`, whether each env var is missing). The token and response headers are never logged. Failures are not written to the 5-minute cache.
- Behind the existing `e5_portal` login. Not public.

Do not merge until Dave replies **go live**.

## Later sections (not in this PR)

| Section | Portal host | Preview |
|---|---|---|
| Galleries | `/galleries` | `/portal/galleries` |

## Content storage

Client edits must publish **live immediately** — no draft workflow and no redeploy.

Use **Upstash Redis** (already on this project as `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Coupons already live at `e5:coupons` and are read at request time.

Keys (write on save, read at request time):

- `e5:portal:slides` — homepage hero slides (Section 2)
- `e5:portal:nav` — header / footer links (Section 3)
- `e5:portal:posts:{slug}` + `e5:portal:posts:index` — blog (Section 4)
- `e5:portal:sales:v1:{days}` — read-only sales snapshot cache (Section 7, ~5 minutes)
- `e5:portal:galleries` — immersive gallery sets
- `e5:portal:users` — extra portal users (optional, later)

Public pages keep a code fallback (today’s hardcoded content) and overlay Redis when a key exists. Empty Redis = current site, unchanged.

## Out of scope forever

Wheel **prices and product data** are not editable in this portal. Those come from the AutoSync platform API. Do not add price fields, SKU editors, or product CRUD here.
