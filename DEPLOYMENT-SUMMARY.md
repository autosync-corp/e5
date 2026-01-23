# SiteGround Deployment - Quick Start

## What Changed

Your Astro application has been configured for Server-Side Rendering (SSR) to support:
- API routes for Stripe payments
- API routes for Affirm financing
- Webhook endpoints
- Dynamic server functionality

## Files Added/Modified

### New Files Created
1. **server.js** - Production server entry point
2. **DEPLOYMENT.md** - Complete deployment guide
3. **SITEGROUND-CHECKLIST.md** - Step-by-step deployment checklist
4. **scripts/verify-deployment.js** - Pre-deployment verification tool
5. **.htaccess** - Apache configuration for routing (if needed)

### Modified Files
1. **astro.config.mjs** - Added Node.js adapter and SSR configuration
2. **package.json** - Added @astrojs/node dependency and start script
3. **src/pages/gallery/[id].astro** - Added prerender flag
4. **src/pages/gallery/wheels/detail/[id].astro** - Added prerender flag

## Quick Deployment Steps

### 1. Prepare Locally
```bash
# Build the application
npm run build

# Verify deployment readiness
npm run verify-deployment

# Test production server locally
npm start
# Visit http://localhost:8080 to verify
```

### 2. Upload to SiteGround

Upload these files/folders to your SiteGround hosting:
- `dist/` (entire folder)
- `server.js`
- `package.json`
- `package-lock.json`

### 3. Configure on Server

1. **Create .env file** on server with production values:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   AFFIRM_PRIVATE_KEY=...
   PUBLIC_AFFIRM_PUBLIC_KEY=...
   AUTOSYNC_API_KEY=... (not "efive")
   GHL_WEBHOOK_URL=...
   NODE_ENV=production
   PORT=8080
   ```

2. **Install dependencies** via SSH:
   ```bash
   npm install --production
   ```

3. **Configure Node.js** in SiteGround Site Tools:
   - Go to Devs → Node.js Manager
   - Application Startup File: `server.js`
   - Node.js Version: 18.x or higher
   - Application Mode: Production

4. **Start the application** via Node.js Manager

### 4. Test Deployment

Visit your domain and test:
- Homepage loads
- Gallery pages work
- Shop and products display
- Checkout flow functions
- Payment processing works (test mode first!)

## Important Notes

### Environment Variables
⚠️ **CRITICAL**: Update ALL environment variables to production values:
- Stripe: Use `sk_live_...` and `pk_live_...` keys
- Affirm: Use production keys and URLs
- AutoSync: Use your actual API key (not the hardcoded "efive")
- Webhooks: Use production webhook URLs

### Security Checklist
- [ ] `.env` file is NOT in version control
- [ ] API keys are production keys (not test keys)
- [ ] `AUTOSYNC_API_KEY` is moved to environment variable
- [ ] SSL certificate is active
- [ ] HTTPS is enforced

### Performance
Your gallery has many large images. Consider:
- Using image optimization service
- Implementing lazy loading
- Adding CDN for static assets

## Testing Checklist

Before going live:
- [ ] Test with Stripe test card: 4242 4242 4242 4242
- [ ] Verify Affirm financing flow
- [ ] Check all gallery pages load
- [ ] Test product pages
- [ ] Verify checkout completes
- [ ] Confirm webhooks are received

After going live:
- [ ] Process one real test transaction
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Verify analytics working

## Common Issues

**Server won't start**: Check Node.js version (needs 18+) and error logs

**404 errors**: Verify all dist/ files uploaded and server.js is startup file

**Payment fails**: Check environment variables loaded correctly

**Images missing**: Verify dist/client/ folder uploaded completely

## Support Files

- **DEPLOYMENT.md** - Detailed deployment instructions
- **SITEGROUND-CHECKLIST.md** - Complete deployment checklist
- **.env.example** - Environment variables template

## Scripts Available

```bash
npm run build              # Build for production
npm run verify-deployment  # Check if ready to deploy
npm start                  # Run production server
npm run dev                # Development mode
```

## Need Help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
2. Review [SITEGROUND-CHECKLIST.md](./SITEGROUND-CHECKLIST.md) for step-by-step guide
3. Contact SiteGround support for hosting issues
4. Check SiteGround Node.js documentation

## Production Readiness

Your application is ready for deployment once:
- ✅ Build completes without errors
- ✅ Verification script passes
- ✅ Local production server works
- ✅ All environment variables documented
- ✅ Payment integrations tested

---

**Last Updated**: January 24, 2026
**Astro Version**: 5.15.9
**Node.js Required**: 18+
