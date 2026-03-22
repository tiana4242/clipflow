# ClipFlow - Render Deployment

## 🚀 Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

## 🚀 Step 2: Deploy Backend

### Create Web Service:
1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select your `clipflow` repo
3. **Name**: `clipflow-backend`
4. **Root Directory**: `backend`
5. **Runtime**: `Node`
6. **Build Command**: `npm install`
7. **Start Command**: `npm start`
8. **Instance Type**: `Free` (750 hours/month)

### Environment Variables:
```bash
SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
FRONTEND_URL=https://your-frontend-url.onrender.com
NODE_ENV=production
PORT=3001
```

## 🚀 Step 3: Deploy Frontend

### Create Static Site:
1. Click **"New +"** → **"Static Site"**
2. **Connect Repository**: Same `clipflow` repo
3. **Name**: `clipflow-frontend`
4. **Root Directory**: `.` (root)
5. **Build Command**: `npm run build`
6. **Publish Directory**: `dist`
7. **Node Version**: `18`

### Environment Variables:
```bash
VITE_SUPABASE_URL=https://gfwszuvlskrfuwiqmkfg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd3N6dXZsc2tyZnV3aXFta2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDI5MjQsImV4cCI6MjA4ODcxODkyNH0.nXBmzQt_7IMCcFux5otdjfsgTRCZkY83qdxsmx2aEXU
VITE_API_URL=https://clipflow-backend.onrender.com
```

## 🚀 Step 4: Update Frontend API URL

After backend deploys, update frontend environment:
1. Get backend URL: `https://clipflow-backend.onrender.com`
2. Update `VITE_API_URL` in frontend service
3. Redeploy frontend

## 🚀 Step 5: Test Your App

1. **Backend URL**: `https://clipflow-backend.onrender.com`
2. **Frontend URL**: `https://clipflow-frontend.onrender.com`
3. **Test features**: Upload videos, create clips, export

## 📋 Files Created

✅ `backend/Procfile` - Render process configuration  
✅ `render.yaml` - Frontend build configuration  
✅ This guide - Step-by-step instructions

## 🎯 What You Get

✅ **Free hosting** - 750 hours/month (24/7)  
✅ **FFmpeg support** - Full video processing  
✅ **Custom domains** - Free SSL certificates  
✅ **Auto-deploys** - GitHub integration  
✅ **Environment variables** - Secure configuration  
✅ **Unlimited bandwidth** - No traffic limits  

## 🔧 Troubleshooting

### If Backend Fails:
- Check environment variables
- Verify `Procfile` exists
- Check build logs

### If Frontend Fails:
- Check `dist` directory
- Verify build command
- Check API URL

### Common Issues:
- **Build timeout**: Increase instance type temporarily
- **Memory issues**: Add `NODE_OPTIONS="--max-old-space-size=4096"`
- **CORS errors**: Update backend CORS settings

## 🚀 Go Live!

Once both services deploy:
1. **Visit your frontend URL**
2. **Test all features**
3. **Share your app** - It's live and free!

Your ClipFlow app will be fully functional with video processing, AI analysis, and all features working exactly like local development! 🎬✨
