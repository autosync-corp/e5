# E5 Wheels - Astro + Vue + TypeScript Application

Modern e-commerce application built with Astro and Vue 3, featuring exclusive Corvette wheel designs, gallery showcases, and integrated payment processing.

## Tech Stack

- **Astro 5** - Modern web framework with SSR support
- **Vue 3** - Progressive JavaScript framework (for interactive components)
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Stripe** - Payment processing
- **Affirm** - Buy now, pay later financing

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Visit `http://localhost:8080`

### Build for Production
```bash
npm run build
```

### Run Production Server Locally
```bash
npm start
```

### Verify Deployment Readiness
```bash
npm run verify-deployment
```

## Deployment

This application is configured for Server-Side Rendering (SSR) and works on **any Node.js hosting platform** including Vercel, Netlify, Railway, SiteGround, Digital Ocean, AWS, and more.

**📖 Deployment Guide**: See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for platform-specific instructions

Platform-specific guides:
- [SiteGround/cPanel](./DEPLOYMENT.md)
- [Quick Summary](./DEPLOYMENT-SUMMARY.md)
- [Checklist](./SITEGROUND-CHECKLIST.md)

## Project Structure

```
e5/
├── src/
│   ├── pages/                    # Astro pages (file-based routing)
│   │   ├── api/                  # API endpoints (SSR)
│   │   ├── gallery/              # Vehicle & wheel galleries
│   │   ├── generations/          # Corvette generations pages
│   │   ├── shop/                 # E-commerce pages
│   │   └── checkout/             # Checkout flow
│   ├── layouts/                  # Astro layouts
│   ├── core/
│   │   ├── components/           # Shared Vue components
│   │   ├── constants/            # App constants & routes
│   │   ├── composables/          # Vue composables
│   │   └── services/             # API services
│   └── styles/                   # Global styles
├── public/
│   └── assets/                   # Static assets (images, videos)
├── dist/                         # Production build output
├── server.js                     # Production server
├── astro.config.mjs              # Astro configuration
└── package.json                  # Dependencies
```

## Features

### Core Features
- ✅ **Server-Side Rendering** - Astro SSR with Node.js adapter
- ✅ **Static Site Generation** - Pre-rendered gallery pages
- ✅ **Vue Islands** - Interactive components with Vue 3
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Responsive Design** - Mobile-first approach

### E-Commerce
- ✅ **Product Catalog** - AutoSync API integration for wheel data
- ✅ **Shopping Cart** - LocalStorage-based cart management
- ✅ **Stripe Integration** - Credit card payments
- ✅ **Affirm Integration** - Financing options
- ✅ **Order Webhooks** - Go High Level integration

### Gallery System
- ✅ **Vehicle Gallery** - 53 Corvette showcases with SEO-friendly URLs
- ✅ **Wheel Gallery** - Product showcases
- ✅ **Dynamic Filtering** - By generation, style, finish
- ✅ **Image Optimization** - WebP format support

### API Routes
- `/api/create-payment-intent` - Stripe payment intent creation
- `/api/affirm-checkout` - Affirm checkout creation
- `/api/affirm-capture` - Affirm payment capture
- `/api/send-order-webhook` - Order notification webhook

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Stripe (use test keys for development, live keys for production)
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Affirm (sandbox for dev, production for live)
AFFIRM_PRIVATE_KEY=...
PUBLIC_AFFIRM_PUBLIC_KEY=...
AFFIRM_API_URL=https://sandbox.affirm.com/api/v1/transactions
AFFIRM_JS_URL=https://cdn1-sandbox.affirm.com/js/v2/affirm.js

# AutoSync API
AUTOSYNC_API_KEY=your_api_key

# Webhooks
GHL_WEBHOOK_URL=https://your-webhook-url

# Server
PORT=8080
NODE_ENV=development
```

## Gallery Management

### Organize Gallery Images
```bash
npm run gallery:organize
```

### Update Gallery Index
```bash
npm run gallery:update-index
```

## Key Pages

- **Homepage**: `/`
- **Shop**: `/shop`
- **Gallery**: `/gallery/vehicles`
- **Single Vehicle**: `/gallery/[slug]` (e.g., `/gallery/2023-c8-red-corvette`)
- **Generations**: `/generations` and `/generations/c8/c8-stingray`
- **Checkout**: `/checkout`
- **Cart**: `/checkout/cart`

## Development Notes

### Vue Components in Astro
Vue components must use `client:*` directives for interactivity:
```astro
<ShopPage client:only="vue" />
<CartPage client:load />
```

### API Routes
API routes are server-side only and support standard HTTP methods.

### Static Assets
Place static assets in `public/assets/`. They'll be served from `/assets/` in production.

### Gallery URLs
Gallery uses SEO-friendly slugs:
- `/gallery/2023-c8-red-corvette`
- `/gallery/2017-c7-grand-sport`

## Testing

### Test Payment Cards (Stripe)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future expiry date and any 3-digit CVC

### Test Affirm (Sandbox)
Use Affirm's test phone numbers and credentials in sandbox mode.

## Browser Support

Modern browsers with ES2020+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Production Checklist

Before deploying to production:

- [ ] Update environment variables to production values
- [ ] Switch Stripe to live keys
- [ ] Switch Affirm to production keys
- [ ] Update webhook URLs
- [ ] Test payment processing
- [ ] Enable SSL/HTTPS
- [ ] Run `npm run verify-deployment`

## Support & Documentation

- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Start**: [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md)
- **Checklist**: [SITEGROUND-CHECKLIST.md](./SITEGROUND-CHECKLIST.md)
- **Astro Docs**: https://docs.astro.build/
- **Vue 3 Docs**: https://vuejs.org/

---

**Built with Astro 5 + Vue 3 + TypeScript**
