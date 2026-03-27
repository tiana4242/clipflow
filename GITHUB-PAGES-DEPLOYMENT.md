# GitHub Pages Deployment Guide

## 🚀 Quick Setup

### 1. Enable GitHub Pages
1. Go to: https://github.com/tiana4242/clipflow/settings/pages
2. **Source**: Select "GitHub Actions"
3. Click "Save"

### 2. Add Environment Variables
1. Go to: https://github.com/tiana4242/clipflow/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

```
VITE_SUPABASE_URL = https://gfwszuvlskrfuwiqmkfg.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaXBmbG93LWJhY2tlbmQiLCJpYXQiOjE3MjQyMjI4MDAsImV4cCI6MTc0NDgwMDgwMH0.8QKlJ6ZqJ3XQXJjZ3J4hQzR5dW9hN1hLd0VxY0JqN1d1M2F4
VITE_API_URL = https://clip-flow-529p.onrender.com
```

### 3. Check Deployment
- **Actions tab**: Watch build progress
- **Pages tab**: See deployment status
- **Live URL**: https://tiana4242.github.io/clipflow/

## 📱 PWA Features

✅ **Service Worker**: Offline support
✅ **Install Prompt**: Add to home screen
✅ **Caching**: Fast loading
✅ **HTTPS**: Secure connection
✅ **Responsive**: Works on all devices

## 🔧 Troubleshooting

### Build Fails?
- Check environment variables are correct
- Ensure Node.js 18 is used
- Verify package-lock.json is committed

### PWA Not Working?
- Check manifest.json paths
- Verify service worker registration
- Ensure HTTPS is enabled

### Icons Missing?
- Icons are in `/public/icons/`
- Check paths in manifest.json
- Verify files are built to `/dist/icons/`

## 🎯 Your App URL

**Production**: https://tiana4242.github.io/clipflow/
**Repository**: https://github.com/tiana4242/clipflow

## 🔄 Auto-Deployment

- ✅ Push to `main` → Auto-deploy
- ✅ Pull requests → Preview builds
- ✅ Environment variables → Secure and private

Your ClipFlow PWA is now ready for production deployment! 🎬✨
