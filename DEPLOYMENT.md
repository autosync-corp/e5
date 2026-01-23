# Deployment Guide for SiteGround

This guide covers deploying your Astro SSR application to SiteGround hosting.

## Prerequisites

- SiteGround account with Node.js hosting enabled
- Node.js version 18+ supported on your hosting plan
- SSH access to your SiteGround server
- Git installed on the server (optional but recommended)

## Step 1: Prepare Your Application

1. **Build the application locally** (already done):
   ```bash
   npm run build
   ```

2. **Test the production build locally**:
   ```bash
   npm start
   ```
   Visit `http://localhost:8080` to verify everything works.

## Step 2: Set Up Node.js on SiteGround

1. Log in to your SiteGround Site Tools
2. Go to **Devs** → **Node.js Manager**
3. Create a new Node.js application:
   - **Node.js Version**: Select 18.x or higher
   - **Application Mode**: Production
   - **Application Root**: Your public_html folder or subdirectory
   - **Application URL**: Your domain
   - **Application Startup File**: `server.js`

## Step 3: Upload Files to SiteGround

### Option A: Using Git (Recommended)

1. SSH into your SiteGround server
2. Navigate to your application directory
3. Clone or pull your repository:
   ```bash
   git clone your-repository-url .
   ```

### Option B: Using FTP/File Manager

Upload these files and folders to your application root:
- `dist/` (entire folder)
- `node_modules/` (or run npm install on server)
- `package.json`
- `package-lock.json`
- `server.js`
- `.env` (create from .env.example with your actual keys)

## Step 4: Configure Environment Variables

1. Create a `.env` file in your application root with your production values:
   ```bash
   cp .env.example .env
   nano .env
   ```

2. Update all environment variables with production values:
   - Replace Stripe test keys with live keys
   - Replace Affirm sandbox keys with production keys
   - Set `NODE_ENV=production`
   - Update webhook URLs to production URLs
   - **IMPORTANT**: Update `AUTOSYNC_API_KEY` with your actual API key

## Step 5: Install Dependencies on Server

Via SSH, in your application directory:

```bash
npm install --production
```

Or if you need all dependencies:
```bash
npm install
```

## Step 6: Start the Application

The Node.js Manager in SiteGround should automatically start your application using `server.js`.

If you need to manually start/restart:

```bash
# Via SiteGround Node.js Manager
# Click "Restart" button

# Or via SSH (if applicable)
npm start
```

## Step 7: Configure Domain

1. In SiteGround Site Tools, go to **Domain** → **Manage**
2. Point your domain to the Node.js application
3. Ensure SSL certificate is active

## Step 8: Test Your Deployment

1. Visit your domain
2. Test key functionality:
   - Browse gallery pages
   - View product pages
   - Test checkout flow (use Stripe test mode first)
   - Verify API endpoints work
   - Check that webhooks are received

## Important Files

- **server.js** - Production server entry point
- **dist/** - Built application files
- **.env** - Environment variables (DO NOT commit to git)
- **package.json** - Dependencies and scripts

## Environment Variables Reference

Required environment variables:

```env
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Affirm (Production)
AFFIRM_PRIVATE_KEY=your_production_key
PUBLIC_AFFIRM_PUBLIC_KEY=your_production_public_key
AFFIRM_API_URL=https://api.affirm.com/api/v1/transactions
AFFIRM_JS_URL=https://cdn1.affirm.com/js/v2/affirm.js

# AutoSync API
AUTOSYNC_API_KEY=your_actual_api_key

# Webhooks
GHL_WEBHOOK_URL=https://your-production-webhook-url

# Server
PORT=8080
NODE_ENV=production
```

## Troubleshooting

### Application won't start
- Check Node.js version (needs 18+)
- Verify `server.js` exists
- Check error logs in SiteGround Node.js Manager

### 404 errors on routes
- Ensure `.htaccess` is properly configured
- Verify all files in `dist/` folder uploaded correctly

### API endpoints returning errors
- Check `.env` file exists and has correct values
- Verify environment variables are loaded
- Check SiteGround error logs

### Static assets not loading
- Verify `dist/client/` folder uploaded completely
- Check file permissions (should be readable)

## Post-Deployment Checklist

- [ ] Application starts without errors
- [ ] All pages load correctly
- [ ] Gallery images display properly
- [ ] Product pages work
- [ ] Checkout flow completes
- [ ] Payment processing works (test mode first)
- [ ] Webhooks are received
- [ ] SSL certificate is active
- [ ] Domain points correctly
- [ ] Environment variables are set correctly

## Security Notes

1. **Never commit `.env` to version control**
2. **Update API keys** from test to production
3. **Enable HSTS** via SiteGround SSL settings
4. **Set secure headers** in your hosting configuration
5. **Regularly update dependencies**: `npm update`
6. **Monitor error logs** regularly

## Updating Your Application

To deploy updates:

1. Make changes locally
2. Test thoroughly
3. Build the application: `npm run build`
4. Upload new `dist/` folder to server (overwrite existing)
5. Restart the Node.js application via SiteGround Manager

Or if using Git:
```bash
git pull
npm install
npm run build
# Restart via SiteGround Node.js Manager
```

## Support

- SiteGround Node.js Hosting: https://www.siteground.com/tutorials/nodejs/
- Astro Deployment: https://docs.astro.build/en/guides/deploy/
- Contact SiteGround support for hosting-specific issues
