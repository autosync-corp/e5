# SiteGround Deployment Checklist

## Before Deployment

- [ ] Test build locally: `npm run build`
- [ ] Test production server: `npm start`
- [ ] Verify all pages work at `http://localhost:8080`
- [ ] Check all environment variables are documented
- [ ] Review `.env.example` - ensure all required vars are listed
- [ ] Backup current live site (if updating existing deployment)

## Files to Upload

Core files (REQUIRED):
- [ ] `dist/` folder (entire directory with all subdirectories)
- [ ] `server.js`
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `.env` (create from .env.example with production values)

Supporting files (optional but recommended):
- [ ] `DEPLOYMENT.md` (this deployment guide)
- [ ] `.htaccess` (if needed for routing)

## SiteGround Configuration

- [ ] Enable Node.js hosting in Site Tools
- [ ] Select Node.js version 18.x or higher
- [ ] Set Application Startup File: `server.js`
- [ ] Set Application Mode: Production
- [ ] Configure Application Root directory
- [ ] Set PORT environment variable (default: 8080)

## Environment Variables Setup

Update these in your `.env` file with PRODUCTION values:

### Stripe (Switch from test to live keys)
- [ ] `STRIPE_SECRET_KEY` → Use `sk_live_...` key
- [ ] `PUBLIC_STRIPE_PUBLISHABLE_KEY` → Use `pk_live_...` key

### Affirm (Switch from sandbox to production)
- [ ] `AFFIRM_PRIVATE_KEY` → Production private key
- [ ] `PUBLIC_AFFIRM_PUBLIC_KEY` → Production public key
- [ ] `AFFIRM_API_URL` → `https://api.affirm.com/api/v1/transactions`
- [ ] `AFFIRM_JS_URL` → `https://cdn1.affirm.com/js/v2/affirm.js`

### AutoSync API
- [ ] `AUTOSYNC_API_KEY` → Your actual API key (not "efive")

### Webhooks
- [ ] `GHL_WEBHOOK_URL` → Production webhook URL

### Server
- [ ] `NODE_ENV` → Set to `production`
- [ ] `PORT` → `8080` (or as required by SiteGround)

## Post-Upload Steps

- [ ] SSH into server and navigate to app directory
- [ ] Run `npm install --production` to install dependencies
- [ ] Verify `.env` file exists and has correct values
- [ ] Start application via SiteGround Node.js Manager
- [ ] Check application logs for any startup errors

## Domain & SSL

- [ ] Point domain to Node.js application
- [ ] Verify SSL certificate is active and valid
- [ ] Test HTTPS access: `https://yourdomain.com`
- [ ] Verify HTTP redirects to HTTPS

## Testing After Deployment

### Basic Functionality
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Navigation works across all pages
- [ ] Static assets (images, CSS, JS) load correctly

### Gallery Pages
- [ ] Gallery index: `/gallery/vehicles`
- [ ] Single gallery page: `/gallery/2023-c8-red-corvette`
- [ ] Wheel gallery: `/gallery/wheels`
- [ ] Verify images display correctly

### Product Pages
- [ ] Shop page: `/shop`
- [ ] Single product page: `/shop/single-product?id=123`
- [ ] Product images load
- [ ] Add to cart works

### Checkout & Payment (TEST MODE FIRST)
- [ ] Cart page: `/checkout/cart`
- [ ] Checkout page: `/checkout`
- [ ] Stripe payment integration works
- [ ] Affirm financing option appears
- [ ] Test order completion (use Stripe test card: 4242 4242 4242 4242)

### API Endpoints
- [ ] `/api/create-payment-intent` responds
- [ ] `/api/affirm-checkout` responds
- [ ] `/api/affirm-capture` responds
- [ ] `/api/send-order-webhook` sends to correct URL

### Payment Testing - LIVE MODE
⚠️ Only after test mode works:
- [ ] Switch to live Stripe keys
- [ ] Switch to live Affirm keys
- [ ] Test with real payment (small amount)
- [ ] Verify order webhook received
- [ ] Check Stripe dashboard for payment
- [ ] Verify email notifications sent

## Performance Checks

- [ ] Page load times acceptable (< 3 seconds)
- [ ] Images optimized and loading quickly
- [ ] No console errors in browser
- [ ] Mobile responsive design works

## Security Verification

- [ ] `.env` file NOT accessible via browser
- [ ] API keys not exposed in client-side code
- [ ] HTTPS enforced (no mixed content warnings)
- [ ] Security headers configured
- [ ] Error messages don't expose sensitive info

## Monitoring Setup

- [ ] Set up uptime monitoring
- [ ] Configure error logging
- [ ] Set up Stripe webhook monitoring
- [ ] Monitor server resources (CPU, Memory)

## Rollback Plan

If deployment fails:
- [ ] Document rollback procedure
- [ ] Keep previous version backup accessible
- [ ] Know how to quickly restore previous version

## Common Issues & Solutions

### Issue: Application won't start
- Check Node.js version (must be 18+)
- Verify `server.js` exists in root
- Check SiteGround error logs
- Ensure all dependencies installed

### Issue: 404 on routes
- Verify `.htaccess` configuration
- Check all files in `dist/` uploaded
- Ensure server.js is set as startup file

### Issue: Payment processing fails
- Verify API keys are production keys
- Check `.env` file loaded correctly
- Review Stripe/Affirm dashboard for errors
- Check webhook URLs are correct

### Issue: Images not loading
- Verify `dist/client/` folder uploaded completely
- Check file permissions
- Verify correct image paths in code

## Support Resources

- **SiteGround Support**: https://www.siteground.com/kb/
- **Astro Docs**: https://docs.astro.build/
- **Stripe Docs**: https://stripe.com/docs
- **Affirm Docs**: https://docs.affirm.com/

## Post-Launch

- [ ] Announce launch to stakeholders
- [ ] Monitor for first 24-48 hours
- [ ] Check analytics setup working
- [ ] Verify all integrations functioning
- [ ] Document any issues and resolutions
- [ ] Schedule regular backups
- [ ] Plan maintenance schedule

## Notes

Write any deployment-specific notes here:
- Deployment date:
- Deployed by:
- Server IP:
- Any custom configurations:
