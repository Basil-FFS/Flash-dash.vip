# FLASH DASH Frontend Deployment Guide

## Prerequisites
- Domain: `flashdash.vip` (already configured)
- Web hosting service (cPanel, VPS, or cloud hosting)
- SSL certificate for HTTPS

## Step 1: Build Production Version

### Option A: Using the batch script (Windows)
```bash
# Double-click build-production.bat
# OR run in command prompt:
build-production.bat
```

### Option B: Manual build
```bash
npm install
npm run build:prod
```

## Step 2: Upload to Web Server

### For cPanel Hosting:
1. Log into your cPanel account
2. Navigate to File Manager
3. Go to `public_html` folder (or your domain's root directory)
4. Upload all contents from the `dist/` folder
5. Ensure `index.html` is in the root directory

### For VPS/Cloud Hosting:
1. Upload the `dist/` folder contents to your web server's document root
2. Configure your web server (Apache/Nginx) to serve the files

## Step 3: Configure Web Server

### Apache (.htaccess file in root directory):
```apache
RewriteEngine On
RewriteBase /

# Handle React Router - redirect all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Nginx configuration:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
```

## Step 4: SSL/HTTPS Configuration

1. Install SSL certificate (Let's Encrypt is free)
2. Redirect all HTTP traffic to HTTPS
3. Update your backend API URL to use HTTPS

## Step 5: Backend Configuration

Ensure your backend is accessible at:
- `https://api.flashdash.vip` (recommended)
- OR update the frontend API URL in `src/api.js`

## Step 6: Test Your Deployment

1. Visit `https://flashdash.vip`
2. Test all functionality (login, forms, etc.)
3. Check browser console for any errors
4. Verify API calls are working

## Troubleshooting

### Common Issues:
- **404 errors**: Ensure `.htaccess` (Apache) or Nginx config is correct
- **API errors**: Check backend URL and CORS configuration
- **Build errors**: Run `npm install` before building

### Support:
- Check browser console for error messages
- Verify file permissions on web server
- Ensure all files were uploaded correctly

## Maintenance

- Keep dependencies updated: `npm update`
- Rebuild and redeploy after code changes
- Monitor web server logs for errors
- Regular backups of your deployment
