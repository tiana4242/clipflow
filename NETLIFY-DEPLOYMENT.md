# ClipFlow - Netlify Deployment Guide

## 🚀 Netlify Deployment Setup

### Step 1: Prepare Your Repository

Make sure your repository includes:
- ✅ `netlify.toml` - Build configuration
- ✅ `netlify/functions/` - Serverless functions
- ✅ Updated `src/config/api.ts` - Netlify API detection

### Step 2: Deploy to Netlify

#### Option A: Git Integration (Recommended)
1. **Go to https://app.netlify.com**
2. **Sign up** with GitHub
3. **"Add new site"** → **"Import an existing project"**
4. **Select your `clipflow` repository**
5. **Build settings** (auto-detected from netlify.toml):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

#### Option B: Manual Drag & Drop
1. **Run `npm run build` locally**
2. **Drag `dist` folder** to Netlify dashboard
3. **Site name**: `clipflow-app`

### Step 3: Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

```bash
# Frontend Variables
VITE_SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd3N6dXZsc2tyZnV3aXFta2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDI5MjQsImV4cCI6MjA4ODcxODkyNH0.nXBmzQt_7IMCcFux5otdjfsgTRCZkY83qdxsmx2aEXU

# Backend Variables (for functions)
SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Step 4: Deploy Functions

#### Option A: Git-based (Auto)
1. **Push changes** to GitHub
2. **Netlify auto-deploys** functions and frontend

#### Option B: Manual Functions Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy functions
netlify functions:deploy

# Deploy entire site
netlify deploy --prod
```

### Step 5: Test Your App

1. **Visit your Netlify URL**: `https://your-site-name.netlify.app`
2. **Test authentication** - Login/signup
3. **Test basic features** - Clip management
4. **Test API calls** - All frontend functionality

## ⚠️ Limitations with Netlify

### What Works:
- ✅ **Authentication** - User login/signup
- ✅ **Clip management** - CRUD operations
- ✅ **Database operations** - Supabase integration
- ✅ **Frontend features** - All UI functionality

### What Doesn't Work:
- ❌ **Video upload** - File size limits (10MB per function)
- ❌ **Video processing** - No FFmpeg support
- ❌ **AI analysis** - Function timeout limits (10 seconds)
- ❌ **Large file operations** - Memory constraints

## 🔄 Hybrid Solution (Recommended)

### Frontend: Netlify (Static)
- ✅ Free hosting
- ✅ Fast CDN
- ✅ Easy deployment

### Backend: Render/VPS (Video Processing)
- ✅ FFmpeg support
- ✅ Large file uploads
- ✅ Longer processing times
- ✅ Full video capabilities

### Setup:
1. **Deploy frontend to Netlify** (static site)
2. **Deploy backend to Render** (web service)
3. **Update API URL** to Render backend
4. **Full functionality** - All features work

## 🎯 Quick Start Commands

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Deploy site
netlify deploy --prod

# Deploy functions only
netlify functions:deploy
```

## 📋 Netlify Free Tier Limits

- ✅ **100GB bandwidth/month**
- ✅ **300 minutes build time**
- ✅ **Unlimited sites**
- ✅ **Custom domains**
- ❌ **Function timeout**: 10 seconds
- ❌ **Function size**: 50MB
- ❌ **File uploads**: 10MB per function

## 🚀 Production URLs

After deployment:
- **Frontend**: `https://your-site-name.netlify.app`
- **Functions**: `https://your-site-name.netlify.app/.netlify/functions`

## 🎊 Success!

Your ClipFlow frontend is now live on Netlify with:
- ✅ Free hosting
- ✅ Global CDN
- ✅ SSL certificates
- ✅ Auto-deploys
- ✅ Custom domain support

**Note**: For full video processing capabilities, consider the hybrid approach with a separate backend service! 🚀
