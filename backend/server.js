import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import ytdl from 'youtube-dl-exec';

// API Keys (hardcoded for user convenience)
const SUPABASE_URL = 'https://gfwszuvlskrfuwiqmkfg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmd3N6dXZsc2tyZnV3aXFta2ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE0MjkyNCwiZXhwIjoyMDg4NzE4OTI0fQ.K-kfRzd4HfbMJDWMtg4UC10yLrRmWgOut7RhoBcEoZA';
const GROQ_API_KEY = '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'; // Replace with your real Groq key  
const DEEPGRAM_API_KEY = '6c399867f4153d746880aaeab61552843d781d20'; // Replace with your real Deepgram key

dotenv.config();

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log('✅ FFmpeg ready at:', ffmpegPath);
}

const app = express();
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  // Remove CSP to allow bfcache and development flexibility
  // res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https:; font-src 'self' data: blob:; connect-src 'self' https:gfwszuvlskrfuwiqmkfg.supabase.co ws://localhost:5173 wss://localhost:5173; media-src 'self' blob:; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'self' blob:;");
  res.header('X-Content-Type-Options', 'nosniff');
  // res.header('X-Frame-Options', 'SAMEORIGIN'); // Comment out for bfcache
  res.header('X-XSS-Protection', '0');
  next();
});

app.use(express.json());

const groq = new Groq({ apiKey: GROQ_API_KEY });
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  }
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Invalid token');
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// DEEPGRAM REST API
async function transcribeWithDeepgram(audioPath) {
  try {
    console.log('🎙️  Deepgram: Starting transcription...');
    
    if (!fs.existsSync(audioPath)) {
      console.log('❌ Deepgram: Audio file does not exist');
      return [];
    }
    
    const audioBuffer = fs.readFileSync(audioPath);
    console.log('🎙️  Deepgram: Sending audio to API...');
    
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&utterances=true&language=en', 
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: audioBuffer
      }
    );
    
    console.log('🎙️  Deepgram: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Deepgram: API failed:', response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    const utterances = data.results?.utterances || [];
    
    console.log('🎙️  Deepgram: Found', utterances.length, 'utterances');
    
    return utterances.map(u => ({
      start: u.start,
      end: u.end,
      text: u.transcript
    }));
    
  } catch (error) {
    console.error('❌ Deepgram error:', error.message);
    return [];
  }
}

// GROQ AI ANALYSIS
async function analyzeWithGroq(utterances, totalDuration) {
  if (!utterances || utterances.length === 0) {
    console.log('🤖 No utterances to analyze');
    return [];
  }

  console.log('🤖 Analyzing', utterances.length, 'utterances, video length:', totalDuration, 'seconds');

  let aiClips = [];
  try {
    const transcriptText = utterances.map((u) => 
      `[${u.start.toFixed(1)}s] ${u.text.substring(0, 100)}` 
    ).join('\n');

    const prompt = `Find 3-5 engaging 15-30 second clips from this transcript. Look for interesting moments, key points, or emotional highlights.

Return JSON: {"clips": [{"startTime": number, "endTime": number, "title": string, "viralityScore": number, "captions": [{"text": string, "startTime": number, "endTime": number}]}]}

Transcript:
${transcriptText}

Video length: ${totalDuration}s`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a video editor. Find 3-5 interesting 15-30 second clips." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const content = chatCompletion.choices[0]?.message?.content || '{"clips":[]}';
    const parsed = JSON.parse(content);
    
    if (parsed.clips && parsed.clips.length > 0) {
      aiClips = parsed.clips.filter(clip => {
        const dur = clip.endTime - clip.startTime;
        return dur >= 15 && dur <= 30;
      });
      console.log('✅ AI found', aiClips.length, 'valid clips');
    }
  } catch (error) {
    console.error('❌ AI error:', error.message);
  }
  
  // FALLBACK: Create clips manually if AI failed
  const clips = [...aiClips];
  
  if (clips.length < 3) {
    console.log(`🔧 Only have ${clips.length} clips, creating more...`);
    
    const numTargetClips = 5;
    const segmentSize = totalDuration / numTargetClips;
    
    for (let i = 0; i < numTargetClips; i++) {
      const segmentStart = i * segmentSize;
      const segmentEnd = (i + 1) * segmentSize;
      
      const hasClipInSegment = clips.some(c => 
        c.startTime >= segmentStart && c.startTime < segmentEnd
      );
      
      if (hasClipInSegment) continue;
      
      const segmentUtterances = utterances.filter(u => 
        u.start >= segmentStart && u.end <= segmentEnd
      );
      
      if (segmentUtterances.length === 0) {
        const clipDuration = Math.min(20, segmentEnd - segmentStart);
        clips.push({
          startTime: segmentStart,
          endTime: segmentStart + clipDuration,
          title: `Clip ${i + 1} - ${Math.floor(segmentStart)}s`,
          viralityScore: 50,
          captions: []
        });
      } else {
        const startTime = segmentUtterances[0].start;
        const endTime = Math.min(
          startTime + 25,
          segmentUtterances[segmentUtterances.length - 1].end,
          segmentEnd
        );
        
        const finalEndTime = (endTime - startTime) < 15 
          ? Math.min(startTime + 20, totalDuration) 
          : endTime;
        
        const clipText = segmentUtterances.map(u => u.text).join(' ').substring(0, 60);
        
        clips.push({
          startTime: startTime,
          endTime: finalEndTime,
          title: clipText || `Clip ${i + 1}`,
          viralityScore: 50,
          captions: segmentUtterances.map(u => ({
            text: u.text,
            startTime: u.start,
            endTime: u.end
          }))
        });
      }
      
      if (clips.length >= 5) break;
    }
  }
  
  const finalClips = clips.filter(clip => {
    const dur = clip.endTime - clip.startTime;
    return dur >= 15 && dur <= 30;
  }).slice(0, 5);
  
  console.log('✅ Total clips to generate:', finalClips.length);
  
  return finalClips;
}

// Refactored video analysis function (reusable for upload and URL import)
async function analyzeVideo(videoPath, userId, sourceUrl = null) {
  console.log('\n========== VIDEO ANALYSIS ==========');
  console.log('📁 File:', videoPath);
  console.log('👤 User:', userId);
  
  let audioPath = null;
  
  try {
    // Get duration
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
    console.log('⏱️  Duration:', duration, 'seconds');
    
    // Extract audio
    audioPath = videoPath.replace(/\.[^.]+$/, '.wav');
    console.log('🔊 Extracting audio...');
    
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .on('end', resolve)
        .on('error', reject)
        .save(audioPath);
    });
    
    // Transcribe
    const utterances = await transcribeWithDeepgram(audioPath);
    console.log('✅ Transcription complete:', utterances.length, 'utterances');
    
    if (!utterances || utterances.length === 0) {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return [];
    }
    
    // Analyze
    console.log('⏳ Starting AI analysis...');
    const clips = await analyzeWithGroq(utterances, duration);
    console.log('✅ AI analysis complete:', clips.length, 'clips');
    
    if (!clips || clips.length === 0) {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return [];
    }
    
    // Generate clips data
    const clipsWithData = [];
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      console.log(`\n   [${i + 1}/${clips.length}] Processing: "${clip.title?.substring(0, 40)}..."`);
      
      try {
        const clipId = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`;
        const previewFileName = `preview-${clipId}.mp4`;
        const previewPath = path.join(uploadsDir, previewFileName);
        
        // Generate preview video
        console.log('      → Extracting video segment...');
        await new Promise((resolve, reject) => {
          ffmpeg(videoPath)
            .setStartTime(clip.startTime)
            .setDuration(clip.endTime - clip.startTime)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
              '-preset fast',
              '-movflags +faststart',
              '-pix_fmt yuv420p'
            ])
            .on('end', resolve)
            .on('error', reject)
            .save(previewPath);
        });
        
        if (!fs.existsSync(previewPath)) {
          console.log('      ❌ Preview file not created!');
          continue;
        }
        
        // Generate thumbnail
        console.log('      → Creating thumbnail...');
        const thumbFileName = `thumb-${clipId}.jpg`;
        const thumbPath = path.join(uploadsDir, thumbFileName);
        
        await new Promise((resolve, reject) => {
          ffmpeg(videoPath)
            .screenshots({
              timestamps: [clip.startTime + 2],
              filename: thumbFileName,
              folder: uploadsDir,
              size: '640x360'
            })
            .on('end', resolve)
            .on('error', reject);
        });
        
        // Upload thumbnail to Supabase
        const fileBuffer = fs.readFileSync(thumbPath);
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(`${userId}/${clipId}.jpg`, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (thumbError) throw thumbError;
        
        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(`${userId}/${clipId}.jpg`);
        
        fs.unlinkSync(thumbPath);
        
        // Save to database with metadata columns
        const clipData = {
          user_id: userId,
          title: clip.title || `Clip ${i + 1}`,
          start_time: clip.startTime,
          end_time: clip.endTime,
          virality_score: clip.viralityScore || 50,
          thumbnail_url: thumbnailUrl,
          original_video: path.basename(videoPath),
          video_url: null,
          captions: clip.captions || [],
          source_video_id: sourceUrl,
          collection_name: sourceUrl ? new URL(sourceUrl).hostname : null,
          has_burned_captions: false,
          is_reframed: false,
          color_grade: null
        };
        
        const { data, error } = await supabase
          .from('clips')
          .insert([clipData])
          .select()
          .single();
        
        if (error) {
          console.log('      ❌ Database error:', error.message);
          continue;
        }
        
        // Rename preview to use database ID
        const finalPreviewFileName = `preview-${data.id}.mp4`;
        const finalPreviewPath = path.join(uploadsDir, finalPreviewFileName);
        
        if (fs.existsSync(previewPath)) {
          fs.renameSync(previewPath, finalPreviewPath);
        }
        
        // Upload to Supabase Storage
        try {
          const storagePath = `clips/processed/${data.id}.mp4`;
          const { error: uploadError } = await supabase.storage
            .from('clips')
            .upload(storagePath, fs.createReadStream(finalPreviewPath), {
              contentType: 'video/mp4',
              upsert: true
            });
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('clips')
              .getPublicUrl(storagePath);
            
            await supabase
              .from('clips')
              .update({ video_url: publicUrl })
              .eq('id', data.id);
            
            data.video_url = publicUrl;
          }
        } catch (storageError) {
          console.log('      ⚠️  Storage upload failed:', storageError.message);
        }
        
        console.log('      ✅ Clip saved with ID:', data.id);
        clipsWithData.push(data);
        
      } catch (err) {
        console.log(`      ❌ Clip ${i + 1} failed:`, err.message);
      }
    }
    
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    console.log('✅ SUCCESS - Created', clipsWithData.length, 'clips');
    console.log('========== ANALYSIS COMPLETE ==========\n');
    
    return clipsWithData;
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    throw error;
  }
}

// Helper: Create SRT content
function createSRT(captions) {
  if (!captions || !Array.isArray(captions) || captions.length === 0) {
    return '';
  }
  
  return captions.map((cap, index) => {
    const start = formatSRTTime(cap.startTime);
    const end = formatSRTTime(cap.endTime);
    return `${index + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
  }).join('');
}

function formatSRTTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ROUTES

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/clips', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ clips: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clips/:clipId', authenticateToken, async (req, res) => {
  try {
    const { clipId } = req.params;
    const userId = req.user.id;
    
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select('thumbnail_url')
      .eq('id', clipId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }
    
    if (clip.thumbnail_url) {
      const path = clip.thumbnail_url.split('/').pop();
      await supabase.storage.from('thumbnails').remove([`${userId}/${path}`]);
    }
    
    const previewFileName = `preview-${clipId}.mp4`;
    const previewPath = path.join(uploadsDir, previewFileName);
    if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);
    
    const { error: deleteError } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    res.json({ success: true, message: 'Clip deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clips', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: clips, error: fetchError } = await supabase
      .from('clips')
      .select('thumbnail_url')
      .eq('user_id', userId);
    
    if (fetchError) throw fetchError;
    
    for (const clip of clips || []) {
      if (clip.thumbnail_url) {
        const path = clip.thumbnail_url.split('/').pop();
        await supabase.storage.from('thumbnails').remove([`${userId}/${path}`]);
      }
      const previewFileName = `preview-${clip.id}.mp4`;
      const previewPath = path.join(uploadsDir, previewFileName);
      if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);
    }
    
    const { error: deleteError } = await supabase
      .from('clips')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    res.json({ success: true, deleted: clips?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }
    
    const clips = await analyzeVideo(req.file.path, req.user.id);
    
    res.json({ success: true, clips });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clips/:clipId/preview', authenticateToken, async (req, res) => {
  try {
    const { data: clip, error } = await supabase
      .from('clips')
      .select('id, user_id')
      .eq('id', req.params.clipId)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }
    
    const previewFileName = `preview-${clip.id}.mp4`;
    const previewPath = path.join(uploadsDir, previewFileName);
    
    if (!fs.existsSync(previewPath)) {
      return res.status(404).json({ error: 'Preview not found' });
    }
    
    const stat = fs.statSync(previewPath);
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(previewPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(previewPath).pipe(res);
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export', authenticateToken, async (req, res) => {
  let outputPath = null;
  
  try {
    const { clipId, format, clipData } = req.body;
    const inputPath = path.join(uploadsDir, clipData.original_video);
    
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Original video not found' });
    }
    
    const outputName = `export-${clipId}-${Date.now()}.mp4`;
    outputPath = path.join(processedDir, outputName);
    
    const startTime = parseFloat(clipData.startTime) || 0;
    const duration = parseFloat(clipData.endTime - clipData.startTime) || 30;
    
    let srtPath = null;
    if (clipData.captions && clipData.captions.length > 0) {
      srtPath = path.join(processedDir, `subs-${clipId}.srt`);
      fs.writeFileSync(srtPath, createSRT(clipData.captions));
    }
    
    let videoFilter = '';
    switch(format) {
      case '9:16':
        videoFilter = 'crop=ih*9/16:ih,scale=1080:1920:flags=lanczos';
        break;
      case '1:1':
        videoFilter = 'crop=ih:ih,scale=1080:1080:flags=lanczos';
        break;
      default:
        videoFilter = 'scale=1920:1080:flags=lanczos';
    }
    
    if (srtPath && fs.existsSync(srtPath)) {
      videoFilter += `,subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=0,Alignment=2,MarginV=50'`;
    }
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilters(videoFilter)
        .videoCodec('libx264')
        .videoBitrate('3000k')
        .audioCodec('aac')
        .audioBitrate('192k')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    fileStream.on('close', () => {
      fs.unlink(outputPath, () => {});
      if (srtPath && fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
    });
    
  } catch (error) {
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    res.status(500).json({ error: error.message });
  }
});

// Import from URL (YouTube, Instagram, TikTok)
app.post('/api/import-url', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    const supportedDomains = ['youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com'];
    const isValid = supportedDomains.some(domain => url.includes(domain));
    
    if (!isValid) {
      return res.status(400).json({ error: 'Unsupported URL. Use YouTube, Instagram, or TikTok.' });
    }

    const videoId = Date.now().toString(36);
    const outputPath = path.join(uploadsDir, `${videoId}.mp4`);

    try {
      console.log(`🌐 Importing from: ${url}`);
      
      // Use a more modern approach for video downloading
      // Note: This is a placeholder - you may need to use a different service
      console.log('🌐 Video import feature temporarily disabled for API compliance');
      
      return res.status(503).json({ 
        error: 'Video import temporarily disabled. Please upload directly.',
        message: 'YouTube import feature is being updated to comply with API changes.'
      });
      
    } catch (error) {
      console.error('❌ Import error:', error.message);
      
      // Clean up partial file
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      
      return res.status(500).json({ 
        error: 'Failed to import video',
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Import URL error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// NEW FEATURE: Burn Captions (Updated to use edited captions)
app.post('/api/clips/:id/burn-captions', authenticateToken, async (req, res) => {
  try {
    const { captions } = req.body;
    const { data: clip, error } = await supabase
      .from('clips')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    const videoPath = path.join(uploadsDir, `preview-${clip.id}.mp4`);
    const outputPath = path.join(processedDir, `burned-${clip.id}.mp4`);
    const srtPath = path.join(processedDir, `subs-${clip.id}.srt`);

    // Create SRT from provided captions (edited or original)
    const srtContent = captions.map((cap, idx) => {
      const start = new Date(cap.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      const end = new Date(cap.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      return `${idx + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
    }).join('');

    fs.writeFileSync(srtPath, srtContent);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .videoFilter(`subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2'`)
        .videoCodec('libx264')
        .audioCodec('copy')
        .outputOptions(['-preset fast'])
        .on('end', () => {
          fs.unlinkSync(srtPath);
          resolve();
        })
        .on('error', (err) => {
          fs.unlinkSync(srtPath);
          reject(err);
        })
        .save(outputPath);
    });

    // Replace preview
    fs.renameSync(outputPath, videoPath);

    await supabase
      .from('clips')
      .update({ has_burned_captions: true })
      .eq('id', clip.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update clip folder name
app.patch('/api/clips/:id/folder', authenticateToken, async (req, res) => {
  try {
    const { folder_name } = req.body;
    const { error } = await supabase
      .from('clips')
      .update({ folder_name })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update clip hashtags
app.patch('/api/clips/:id/hashtags', authenticateToken, async (req, res) => {
  try {
    const { hashtags } = req.body;
    const { error } = await supabase
      .from('clips')
      .update({ custom_hashtags: hashtags })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update clip title
app.patch('/api/clips/:id/title', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const { error } = await supabase
      .from('clips')
      .update({ custom_title: title })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update clip captions
app.patch('/api/clips/:id/captions', authenticateToken, async (req, res) => {
  try {
    const { captions } = req.body;
    const { error } = await supabase
      .from('clips')
      .update({ edited_captions: captions })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trim/update clip timing
app.patch('/api/clips/:id/trim', authenticateToken, async (req, res) => {
  try {
    const { start_time, end_time, title, is_manual_clip } = req.body;
    
    // Regenerate the preview video with new timing
    const { data: clip } = await supabase
      .from('clips')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    const inputPath = path.join(uploadsDir, clip.original_video);
    const outputPath = path.join(processedDir, `trimmed-${clip.id}.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start_time)
        .setDuration(end_time - start_time)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-movflags +faststart'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    // Move to replace preview
    const finalPath = path.join(uploadsDir, `preview-${clip.id}.mp4`);
    fs.renameSync(outputPath, finalPath);
    
    // Update database
    const { error } = await supabase
      .from('clips')
      .update({ 
        start_time, 
        end_time, 
        custom_title: title, 
        is_manual_clip 
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW FEATURE: Auto-Reframe
app.post('/api/clips/:id/reframe', authenticateToken, async (req, res) => {
  try {
    const { data: clip, error } = await supabase
      .from('clips')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const videoPath = path.join(uploadsDir, clip.original_video);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Original video not found' });
    }

    const outputPath = path.join(processedDir, `reframed-${clip.id}.mp4`);

    console.log(`📱 Reframes clip ${clip.id} to 9:16`);

    // Smart center crop to 9:16
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(clip.start_time)
        .setDuration(clip.end_time - clip.start_time)
        .videoFilter([
          'crop=iw*9/16:ih:(iw-ow)/2:(ih-oh)/2', // Center crop
          'scale=1080:1920:flags=lanczos'        // Scale to vertical HD
        ])
        .videoCodec('libx264')
        .audioCodec('copy')
        .outputOptions(['-preset fast', '-movflags +faststart'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    // Replace preview file
    const finalPath = path.join(uploadsDir, `preview-${clip.id}.mp4`);
    fs.renameSync(outputPath, finalPath);
    
    // Update database
    const { error: updateError } = await supabase
      .from('clips')
      .update({ is_reframed: true })
      .eq('id', clip.id);
    
    if (updateError) throw updateError;
    
    console.log(`✅ Reframed clip ${clip.id}`);
    res.json({ success: true, is_reframed: true });
    
  } catch (error) {
    console.error('❌ Reframe error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// NEW FEATURE: Color Grade
app.post('/api/clips/:id/color-grade', authenticateToken, async (req, res) => {
  try {
    const { colorGrade } = req.body;
    const { data: clip, error } = await supabase
      .from('clips')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const videoPath = path.join(uploadsDir, clip.original_video);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Original video not found' });
    }

    const outputPath = path.join(processedDir, `graded-${clip.id}.mp4`);

    console.log(`🎨 Color grading clip ${clip.id}`);

    // Build filter string
    const brightness = (colorGrade.brightness - 100) / 100;
    const contrast = colorGrade.contrast / 100;
    const saturation = colorGrade.saturation / 100;
    
    let filters = [`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`];
    
    // Add preset filters
    const presets = {
      warm: 'colorbalance=rs=.1:gs=-.05:bs=-.1',
      cool: 'colorbalance=rs=-.1:gs=.05:bs=.1',
      bw: 'hue=s=0',
      vintage: 'curves=r="0/0 .5/.4 1/.9":g="0/0 .5/.5 1/1":b="0/0 .5/.6 1/.8"',
      dramatic: 'eq=contrast=1.3:saturation=1.2'
    };
    
    if (presets[colorGrade.filter]) {
      filters.push(presets[colorGrade.filter]);
    }

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(clip.start_time)
        .setDuration(clip.end_time - clip.start_time)
        .videoFilter(filters.join(','))
        .videoCodec('libx264')
        .audioCodec('copy')
        .outputOptions(['-preset fast', '-movflags +faststart'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    // Replace preview file
    const finalPath = path.join(uploadsDir, `preview-${clip.id}.mp4`);
    fs.renameSync(outputPath, finalPath);
    
    // Update database
    const { error: updateError } = await supabase
      .from('clips')
      .update({ color_grade: colorGrade })
      .eq('id', clip.id);
    
    if (updateError) throw updateError;
    
    console.log(`✅ Color graded clip ${clip.id}`);
    res.json({ success: true, color_grade: colorGrade });
    
  } catch (error) {
    console.error('❌ Color grade error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ClipFlow Backend API',
    status: 'running',
    endpoints: [
      'POST /api/analyze',
      'GET /api/clips',
      'DELETE /api/clips/:id',
      'POST /api/process-clip',
      'POST /api/generate-titles',
      'POST /api/viral-score'
    ],
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log(`📁 Processed: ${processedDir}`);
});