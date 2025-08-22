# Vercel Deployment Guide for flashdash.vip

## Prerequisites
- GitHub repository with your code
- Vercel account (free at vercel.com)
- Domain: `flashdash.vip`

## Step 1: Prepare Your Repository

Ensure your repository has:
- ✅ `vercel.json` configuration file
- ✅ `package.json` with build scripts
- ✅ All source code committed and pushed to GitHub

## Step 2: Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in/sign up
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Select the repository** containing your flashdash.vip frontend

## Step 3: Configure Project Settings

### Build Settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables:
Add these in the Vercel dashboard:
```
VITE_API_BASE=https://api.flashdash.vip
VITE_APP_URL=https://flashdash.vip
VITE_APP_TITLE=FLASH DASH Premium CRM Platform
```

## Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for build to complete** (usually 2-3 minutes)
3. **Your app will be available** at a Vercel URL (e.g., `https://your-project.vercel.app`)

## Step 5: Configure Custom Domain

1. **Go to Project Settings** → **Domains**
2. **Add Domain**: `flashdash.vip`
3. **Configure DNS**:
   - Add CNAME record: `flashdash.vip` → `cname.vercel-dns.com`
   - Or A record: `flashdash.vip` → `76.76.19.36`

## Step 6: SSL Certificate

Vercel automatically provides SSL certificates for all domains.

## Step 7: Test Your Deployment

1. Visit `https://flashdash.vip`
2. Test all functionality:
   - Login/Registration
   - Dashboard
   - Lead Intake Form
   - Admin Panel
3. Verify API calls work to `https://api.flashdash.vip`

## Step 8: Automatic Deployments

Vercel will automatically deploy when you:
- Push to `main` branch
- Create pull requests
- Manually trigger deployments

## Troubleshooting

### Build Errors:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify build command works locally

### Domain Issues:
- DNS propagation can take up to 48 hours
- Verify CNAME/A records are correct
- Check domain status in Vercel dashboard

### API Connection Issues:
- Verify `VITE_API_BASE` environment variable
- Ensure backend is running at `https://api.flashdash.vip`
- Check CORS configuration on backend

## Vercel Features You Get:

✅ **Automatic HTTPS/SSL**
✅ **Global CDN**
✅ **Automatic deployments**
✅ **Preview deployments for PRs**
✅ **Analytics and performance monitoring**
✅ **Edge functions (if needed)**
✅ **Custom domains with SSL**

## Next Steps After Deployment:

1. **Set up monitoring** in Vercel dashboard
2. **Configure webhooks** if needed
3. **Set up team access** for collaboration
4. **Monitor performance** and optimize as needed
