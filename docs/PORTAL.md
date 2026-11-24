# E5 client portal

Private CMS for Dave’s client. Built in small PRs off `main`. Nothing goes live until Dave replies **go live** on that PR.

This repo already had a staff ops panel at `/admin` (orders, coupons, events, attendees, tracking). That panel still exists at **`/admin/ops`** and still authenticates with `ADMIN_PASSWORD` plus `x-admin-password` on `/api/coupons`, `/api/orders`, `/api/events`, `/api/attendees`, and `/api/tracking`. The client portal now owns **`/admin`**.

## Section 1 (this PR)

Login + shell only.

- Route: `/admin` (SSR, `prerender = false`)
- `noindex, nofollow` on the page and `X-Robots-Tag` in middleware
- Already excluded from the sitemap (`/admin` prefix in `astro.config.mjs`)
- Already disallowed in `public/robots.txt` (`Disallow: /admin/`)
- Shared client password, httpOnly signed session cookie `e5_portal` (path `/admin`)
- Logout at `/admin/logout`
- Login rate limit: 8 attempts / 15 minutes per IP (`e5:portal:login:{ip}` in Redis, in-memory fallback)

### Env vars

Set these on the Vercel project (Production + Preview):

| Variable | Required | What it is |
|---|---|---|
| `PORTAL_PASSWORD_HASH` | Yes for go-live | scrypt hash of the shared client password. Generate with `node scripts/hash-portal-password.mjs 'the-password'` |
| `PORTAL_SESSION_SECRET` | Yes for go-live | Random 32+ byte secret used to HMAC-sign the session cookie |
| `ADMIN_PASSWORD` | Preview fallback | Existing staff password. If `PORTAL_PASSWORD_HASH` is missing, login accepts this plaintext value. If `PORTAL_SESSION_SECRET` is missing, this value is also used as the HMAC key so Preview can boot before the new vars are set |

Do **not** store a plaintext portal password in a new env var. `ADMIN_PASSWORD` is the legacy staff pattern; the portal prefers the hash.

Later sections can add more users (table in Redis keyed by username) without changing the cookie format. Section 1 ships one user: `id=e5`.

## Later sections (not in this PR)

| Section | Route | Status |
|---|---|---|
| Homepage Slides | `/admin/slides` | Coming soon |
| Header & Footer Links | `/admin/links` | Coming soon |
| Blog Posts | `/admin/blog` | Coming soon |
| Galleries | `/admin/galleries` | Coming soon |
| Site Performance | `/admin/performance` | Coming soon |
| Sales & Prospects (GoHighLevel) | `/admin/sales` | Coming soon |

## Content storage

Client edits must publish **live immediately** — no draft workflow and no redeploy.

Use **Upstash Redis** (already on this project as `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Coupons already live at `e5:coupons` and are read at request time.

Planned keys (write on save, read in SSR):

- `e5:portal:slides` — homepage hero slides
- `e5:portal:nav` — header / footer links
- `e5:portal:posts:{slug}` + `e5:portal:posts:index` — blog
- `e5:portal:galleries` — immersive gallery sets
- `e5:portal:users` — extra portal users (optional, later)

Public pages keep a code fallback (today’s hardcoded content) and overlay Redis when a key exists. Empty Redis = current site, unchanged.

## Out of scope forever

Wheel **prices and product data** are not editable in this portal. Those come from the AutoSync platform API. Do not add price fields, SKU editors, or product CRUD here.
