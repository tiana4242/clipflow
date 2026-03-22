# ClipFlow - Hybrid Deployment Guide

## 🚀 Hybrid Architecture: Netlify + Render

### Overview
```
Frontend: Netlify (Static Hosting)
Backend: Render (Video Processing)
Database: Supabase (Managed)
```

## 📋 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to https://render.com**
2. **Sign up** with GitHub
3. **Create Web Service**:
   - **Repository**: `clipflow`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Environment Variables**:
   ```bash
   SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   GROQ_API_KEY=your_groq_api_key
   DEEPGRAM_API_KEY=your_deepgram_api_key
   FRONTEND_URL=https://your-netlify-site.netlify.app
   NODE_ENV=production
   PORT=3001
   ```

5. **Deploy** → Get backend URL: `https://clipflow-backend.onrender.com`

### Step 2: Deploy Frontend to Netlify

1. **Go to https://app.netlify.com**
2. **Sign up** with GitHub
3. **Add new site** → **Import existing project**
4. **Select `clipflow` repository**
5. **Build settings** (auto-detected):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

6. **Environment Variables**:
   ```bash
   VITE_SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd3N6dXZsc2tyZnV3aXFta2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDI5MjQsImV4cCI6MjA4ODcxODkyNH0.nXBmzQt_7IMCcFux5otdjfsgTRCZkY83qdxsmx2aEXU
   VITE_API_URL=https://clipflow-backend.onrender.com
   ```

### Step 3: Test Integration

1. **Wait for both deployments** to complete
2. **Visit Netlify URL**: `https://your-site.netlify.app`
3. **Test functionality**:
   - ✅ User authentication
   - ✅ Clip management
   - ✅ Video upload
   - ✅ AI analysis
   - ✅ Video processing
   - ✅ Export features

## 🎯 What Works in This Setup

### ✅ **Frontend (Netlify)**
- Fast static hosting
- Global CDN
- Free SSL
- Auto-deploys
- Custom domains

### ✅ **Backend (Render)**
- Full FFmpeg support
- Large file uploads
- Long processing times
- Video processing
- AI analysis

### ✅ **Integration**
- API calls redirect properly
- Environment detection
- Seamless user experience
- Full feature set

## 📊 Architecture Diagram

```
User → Netlify Frontend → Render Backend → Supabase Database
        ↓                    ↓                    ↓
   Static Files        API Calls           Data Storage
   (Fast CDN)         (FFmpeg)            (PostgreSQL)
```

## 🔄 API Flow

1. **Frontend Request** → Netlify detects `/api/*`
2. **Redirect** → Routes to Render backend
3. **Backend Processing** → FFmpeg + AI analysis
4. **Database** → Supabase operations
5. **Response** → Returns to frontend

## 🚀 Benefits of Hybrid Approach

### Cost-Effective
- **Frontend**: Free (Netlify)
- **Backend**: Free tier (Render)
- **Database**: Free tier (Supabase)
- **Total**: $0/month

### Performance
- **Static delivery**: Fast CDN
- **Video processing**: Dedicated resources
- **Global reach**: Edge caching
- **Scalable**: Independent scaling

### Reliability
- **Separate concerns**: Frontend/backend isolation
- **Independent updates**: Deploy separately
- **Error isolation**: One service doesn't affect other
- **Monitoring**: Independent metrics

## 🔧 Configuration Details

### Netlify Configuration
- **Build**: Vite → Static files
- **Redirects**: API calls to Render
- **Headers**: Security and caching
- **Environment**: Production variables

### Render Configuration
- **Runtime**: Node.js 18
- **Process**: PM2 (managed)
- **Resources**: Free tier (750 hours)
- **Storage**: Temporary file system

## 📋 Environment Variables Summary

### Frontend (Netlify)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://clipflow-backend.onrender.com
```

### Backend (Render)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
FRONTEND_URL=https://your-netlify-site.netlify.app
NODE_ENV=production
PORT=3001
```

## 🎊 Success!

Your ClipFlow application now has:
- ✅ **Free hosting** for both frontend and backend
- ✅ **Full functionality** - All features work
- ✅ **Global performance** - CDN + dedicated backend
- ✅ **Scalable architecture** - Independent services
- ✅ **Professional setup** - Production-ready

**Your video clipping app is ready for the world!** 🚀🎬✨

## 📞 Support

If you need help:
1. Check deployment logs
2. Verify environment variables
3. Test API connectivity
4. Review this guide

**Happy clipping!** 🎥
