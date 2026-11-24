# E5 client portal

Private CMS for Dave’s client. Built in small PRs off `main`. Nothing goes live until Dave replies **go live** on that PR.

Live URL: **https://portal.e5wheels.com** (same Vercel project; add the `portal.e5wheels.com` domain when this section goes live).

Staff ops (orders, coupons, events, attendees, tracking) stay at **`/admin`** on the main site and still use `ADMIN_PASSWORD` plus `x-admin-password` on `/api/coupons`, `/api/orders`, `/api/events`, `/api/attendees`, and `/api/tracking`.

## Host routing

| Host | Behavior |
|---|---|
| `portal.e5wheels.com` | `/`, `/login`, `/logout`, and section paths are the portal. `robots.txt` is `Disallow: /`. Everything else (shop, blog, etc.) 302s to `https://www.e5wheels.com` + the same path. All responses send `X-Robots-Tag: noindex, nofollow`. |
| `www.e5wheels.com` | `/portal` and `/portal/*` 301 to `https://portal.e5wheels.com` (prefix stripped). |
| Preview / localhost | `/portal` is the portal (no subdomain). Use this to test before DNS. |

Internal Astro routes live under `/portal/*`. Middleware rewrites SSR paths on the portal host onto those routes. The marketing homepage is prerendered, so `vercel.json` also rewrites `portal.e5wheels.com/` and `/robots.txt` at the edge (plus `/login`, `/logout`, and the section slugs).

## Section 1 (this PR)

Login + shell only.

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

## Later sections (not in this PR)

| Section | Portal host | Preview |
|---|---|---|
| Homepage Slides | `/slides` | `/portal/slides` |
| Header & Footer Links | `/links` | `/portal/links` |
| Blog Posts | `/blog` | `/portal/blog` |
| Galleries | `/galleries` | `/portal/galleries` |
| Site Performance | `/performance` | `/portal/performance` |
| Sales & Prospects (GoHighLevel) | `/sales` | `/portal/sales` |

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
