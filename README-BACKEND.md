# ClipFlow Backend - Single Unified API

## 🚀 Quick Start (No Installation Required)

Users don't need to install anything! The backend is already set up with all functionality.

### 📋 What's Included

**Single Backend with Full Functionality:**
- ✅ **Authentication** - Sign up, sign in, session management
- ✅ **Video Processing** - Upload, trim, process, export
- ✅ **AI Features** - Title generation, viral scoring, hashtags
- ✅ **Database** - Clip storage, user management, collections
- ✅ **File Storage** - Video uploads, thumbnails, processed files
- ✅ **Import/Export** - YouTube import, social media export
- ✅ **Advanced Features** - Color grading, captions, reframing

### 🛠️ Running the Backend

**Option 1: Local Development**
```bash
# Navigate to backend directory
cd backend

# Install dependencies (one time)
npm install

# Start the server
npm run dev

# Server runs on http://localhost:3001
# Frontend will automatically connect to this backend
```

**Option 2: Production Deployment**
```bash
# Deploy to any Node.js hosting service
# Recommended platforms:
# - Railway (https://railway.app)
# - Render (https://render.com) 
# - Vercel (https://vercel.com)
# - DigitalOcean (https://digitalocean.com)
# - AWS EC2 (https://aws.amazon.com/ec2)

# Environment variables needed:
# NODE_ENV=production
# FRONTEND_URL=https://your-frontend-domain.com
```

### 🔧 Environment Configuration

**Development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Auto-connects when both are running

**Production:**
- Frontend: `https://your-domain.com`
- Backend: `https://api.clipflow.app` (or your backend URL)
- Update `PROD_URL` in `src/config/api.ts`

### 📊 API Endpoints

**Authentication:**
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user

**Clips:**
- `GET /api/clips` - Get user clips
- `DELETE /api/clips/:id` - Delete specific clip
- `DELETE /api/clips` - Delete all clips

**Video Processing:**
- `POST /api/upload` - Upload video
- `POST /api/process-clip` - Process video with AI
- `POST /api/analyze` - Analyze video content
- `GET /api/clips/:id/preview` - Get clip preview

**AI Features:**
- `POST /api/generate-titles` - Generate video titles
- `POST /api/generate-hashtags` - Generate hashtags
- `POST /api/clips/:id/color-grade` - Apply color grading
- `POST /api/clips/:id/reframe` - Auto-reframe video

**Import/Export:**
- `POST /api/import-url` - Import from YouTube/URL
- `POST /api/export` - Export processed clips

### 🔐 Security Features

**Built-in Security:**
- ✅ **HTTPS Enforcement** - Auto-redirect to HTTPS
- ✅ **CORS Protection** - Configured for frontend
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Input Validation** - File type and size limits
- ✅ **Security Headers** - XSS, CSRF protection
- ✅ **Content Compression** - Gzip compression enabled

### 📱 Frontend Integration

The frontend is already configured to use this unified backend:

**API Client:** `src/lib/api.ts`
- Unified API calls for all features
- Token management
- Error handling
- Type safety

**Configuration:** `src/config/api.ts`
- Auto-detects development vs production
- No user configuration needed
- Seamless backend switching

### 🚀 Deployment Options

**Option 1: Railway (Easiest)**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Deploy backend
railway deploy

# 4. Set environment variables in Railway dashboard
# FRONTEND_URL=https://your-frontend-domain.com
```

**Option 2: Render**
```bash
# 1. Create render.yaml
# 2. Connect GitHub repo
# 3. Deploy - Render auto-detects Node.js
```

**Option 3: Vercel**
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy backend
vercel --prod

# 3. Configure environment variables
```

### 📄 Features Ready Out of the Box

**Video Processing:**
- FFmpeg integration for trimming/processing
- Multiple format support (MP4, WebM, MOV)
- Quality adjustment and compression
- Thumbnail generation
- Progress tracking

**AI Integration:**
- Groq for fast title generation
- Deepgram for caption generation
- Viral score prediction
- Hashtag suggestions
- Content analysis

**User Management:**
- JWT-based authentication
- Secure session handling
- User profiles and preferences
- Clip organization and collections
- History tracking with undo/redo

**Advanced Features:**
- Color grading with real-time preview
- Auto-refaming for different platforms
- Caption burning with styling
- Social media integration
- Import from YouTube/TikTok/Instagram

### 🎯 Next Steps

1. **Start Local Development:**
   ```bash
   cd backend && npm run dev
   ```

2. **Update Frontend Config:**
   - Change `PROD_URL` in `src/config/api.ts` when deployed

3. **Deploy to Production:**
   - Choose hosting platform (Railway recommended)
   - Set environment variables
   - Deploy and test

### 💡 Benefits of This Setup

**For Users:**
- ✅ **Zero Installation** - Just open the web app
- ✅ **Full Functionality** - All features work immediately
- ✅ **Single Source** - No backend confusion
- ✅ **Auto-Configuration** - No setup required

**For Developers:**
- ✅ **Unified Codebase** - Single backend to maintain
- ✅ **Full Control** - Complete ownership of features
- ✅ **Easy Deployment** - Standard Node.js deployment
- ✅ **Scalable** - Can scale components independently

**🚀 Your ClipFlow backend is ready to use!**
