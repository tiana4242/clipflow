# ClipFlow - AI-Powered Video Clipping Application

A modern web application that automatically generates viral video clips from long-form content using AI analysis.

## 🎬 Features

- **AI Video Analysis**: Automatic detection of viral moments using Groq AI
- **Smart Clip Generation**: Create engaging short clips with optimal timing
- **Caption Generation**: Automatic subtitle creation with Deepgram
- **Viral Score Analysis**: Machine learning predictions for content performance
- **Trending Hashtags**: AI-suggested hashtags for maximum reach
- **Video Processing**: FFmpeg-powered trimming and enhancement
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase** for authentication

### Backend
- **Node.js** with Express
- **Supabase** for database
- **FFmpeg** for video processing
- **Groq SDK** for AI analysis
- **Deepgram** for speech-to-text

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key
- Deepgram API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ttgarcia0018/clipflow.git
cd clipflow
```

2. **Install dependencies**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

3. **Set up environment variables**
```bash
# Copy .env.example to .env
cp .env.example .env

# Add your API keys
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

4. **Start the application**
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
npm run dev
```

5. **Visit the app**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🌐 Deployment

### Render (Recommended - Free)
[See RENDER-DEPLOYMENT.md](./RENDER-DEPLOYMENT.md) for complete setup instructions.

### Other Options
- **Self-hosting**: VPS with Docker
- **PaaS**: Heroku, Northflank, Fly.io
- **Static hosting**: Netlify + serverless functions

## 📁 Project Structure

```
clipflow/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── config/            # Configuration files
├── backend/                # Node.js API server
│   ├── uploads/           # Video upload directory
│   ├── processed/         # Processed video files
│   └── server.js          # Express server
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

#### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
GROQ_API_KEY=your_groq_key
DEEPGRAM_API_KEY=your_deepgram_key
```

### Database Setup

Run the SQL schema updates in your Supabase SQL Editor:
```sql
-- Add new columns for editing features
ALTER TABLE clips ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS custom_hashtags TEXT[];
ALTER TABLE clips ADD COLUMN IF NOT EXISTS edited_captions JSONB DEFAULT NULL;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS is_manual_clip BOOLEAN DEFAULT FALSE;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS folder_name TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clips_folder ON clips(folder_name);
CREATE INDEX IF NOT EXISTS idx_clips_collection ON clips(collection_name);
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Clips
- `GET /api/clips` - Get user clips
- `POST /api/clips` - Create new clip
- `DELETE /api/clips/:id` - Delete clip
- `PATCH /api/clips/:id/folder` - Update folder
- `PATCH /api/clips/:id/hashtags` - Update hashtags
- `PATCH /api/clips/:id/title` - Update title
- `PATCH /api/clips/:id/captions` - Update captions
- `PATCH /api/clips/:id/trim` - Trim/update timing

### Video Processing
- `POST /api/analyze` - Analyze video for viral moments
- `POST /api/clips/:id/burn-captions` - Add captions to video
- `POST /api/clips/:id/reframe` - Auto-reframe for mobile
- `POST /api/clips/:id/color-grade` - Apply color grading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - AI model inference
- **Deepgram** - Speech-to-text API
- **Supabase** - Backend-as-a-service
- **FFmpeg** - Video processing
- **Vite** - Build tool
- **React** - Frontend framework

## 📞 Support

If you have any questions or need help, feel free to:
- Open an issue on GitHub
- Contact me at ttgarcia0018@gmail.com

---

**Built with ❤️ for content creators and video editors**
