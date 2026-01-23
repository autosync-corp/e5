# Deployment Guide - E5 Wheels

## Overview

This application is built with Astro + Node.js and can be deployed to **any hosting platform that supports Node.js 18+**.

## Pre-Deployment Checklist

Before deploying, the developer should:

```bash
# 1. Build the application
npm run build

# 2. Verify build is ready
npm run verify-deployment

# 3. Test production build locally
npm start
# Visit http://localhost:8080 to verify everything works
```

## What Gets Deployed

After running `npm run build`, these files must be deployed:

```
dist/                    # Built application (entire folder)
server.js               # Production server
package.json            # Dependencies list
package-lock.json       # Locked dependency versions
```

**DO NOT deploy:**
- `src/` folder
- `node_modules/` (install on server instead)
- `.env` file (create on server with production values)
- Development files

## Environment Variables (Production)

Create a `.env` file on the production server with these values:

```env
# Stripe - PRODUCTION KEYS
STRIPE_SECRET_KEY=sk_live_XXXXXXXX
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX

# Affirm - PRODUCTION KEYS
AFFIRM_PRIVATE_KEY=XXXXXXXX
PUBLIC_AFFIRM_PUBLIC_KEY=XXXXXXXX
AFFIRM_API_URL=https://api.affirm.com/api/v1/transactions
AFFIRM_JS_URL=https://cdn1.affirm.com/js/v2/affirm.js

# AutoSync API
AUTOSYNC_API_KEY=XXXXXXXX

# Webhooks
GHL_WEBHOOK_URL=https://hooks.gohighlevel.com/XXXXXXXX

# Server
PORT=8080
NODE_ENV=production
```

**⚠️ IMPORTANT:** Never use test/sandbox keys in production!

## Deployment by Platform

### Option 1: Vercel (Recommended - Easiest)

**Zero configuration needed.** Just connect your Git repository.

1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables in Vercel dashboard
6. Click "Deploy"

**Done!** Vercel automatically:
- Detects Astro
- Runs `npm run build`
- Deploys everything
- Provides SSL certificate
- Provides domain

### Option 2: Netlify

**Zero configuration needed.**

1. Push code to Git
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import from Git"
4. Select repository
5. Build settings (auto-filled):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables
7. Click "Deploy"

### Option 3: Railway

**Zero configuration needed.**

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select repository
5. Add environment variables
6. Railway auto-deploys

### Option 4: SiteGround (or cPanel hosting)

**Manual process via FTP/SSH.**

#### Step 1: Upload Files
Upload via FTP or File Manager:
- `dist/` folder
- `server.js`
- `package.json`
- `package-lock.json`

#### Step 2: SSH into Server
```bash
ssh username@yourdomain.com -p 18765
cd public_html/your-app
```

#### Step 3: Install Dependencies
```bash
npm install --production
```

#### Step 4: Create .env File
```bash
nano .env
# Paste production environment variables
# Save: Ctrl+X, Y, Enter
```

#### Step 5: Configure Node.js
In hosting control panel:
- Enable Node.js (version 18+)
- Set startup file: `server.js`
- Set mode: Production
- Start application

### Option 5: Digital Ocean / VPS

**For any Linux server.**

#### Step 1: SSH into Server
```bash
ssh root@your-server-ip
```

#### Step 2: Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 3: Clone or Upload Code
```bash
cd /var/www
git clone https://github.com/yourusername/e5-wheels.git
cd e5-wheels
```

#### Step 4: Install & Build
```bash
npm install
npm run build
```

#### Step 5: Create .env File
```bash
nano .env
# Add production environment variables
```

#### Step 6: Start with PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "e5-wheels"

# Save PM2 process list
pm2 save

# Setup PM2 to start on reboot
pm2 startup
```

#### Step 7: Configure Nginx (Optional)
```bash
sudo nano /etc/nginx/sites-available/e5wheels
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/e5wheels /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 6: Docker (Any Platform)

**Universal containerized deployment.**

Create `Dockerfile` (already included):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
```

Build and run:
```bash
# Build
docker build -t e5-wheels .

# Run
docker run -p 8080:8080 --env-file .env e5-wheels
```

## Post-Deployment Verification

After deployment, verify:

1. **Homepage loads**: Visit `https://yourdomain.com`
2. **Gallery works**: Visit `/gallery/vehicles`
3. **Shop works**: Visit `/shop`
4. **No console errors**: Open browser DevTools
5. **SSL active**: URL shows `https://` with lock icon
6. **Test checkout**: Complete a test order (Stripe test mode first!)

## Updating the Application

### Developer (You):
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

### Deployment Person:

**For Git-connected platforms (Vercel/Netlify/Railway):**
- Automatic deployment on push (no action needed)

**For manual platforms (SiteGround/VPS):**
```bash
# SSH into server
cd /path/to/app
git pull
npm run build
# Restart application via control panel or PM2
```

## Troubleshooting

### App won't start
- Check Node.js version: `node --version` (must be 18+)
- Check logs for errors
- Verify `.env` file exists and has correct values

### 404 errors
- Ensure entire `dist/` folder uploaded
- Check `server.js` is present
- Verify startup file is set correctly

### Payment processing fails
- Check environment variables loaded
- Verify using PRODUCTION API keys (not test keys)
- Check Stripe/Affirm dashboard for errors

### Images not loading
- Verify `dist/client/` folder uploaded completely
- Check file permissions (755 for folders, 644 for files)

## Security Reminders

- ✅ Use production API keys (never test keys)
- ✅ Enable HTTPS/SSL
- ✅ Keep `.env` file secure (never commit to Git)
- ✅ Set `NODE_ENV=production`
- ✅ Regularly update dependencies: `npm update`

## Support

- **Developer documentation**: [README.md](./README.md)
- **Astro docs**: https://docs.astro.build/
- **Hosting support**: Contact your hosting provider

---

**Last Updated**: January 2026
**Node.js Required**: 18+
**Build Command**: `npm run build`
**Start Command**: `npm start`
