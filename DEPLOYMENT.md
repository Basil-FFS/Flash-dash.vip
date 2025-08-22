# Deployment Guide for flashdash.vip

## Prerequisites
- Domain: `flashdash.vip` (already configured)
- Web hosting service (e.g., Netlify, Vercel, or traditional web hosting)
- SSL certificate for HTTPS

## Step 1: Build the Production Version

```bash
cd flash-internal-frontend
npm install
npm run build:prod
```

This will create a `dist/` folder with your production-ready files.

## Step 2: Deploy to Your Web Host

### Option A: Netlify (Recommended for React apps)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Set environment variables:
   - `VITE_API_BASE=https://api.flashdash.vip`
   - `VITE_APP_URL=https://flashdash.vip`

### Option B: Vercel
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build:prod`
3. Set output directory: `dist`
4. Set environment variables as above

### Option C: Traditional Web Hosting
1. Upload the contents of the `dist/` folder to your web server's public directory
2. Ensure your server is configured to serve `index.html` for all routes (SPA routing)

## Step 3: Configure Domain

1. Point your domain `flashdash.vip` to your hosting provider
2. Set up SSL certificate (Let's Encrypt is free)
3. Configure redirects:
   - HTTP → HTTPS
   - All routes → `index.html` (for React Router)

## Step 4: Backend Configuration

Your backend should be hosted at `api.flashdash.vip` with:
- CORS configured to allow `https://flashdash.vip`
- SSL certificate
- Proper environment variables

## Step 5: Test

1. Visit `https://flashdash.vip`
2. Test all functionality
3. Verify API calls work to `https://api.flashdash.vip`

## Environment Variables for Production

```bash
VITE_APP_TITLE=FLASH DASH Premium CRM Platform
VITE_API_BASE=https://api.flashdash.vip
VITE_APP_URL=https://flashdash.vip
```

## Troubleshooting

- **404 errors on refresh**: Configure your server to serve `index.html` for all routes
- **CORS errors**: Ensure backend allows `https://flashdash.vip`
- **Mixed content errors**: Ensure all resources use HTTPS
