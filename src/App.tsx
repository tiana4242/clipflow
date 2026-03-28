import React, { useState, useEffect, useRef } from 'react';
import './styles/dynamic-styles.css';
import { usePWA } from './hooks/usePWA'
import { PerformanceOptimizer, CSSCustomProperties } from './utils/performance'
import { AccessibilityManager } from './utils/accessibility'
import { api, tokenManager } from './lib/unified-api'
import { API_CONFIG } from './config/api'
import { useBatchedAPI } from './utils/batchedAPI'
import { requestCache, CACHE_KEYS } from './utils/requestCache'
import { 
  Scissors, Upload, Play, Download, X, LogOut, Loader2, Trash2, 
  LayoutGrid, List, Share2, Facebook, Youtube, Music2, 
  AlertCircle, Chrome, Hash, Copy, Menu, 
  ChevronLeft, Folder, Palette, RotateCcw, RotateCw, Globe, Type,
  TrendingUp, Film, Sparkles, Subtitles, Edit3, Save, 
  Crop, Clock, Zap, PlusCircle, Pencil,
  Tag
} from 'lucide-react';

// Lazy load non-critical components
const PWAInstallPrompt = React.lazy(() => import('./components/PWAInstallPrompt'));

// Debug imports
console.log('🔍 Icon imports:', {
  Scissors: typeof Scissors,
  Upload: typeof Upload,
  Play: typeof Play,
  Download: typeof Download
});

const API_URL = API_CONFIG.getCurrentUrl();

// Types
interface VideoClip {
  id: string;
  start_time: number;
  end_time: number;
  thumbnail_url: string;
  title: string;
  custom_title?: string;
  virality_score: number;
  captions: any[];
  edited_captions?: any[];
  original_video: string;
  video_url?: string;
  hashtags?: string[];
  custom_hashtags?: string[];
  created_at: string;
  source_video_id?: string;
  collection_name?: string;
  folder_name?: string;
  color_grade?: ColorGrade;
  has_burned_captions?: boolean;
  is_reframed?: boolean;
  is_manual_clip?: boolean;
}

interface ColorGrade {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: 'none' | 'warm' | 'cool' | 'bw' | 'vintage' | 'dramatic';
}

interface HistoryState {
  clips: VideoClip[];
  action: string;
  timestamp: number;
}

// Undo/Redo Manager
class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxSize: number = 20;

  push(clips: VideoClip[], action: string) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push({
    clips: JSON.parse(JSON.stringify(clips)),
      action,
      timestamp: Date.now()
    });
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(): HistoryState | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): HistoryState | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  canUndo(): boolean { return this.currentIndex > 0; }
  canRedo(): boolean { return this.currentIndex < this.history.length - 1; }
  getCurrent(): HistoryState | null { 
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null; 
  }
}

const TRENDING_HASHTAGS: Record<string, string[]> = {
  gaming: ['#Gaming', '#Gamer', '#Gameplay', '#Stream', '#Twitch', '#Victory', '#Clutch'],
  tech: ['#TechTok', '#Gadget', '#AI', '#Innovation', '#FutureTech', '#Review'],
  fitness: ['#Fitness', '#Gym', '#Workout', '#Transformation', '#Healthy', '#Gains'],
  food: ['#FoodTok', '#Recipe', '#Cooking', '#Chef', '#Delicious', '#Foodie'],
  motivation: ['#Motivation', '#Mindset', '#Success', '#Hustle', '#Entrepreneur', '#Grind'],
  funny: ['#Funny', '#Comedy', '#LOL', '#Humor', '#Meme', '#Trending'],
  beauty: ['#Beauty', '#Makeup', '#Skincare', '#GlowUp', '#Tutorial', '#Aesthetic'],
  travel: ['#Travel', '#Wanderlust', '#Adventure', '#Explore', '#Vacation', '#Views']
};

// Helper functions
const getFilterCSS = (filter: string): string => {
  switch (filter) {
    case 'warm': return 'sepia(0.3) saturate(1.2)';
    case 'cool': return 'hue-rotate(180deg) saturate(0.8)';
    case 'bw': return 'grayscale(1)';
    case 'vintage': return 'sepia(0.4) contrast(0.9)';
    case 'dramatic': return 'contrast(1.2) saturate(1.3)';
    default: return '';
  }
};

const generateHashtags = (title: string, viralityScore: number): string[] => {
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'your', 'just', 'like'].includes(w));
  
  const viralTags = viralityScore > 90 ? ['#Viral', '#Trending', '#FYP'] : 
                    viralityScore > 80 ? ['#Viral', '#Trending'] : 
                    ['#ContentCreator'];
  
  const categoryTags: Record<string, string[]> = {
    funny: ['#Funny', '#Comedy', '#LOL'],
    tech: ['#Tech', '#Technology', '#Innovation'],
    music: ['#Music', '#Song', '#Beat'],
    gaming: ['#Gaming', '#Gamer', '#Gameplay'],
    food: ['#Food', '#Foodie', '#Recipe'],
    travel: ['#Travel', '#Adventure', '#Wanderlust'],
    fitness: ['#Fitness', '#Workout', '#Gym'],
    motivation: ['#Motivation', '#Inspiring', '#Mindset'],
    tutorial: ['#Tutorial', '#HowTo', '#Learn'],
  };
  
  let matchedTags: string[] = [];
  words.forEach(word => {
    Object.entries(categoryTags).forEach(([key, tags]) => {
      if (word.includes(key) || key.includes(word)) {
        matchedTags = [...matchedTags, ...tags];
      }
    });
  });
  
  const platformTags = ['#ClipFlow', '#Shorts', '#Reels', '#TikTok'];
  
  return [...new Set([
    ...viralTags.slice(0, 2),
    ...matchedTags.slice(0, 3),
    ...words.slice(0, 2).map(w => `#${w.charAt(0).toUpperCase() + w.slice(1)}`),
    ...platformTags.slice(0, 2)
  ])].slice(0, 8);
};

// Enhanced UI Components
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string; maxWidth?: string }> = ({ 
  isOpen, onClose, children, title, maxWidth = 'max-w-2xl' 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Close modal">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, children, variant = 'primary', size = 'md', className = '', disabled, type = 'button' }) => {
  const baseStyles = "font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25 border border-purple-400/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25",
    ghost: "hover:bg-slate-800 text-slate-300 hover:text-white"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2.5 rounded-xl",
    lg: "px-6 py-3 text-lg rounded-xl"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Viral Score Calculator with detailed breakdown
const calculateViralScore = (clip: VideoClip): { score: number; breakdown: { label: string; value: number; max: number; icon: any }[] } => {
  let score = clip.virality_score || 70;
  const breakdown = [];
  
  // Base score
  breakdown.push({ label: 'Base Score', value: clip.virality_score || 70, max: 100, icon: Zap });
  
  // Duration bonus
  const duration = clip.end_time - clip.start_time;
  let durationBonus = 0;
  if (duration >= 15 && duration <= 30) durationBonus = 5;
  else if (duration >= 30 && duration <= 60) durationBonus = 3;
  if (durationBonus > 0) {
    score += durationBonus;
    breakdown.push({ label: 'Optimal Duration', value: durationBonus, max: 5, icon: Clock });
  }
  
  // Captions bonus
  if (clip.captions?.length > 0 || (clip.edited_captions && clip.edited_captions.length > 0)) {
    score += 3;
    breakdown.push({ label: 'Captions', value: 3, max: 3, icon: Subtitles });
  }
  
  // Enhancements
  if (clip.color_grade) {
    score += 2;
    breakdown.push({ label: 'Color Graded', value: 2, max: 2, icon: Palette });
  }
  if (clip.is_reframed) {
    score += 5;
    breakdown.push({ label: 'Reframed 9:16', value: 5, max: 5, icon: Crop });
  }
  if (clip.custom_hashtags && clip.custom_hashtags.length > 0) {
    score += 2;
    breakdown.push({ label: 'Custom Hashtags', value: 2, max: 2, icon: Tag });
  }
  
  // Trending words
  const trendingWords = ['hack', 'secret', 'ultimate', 'must', 'viral', 'trending', 'tips', 'how to'];
  const hasTrendingWord = trendingWords.some(w => (clip.custom_title || clip.title).toLowerCase().includes(w));
  if (hasTrendingWord) {
    score += 3;
    breakdown.push({ label: 'Trending Keywords', value: 3, max: 3, icon: TrendingUp });
  }

  return { score: Math.min(100, score), breakdown };
};

// Clip Card Component
const ClipCard: React.FC<{
  clip: VideoClip;
  isMobile: boolean;
  swipingClip: string | null;
  setSwipingClip: (id: string | null) => void;
  setSelectedClip: (clip: VideoClip) => void;
  deleteClip: (id: string, e?: React.MouseEvent) => void;
  deleting: string | null;
  showHashtags: string | null;
  setShowHashtags: (id: string | null) => void;
  shareClip: (platform: 'facebook' | 'tiktok' | 'youtube', clip: VideoClip) => void;
  copyHashtags: (hashtags: string[]) => void;
  setShowColorGrader: (show: boolean) => void;
  formatDate: (date: string) => string;
  onEditHashtags: (clip: VideoClip) => void;
  onEditTitle: (clip: VideoClip) => void;
  onPredictScore: (clip: VideoClip) => void;
}> = ({ 
  clip, isMobile, swipingClip, setSwipingClip, setSelectedClip, deleteClip, 
  deleting, showHashtags, setShowHashtags, shareClip, 
  copyHashtags, setShowColorGrader, formatDate, onEditHashtags, onEditTitle, 
  onPredictScore
}) => {
  const displayTitle = clip.custom_title || clip.title;
  const displayHashtags = clip.custom_hashtags || clip.hashtags || generateHashtags(displayTitle, clip.virality_score);
  const { score } = calculateViralScore(clip);

  // Swipe handlers
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diff = touchStart.x - e.changedTouches[0].clientX;
    if (diff > 50) { // Swiped left
      setSwipingClip(clip.id);
      setTimeout(() => deleteClip(clip.id), 200);
    }
    setTouchStart(null);
  };

  return (
    <div 
      className={`group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 ${
        swipingClip === clip.id ? 'opacity-50 translate-x-[-100px]' : ''
      }`}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video cursor-pointer overflow-hidden"
        onClick={() => setSelectedClip(clip)}
      >
        <img 
          src={clip.thumbnail_url} 
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 color-filter-preview"
          data-filter-value={clip.color_grade 
            ? `brightness(${clip.color_grade.brightness}%) contrast(${clip.color_grade.contrast}%) saturate(${clip.color_grade.saturation}%) ${getFilterCSS(clip.color_grade.filter)}` 
            : 'none'
          }
          fetchpriority={index === 0 ? "high" : "auto"}
          loading={index === 0 ? "eager" : "lazy"}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect fill="%231e293b" width="640" height="360"/><text fill="%2364748b" font-family="sans-serif" font-size="20" x="320" y="180" text-anchor="middle">No Preview</text></svg>';
          }}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="p-3 bg-purple-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onPredictScore(clip); }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <Zap className="w-3 h-3" /> {score}
          </button>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {clip.is_reframed && (
            <span className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
              9:16
            </span>
          )}
          {clip.has_burned_captions && (
            <span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg flex items-center gap-1">
              <Subtitles className="w-3 h-3" /> CC
            </span>
          )}
        </div>
        
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
          {Math.round(clip.end_time - clip.start_time)}s
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 
            className="font-semibold text-base line-clamp-1 flex-1 text-slate-100 group-hover:text-purple-300 transition-colors cursor-pointer"
            onClick={() => onEditTitle(clip)}
            title="Edit title"
          >
            {displayTitle}
          </h3>
          <button 
            onClick={() => onEditTitle(clip)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all"
            title="Edit title"
          >
            <Pencil className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <p className="text-xs text-slate-300 mb-3">{formatDate(clip.created_at)}</p>
        
        {/* Hashtags */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {displayHashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] md:text-xs px-2.5 py-1 bg-slate-800 text-purple-300 rounded-full border border-slate-700">
              #{tag.replace('#', '')}
            </span>
          ))}
          {displayHashtags.length > 3 && (
            <button 
              onClick={() => setShowHashtags(showHashtags === clip.id ? null : clip.id)}
              className="text-[10px] md:text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 transition-colors"
              title="Show all hashtags"
            >
              +{displayHashtags.length - 3}
            </button>
          )}
          <button 
            onClick={() => onEditHashtags(clip)}
            className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 text-slate-300 hover:text-purple-400 transition-colors"
            title="Edit hashtags"
          >
            Edit
          </button>
        </div>
        
        {showHashtags === clip.id && (
          <div className="mb-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayHashtags.map((tag, i) => (
                <span key={i} className="text-xs px-2.5 py-1.5 bg-slate-700 text-slate-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => copyHashtags(displayHashtags)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                title="Copy hashtags"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button 
                onClick={() => onEditHashtags(clip)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-400 hover:text-purple-300 py-2 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
                title="Edit hashtags"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={() => setSelectedClip(clip)}
            className="col-span-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center"
            title="Edit clip"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => { setSelectedClip(clip); setShowColorGrader(true); }}
            className="col-span-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="Color grade"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => shareClip('tiktok', clip)}
            className="col-span-1 py-2.5 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 text-cyan-400 rounded-xl transition-all active:scale-95 flex items-center justify-center border border-cyan-500/20"
            title="Share on TikTok"
          >
            <Share2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => deleteClip(clip.id)}
            disabled={deleting === clip.id}
            className="col-span-1 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            title="Delete clip"
          >
            {deleting === clip.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
        
        {isMobile && (
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            ← Swipe left to delete
          </p>
        )}
      </div>
    </div>
  );
};

// Viral Score Modal
const ViralScoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  clip: VideoClip | null;
}> = ({ isOpen, onClose, clip }) => {
  if (!clip) return null;
  
  const { score, breakdown } = calculateViralScore(clip);
  const duration = clip.end_time - clip.start_time;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Viral Score Analysis" maxWidth="max-w-md">
      <div className="p-6 space-y-6">
        {/* Score Circle */}
        <div className="flex justify-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={351.86}
                strokeDashoffset={351.86 * (1 - score / 100)}
                className={`${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{score}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Score Breakdown</h4>
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="p-2 bg-slate-700 rounded-lg">
                <item.icon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className="text-sm font-medium text-white">+{item.value}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full progress-bar-fill"
                    data-progress-width={`${(item.value / item.max) * 100}%`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
          <div className="p-3 bg-slate-800/30 rounded-lg text-center">
            <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">{Math.round(duration)}s</div>
            <div className="text-xs text-slate-300">Duration</div>
          </div>
          <div className="p-3 bg-slate-800/30 rounded-lg text-center">
            <Subtitles className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">{(clip.edited_captions || clip.captions)?.length || 0}</div>
            <div className="text-xs text-slate-300">Captions</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Caption Editor Modal
const CaptionEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  clip: VideoClip | null;
  onSave: (captions: any[]) => void;
}> = ({ isOpen, onClose, clip, onSave }) => {
  const [captions, setCaptions] = useState<any[]>([]);
  
  useEffect(() => {
    if (clip) {
      setCaptions(clip.edited_captions || clip.captions || []);
    }
  }, [clip]);

  if (!clip) return null;

  const updateCaption = (index: number, field: string, value: string | number) => {
    const newCaptions = [...captions];
    newCaptions[index] = { ...newCaptions[index], [field]: value };
    setCaptions(newCaptions);
  };

  const addCaption = () => {
    const lastCaption = captions[captions.length - 1];
    const newStart = lastCaption ? lastCaption.endTime : 0;
    setCaptions([...captions, { text: 'New caption', startTime: newStart, endTime: newStart + 2 }]);
  };

  const removeCaption = (index: number) => {
    setCaptions(captions.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Captions" maxWidth="max-w-2xl">
      <div className="p-6 space-y-4">
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {captions.map((cap, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={cap.text}
                  onChange={(e) => updateCaption(idx, 'text', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Caption text..."
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cap.startTime}
                    onChange={(e) => updateCaption(idx, 'startTime', parseFloat(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    placeholder="Start"
                    step="0.1"
                  />
                  <span className="text-slate-300 self-center">→</span>
                  <input
                    type="number"
                    value={cap.endTime}
                    onChange={(e) => updateCaption(idx, 'endTime', parseFloat(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    placeholder="End"
                    step="0.1"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeCaption(idx)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove caption"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <Button onClick={addCaption} variant="secondary" className="w-full">
          <PlusCircle className="w-4 h-4" /> Add Caption
        </Button>
        
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button onClick={onClose} variant="ghost" className="flex-1">Cancel</Button>
          <Button 
            onClick={() => { onSave(captions); onClose(); }}
            variant="primary" 
            className="flex-1"
          >
            <Save className="w-4 h-4" /> Save Captions
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Manual Clip Editor
const ClipEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  clip: VideoClip | null;
  onSave: (start: number, end: number, title: string) => void;
  videoUrl: string;
}> = ({ isOpen, onClose, clip, onSave, videoUrl }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [title, setTitle] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (clip) {
      setStartTime(clip.start_time);
      setEndTime(clip.end_time);
      setTitle(clip.custom_title || clip.title);
    }
  }, [clip]);

  if (!clip) return null;

  const handleTrim = () => {
    if (startTime < endTime && endTime - startTime >= 5) {
      onSave(startTime, endTime, title);
      onClose();
    }
  };

  const setCurrentTime = (type: 'start' | 'end') => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      if (type === 'start') setStartTime(time);
      else setEndTime(time);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Clip Editor" maxWidth="max-w-3xl">
      <div className="p-6 space-y-6">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <video 
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full"
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Clip Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter clip title"
              title="Clip title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center justify-between">
                Start Time
                <button 
                  onClick={() => setCurrentTime('start')}
                  className="text-xs text-purple-400 hover:text-purple-300"
                  title="Set current time as start"
                >
                  Set Current
                </button>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={startTime.toFixed(1)}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  step="0.1"
                  placeholder="Start time"
                  title="Start time in seconds"
                />
                <span className="text-slate-300">s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center justify-between">
                End Time
                <button 
                  onClick={() => setCurrentTime('end')}
                  className="text-xs text-purple-400 hover:text-purple-300"
                  title="Set current time as end"
                >
                  Set Current
                </button>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={endTime.toFixed(1)}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  step="0.1"
                  placeholder="End time"
                  title="End time in seconds"
                />
                <span className="text-slate-300">s</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Duration:</span>
              <span className="text-white font-medium">{(endTime - startTime).toFixed(1)}s</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 duration-progress"
                data-duration-width={`${Math.min((endTime - startTime) / 60 * 100, 100)}%`}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button onClick={onClose} variant="ghost" className="flex-1">Cancel</Button>
          <Button 
            onClick={handleTrim}
            variant="primary" 
            className="flex-1"
            disabled={endTime - startTime < 5}
          >
            <Scissors className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function App() {
  const historyManager = useRef(new HistoryManager()).current;
  
  // Core States
  const [session, setSession] = useState<any>(null);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [swipingClip, setSwipingClip] = useState<string | null>(null);
  const [showHashtags, setShowHashtags] = useState<string | null>(null);
  
  // Feature States
  const [collections, setCollections] = useState<Record<string, VideoClip[]>>({});
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [showColorGrader, setShowColorGrader] = useState(false);
  const [colorAdjustments, setColorAdjustments] = useState<ColorGrade>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    filter: 'none'
  });
  const [urlInput, setUrlInput] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [processingCaptions, setProcessingCaptions] = useState(false);
  const [showTrendingHashtags, setShowTrendingHashtags] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  
  // New Modals
  const [editingHashtags, setEditingHashtags] = useState<VideoClip | null>(null);
  const [hashtagInput, setHashtagInput] = useState('');
  const [editingTitle, setEditingTitle] = useState<VideoClip | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [predictingScore, setPredictingScore] = useState<VideoClip | null>(null);
  const [editingCaptions, setEditingCaptions] = useState<VideoClip | null>(null);
  const [manualEditing, setManualEditing] = useState<VideoClip | null>(null);
  
  // Undo/Redo States
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Effects
  useEffect(() => {
    // Initialize accessibility manager
    AccessibilityManager.init();
    
    // Initialize user session from token
    const initializeSession = async () => {
      const token = tokenManager.getToken();
      if (token) {
        try {
          const user = await api.getCurrentUser(token);
          if (user) {
            setSession({ user, access_token: token });
            // Defer clips fetch to improve critical path
            fetchClips();
          }
        } catch (error) {
          console.error('Failed to initialize session:', error);
          tokenManager.removeToken();
          setSession(null);
        }
      }
    };

    // Initialize session on mount
    initializeSession();
  }, []);

  useEffect(() => {
    setVideoError(null);
    setVideoLoading(true);
  }, [selectedClip]);

  useEffect(() => {
    // Initialize performance optimizations
    CSSCustomProperties.initialize();
    
    // Use optimized viewport handling
    const handleViewportUpdate = PerformanceOptimizer.createOptimizedResizeHandler(
      CSSCustomProperties.updateViewportUnits
    );
    
    // Add event listeners with passive option for better performance
    window.addEventListener('resize', handleViewportUpdate, { passive: true });
    window.addEventListener('orientationchange', handleViewportUpdate, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleViewportUpdate);
      window.removeEventListener('orientationchange', handleViewportUpdate);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyManager]);

  useEffect(() => {
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  }, [historyManager]);

  useEffect(() => {
    if (clips.length > 0 && !historyManager.getCurrent()) {
      historyManager.push(clips, 'initial');
    }
  }, [clips, historyManager]);

  useEffect(() => {
    const grouped = clips.reduce((acc, clip) => {
      const key = clip.folder_name || clip.collection_name || clip.source_video_id || 'unsorted';
      if (!acc[key]) acc[key] = [];
      acc[key].push(clip);
      return acc;
    }, {} as Record<string, VideoClip[]>);
    
    setCollections(grouped);
  }, [clips]);

  // Fetch clips with caching and batching
  const fetchClips = async () => {
    try {
      setLoading(true);
      const token = tokenManager.getToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      console.log('🔍 fetchClips - Using unified API with caching');
      
      // Use unified API with caching
      const clips = await api.getClips(token);
      
      if (clips) {
        setClips(clips);
        // Update collections
        const newCollections: Record<string, VideoClip[]> = {};
        clips.forEach((clip: VideoClip) => {
          const collection = clip.folder_name || clip.collection_name || clip.source_video_id || 'Uncategorized';
          if (!newCollections[collection]) {
            newCollections[collection] = [];
          }
          newCollections[collection].push(clip);
        });
        setCollections(newCollections);
      }
    } catch (err) {
      console.error('❌ Failed to fetch clips:', err);
      setError('Failed to load clips');
    } finally {
      setLoading(false);
    }
  };

  // Auth Functions
  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Note: Google OAuth would need to be implemented in backend
      // For now, show message
      alert('Google sign in will be available in the next update. Please use email sign in for now.');
    } catch (err: any) {
      alert('Google sign in failed: ' + err.message);
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        const result = await api.signUp(email, password, email.split('@')[0]);
        alert('Sign up successful! Please check your email for confirmation.');
        setAuthMode('login');
      } else {
        const result = await api.signIn(email, password);
        if (result.user && result.token) {
          tokenManager.setToken(result.token);
          setSession({ user: result.user, access_token: result.token });
          fetchClips();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      const token = tokenManager.getToken();
      if (token) {
        await api.signOut(token);
      }
      tokenManager.removeToken();
      setSession(null);
      setClips([]);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Data Functions
  const getVideoUrl = (clip: VideoClip): string => {
    if (clip.video_url) return clip.video_url;
    if (clip.original_video) return `${API_URL}/uploads/${clip.original_video}`;
    return '';
  };

  // Undo/Redo
  const handleUndo = () => {
    const prevState = historyManager.undo();
    if (prevState) setClips(prevState.clips);
  };

  const handleRedo = () => {
    const nextState = historyManager.redo();
    if (nextState) setClips(nextState.clips);
  };

  const updateClipsWithHistory = (newClips: VideoClip[], action: string) => {
    historyManager.push(newClips, action);
    setClips(newClips);
  };

  // Delete Functions
  const deleteAllClips = async () => {
    if (!confirm('⚠️ Delete ALL clips? This cannot be undone.')) return;
    setDeletingAll(true);
    try {
      await api.deleteAllClips(tokenManager.getToken()!);
      updateClipsWithHistory([], 'delete-all');
      alert(`✅ Deleted all clips`);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAll(false);
    }
  };

  const deleteClip = async (clipId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this Clip?')) return;
    setDeleting(clipId);
    try {
      await api.deleteClip(clipId, tokenManager.getToken()!);
      const newClips = clips.filter(c => c.id !== clipId);
      updateClipsWithHistory(newClips, 'delete-clip');
      if (selectedClip?.id === clipId) setSelectedClip(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // Edit Functions
  const updateFolderName = async (source: string, newName: string) => {
    try {
      const token = tokenManager.getToken();
      if (!token) throw new Error('Not authenticated');
      
      // Get clips for user
      const clips = await api.getClips(token);
      const clipsToUpdate = collections[source];
      
      if (!clipsToUpdate) {
        throw new Error('Collection not found');
      }
      
      // Update clips in unified backend
      for (const clip of clipsToUpdate) {
        await api.updateClip(clip.id, { 
          folder_name: newName 
        }, token);
      }
      
      // Update local state
      const newCollections = { ...collections };
      newCollections[newName] = clipsToUpdate;
      setCollections(newCollections);
      
      alert(`✅ Folder renamed from "${source}" to "${newName}"`);
    } catch (error) {
      console.error('Failed to update folder name:', error);
      alert('Failed to update folder name');
    }
  };

  const updateHashtags = async (clip: VideoClip, hashtags: string[]) => {
    try {
      const token = tokenManager.getToken();
      if (!token) throw new Error('Not authenticated');
      
      await api.updateClip(clip.id, { hashtags }, token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, hashtags } : c
      );
      setClips(newClips);
      
      alert('✅ Hashtags updated');
    } catch (error) {
      console.error('Failed to update hashtags:', error);
      alert('Failed to update hashtags');
    }
  };

  const updateTitle = async (clip: VideoClip, title: string) => {
    try {
      const token = tokenManager.getToken();
      if (!token) throw new Error('Not authenticated');
      
      await api.updateClip(clip.id, { custom_title: title }, token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, custom_title: title } : c
      );
      setClips(newClips);
      
      alert('✅ Title updated');
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title');
    }
  };

  const saveCaptions = async (clip: VideoClip, captions: any[]) => {
    try {
      const token = tokenManager.getToken();
      if (!token) throw new Error('Not authenticated');
      
      await api.updateClip(clip.id, { edited_captions: captions }, token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, edited_captions: captions } : c
      );
      setClips(newClips);
      
      alert('✅ Captions saved');
    } catch (error) {
      console.error('Failed to save captions:', error);
      alert('Failed to save captions');
    }
  };

  const saveManualClip = async (clip: VideoClip, start: number, end: number, title: string) => {
    try {
      const token = tokenManager.getToken();
      if (!token) throw new Error('Not authenticated');
      
      await api.updateClip(clip.id, { 
        start_time: start, 
        end_time: end, 
        custom_title: title,
        is_manual_clip: true 
      }, token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, start_time: start, end_time: end, custom_title: title, is_manual_clip: true } : c
      );
      setClips(newClips);
      
      alert('✅ Manual clip saved');
    } catch (error) {
      console.error('Failed to save manual clip:', error);
      alert('Failed to save manual clip');
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    const token = tokenManager.getToken();
    
    try {
      console.log('🔍 analyzeVideo - Using unified API');
      const clips = await api.analyzeVideo(file.name, token);
      
      if (clips && clips.length > 0) {
        updateClipsWithHistory([...clips, ...clips], 'upload');
        alert(`✅ Created ${clips.length} clips from video!`);
      } else {
        alert('No clips were generated from the video');
      }
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (clip: VideoClip, format: string) => {
    setExporting(true);
    const token = tokenManager.getToken();
    
    try {
      const result = await api.exportClip(clip.id, format, 'high', token);
      
      // Create download link
      const a = document.createElement('a');
      a.href = result.url;
      a.download = `clip-${clip.id}.mp4`;
      a.click();
      
      alert('✅ Export completed successfully!');
    } catch (err) {
      console.error('❌ Export failed:', err);
      alert('Export failed: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setImportingUrl(true);
    const token = tokenManager.getToken();
    
    try {
      const clip = await api.importFromUrl(urlInput, token);
      
      if (clip) {
        updateClipsWithHistory([...clips, clip], 'import-url');
        setUrlInput('');
        setShowUrlImport(false);
        alert('✅ Imported clip from URL!');
      } else {
        alert('Failed to import clip from URL');
      }
    } catch (err) {
      console.error('❌ Import failed:', err);
      alert('Import failed. Make sure URL is valid.');
    } finally {
      setImportingUrl(false);
    }
  };

  const burnCaptions = async (clip: VideoClip) => {
    setProcessingCaptions(true);
    const token = tokenManager.getToken();
    
    try {
      const updatedClip = await api.burnCaptions(clip.id, clip.captions || [], token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, has_burned_captions: true } : c
      );
      updateClipsWithHistory(newClips, 'burn-captions');
      
      alert('✅ Captions burned into video!');
    } catch (error) {
      console.error('Failed to burn captions:', error);
      alert('Failed to process captions');
    } finally {
      setProcessingCaptions(false);
    }
  };

  const applyColorGrade = async (clip: VideoClip, grade: ColorGrade) => {
    setExporting(true);
    const token = tokenManager.getToken();
    
    try {
      const updatedClip = await api.colorGradeClip(clip.id, grade, token);
      
      // Update local state
      const newClips = clips.map(c => 
        c.id === clip.id ? { ...c, color_grade: grade } : c
      );
      updateClipsWithHistory(newClips, 'color-grade');
      setShowColorGrader(false);
      
      alert('✅ Color grade applied successfully!');
    } catch (error) {
      console.error('Failed to apply color grade:', error);
      alert('Color grading failed');
    } finally {
      setExporting(false);
    }
  };

  const autoReframe = async (clip: VideoClip) => {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${API_URL}/api/clips/${clip.id}/reframe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const updatedClip = { ...clip, is_reframed: true };
        const newClips = clips.map(c => c.id === clip.id ? updatedClip : c);
        updateClipsWithHistory(newClips, 'auto-reframe');
        alert('Auto-reframed to 9:16!');
      }
    } catch (err) {
      alert('Reframing failed');
    } finally {
      setLoading(false);
    }
  };

  const getTrendingHashtags = (category: string) => {
    if (category === 'trending') {
      return ['#FYP', '#Viral', '#Trending', '#ForYou', '#ClipFlow', '#Shorts'];
    }
    return TRENDING_HASHTAGS[category] || [];
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Auth Screen
  if (!session) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25">
              <Scissors className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Clip Flow</h2>
          <p className="text-slate-400 text-center mb-8">
            {authMode === 'login' ? 'Sign in to start creating' : 'Create your account'}
          </p>
          
          <button
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-6 shadow-lg"
            type="button"
            title="Sign in with Google"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-300">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 transition-all"
                required
                title="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 transition-all"
                required
                title="Password"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 mt-2"
              title="Sign in"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-sm text-slate-400">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-purple-400 hover:text-purple-300 ml-1 font-semibold"
              title="Switch to sign up"
            >
              {authMode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 md:pb-0">
      {/* Skip to main content target */}
      <div id="main-content" tabIndex={-1} className="sr-only">
        Main content starts here
      </div>
      
      {/* Header */}
      <header id="nav" className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Clip Flow</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={() => setShowUrlImport(true)} variant="secondary" size="sm">
              <Globe className="w-4 h-4" /> Import
            </Button>

            <Button onClick={() => setShowTrendingHashtags(true)} variant="secondary" size="sm">
              <TrendingUp className="w-4 h-4 text-pink-400" /> Trending
            </Button>

            {clips.length > 0 && (
              <Button onClick={deleteAllClips} variant="danger" size="sm" disabled={deletingAll}>
                {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete All
              </Button>
            )}
            
            <span className="text-sm text-slate-400 max-w-[150px] truncate">{session.user.email}</span>
            <button onClick={handleLogout} className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white" title="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 hover:bg-slate-800 rounded-xl transition-colors"
            title="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 py-4 space-y-2">
            <div className="flex gap-2 mb-4">
              <button onClick={handleUndo} disabled={!canUndo} className="flex-1 p-3 bg-slate-800 rounded-xl disabled:opacity-30 flex items-center justify-center" title="Undo">
                <RotateCcw className="w-5 h-5" /> Undo
              </button>
              <button onClick={handleRedo} disabled={!canRedo} className="flex-1 p-3 bg-slate-800 rounded-xl disabled:opacity-30 flex items-center justify-center" title="Redo">
                <RotateCw className="w-5 h-5" /> Redo
              </button>
            </div>
            
            <button onClick={() => { setShowUrlImport(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl" title="Import from URL">
              <Globe className="w-5 h-5" /> Import from URL
            </button>
            <button onClick={() => { setShowTrendingHashtags(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl" title="Trending Hashtags">
              <TrendingUp className="w-5 h-5 text-pink-400" /> Trending Hashtags
            </button>
            {clips.length > 0 && (
              <button onClick={() => { deleteAllClips(); setMobileMenuOpen(false); }} disabled={deletingAll} className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl" title="Delete All Clips">
                {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete All
              </button>
            )}
            <button onClick={() => { handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl text-slate-300" title="Sign out">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-900/50 border border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 text-sm mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Collections Filter with Edit */}
        {Object.keys(collections).length > 0 && (
          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCollection(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !selectedCollection 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
                title="All Clips"
              >
                All Clips ({clips.length})
              </button>
              {Object.entries(collections).map(([source, sourceClips]) => (
                <div key={source} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCollection(source)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedCollection === source 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25' 
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700'
                    }`}
                    title="Collection"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">
                      {source === 'unsorted' ? 'Unsorted' : sourceClips[0]?.folder_name || new URL(source).hostname}
                    </span>
                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">{sourceClips.length}</span>
                  </button>
                  
                  {/* Edit Folder Name Button */}
                  {selectedCollection === source && (
                    <button
                      onClick={() => {
                        setEditingFolder(source);
                        setFolderNameInput(sourceClips[0]?.folder_name || (source === 'unsorted' ? 'Unsorted' : new URL(source).hostname));
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                      title="Edit Folder Name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div 
          className="relative group border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-3xl p-8 mb-8 text-center cursor-pointer transition-all duration-300 bg-slate-900/30 hover:bg-slate-800/30 overflow-hidden"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          title="Upload a video"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            title="Upload video file"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="p-4 bg-slate-800 rounded-2xl w-fit mx-auto mb-6 border border-slate-800">
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Drop your video here</h3>
            <p className="text-slate-400 max-w-md mx-auto">Upload a video or import from URL to get AI-generated clips with automatic captions and viral scores.</p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center mb-8 py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-4">AI is analyzing your video...</p>
          </div>
        )}

        {/* Clips Section */}
        {clips.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedCollection ? (collections[selectedCollection]?.[0]?.folder_name || 'Collection') : 'Your Clips'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {(selectedCollection ? collections[selectedCollection]?.length : clips.length)} clips
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedCollection ? collections[selectedCollection] || [] : clips).map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    isMobile={false}
                    swipingClip={swipingClip}
                    setSwipingClip={setSwipingClip}
                    setSelectedClip={setSelectedClip}
                    deleteClip={deleteClip}
                    deleting={deleting}
                    showHashtags={showHashtags}
                    setShowHashtags={setShowHashtags}
                    shareClip={shareClip}
                    copyHashtags={copyHashtags}
                    setShowColorGrader={setShowColorGrader}
                    formatDate={formatDate}
                    onEditHashtags={setEditingHashtags}
                    onEditTitle={setEditingTitle}
                    onPredictScore={setPredictingScore}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedCollection ? collections[selectedCollection] || [] : clips).map((clip) => (
                  <div 
                    key={clip.id} 
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors group"
                  >
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={clip.thumbnail_url} 
                        alt={clip.title} 
                        className="w-full h-full object-cover"
                        fetchpriority="low"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {Math.round(clip.end_time - clip.start_time)}s
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-white truncate">{clip.custom_title || clip.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-yellow-400 text-sm font-medium flex items-center gap-1">
                          <Zap className="w-4 h-4" /> {calculateViralScore(clip).score}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 text-sm">{formatDate(clip.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => setSelectedClip(clip)} variant="secondary" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setEditingTitle(clip)} variant="ghost" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => deleteClip(clip.id)} variant="danger" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && clips.length === 0 && (
          <div className="text-center py-20">
            <div className="p-6 bg-slate-900/50 rounded-full w-fit mx-auto mb-6 border border-slate-800">
              <Scissors className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No clips yet</h3>
            <p className="text-slate-400 max-w-md mx-auto">Upload a video or import from URL to get AI-generated clips with automatic captions and viral scores.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      
      {/* Edit Folder Name Modal */}
      <Modal isOpen={!!editingFolder} onClose={() => setEditingFolder(null)} title="Edit Folder Name">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Folder Name</label>
            <input
              type="text"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter folder name..."
              title="Folder name"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setEditingFolder(null)} variant="ghost" className="flex-1">Cancel</Button>
            <Button 
              onClick={() => editingFolder && updateFolderName(editingFolder, folderNameInput)}
              variant="primary" 
              className="flex-1"
            >
              <Save className="w-4 h-4" /> Save Name
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Hashtags Modal */}
      <Modal isOpen={!!editingHashtags} onClose={() => setEditingHashtags(null)} title="Edit Hashtags">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Hashtags (comma separated)</label>
            <textarea
              value={hashtagInput || (editingHashtags?.custom_hashtags || editingHashtags?.hashtags || []).join(', ')}
              onChange={(e) => setHashtagInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none min-h-[100px]"
              placeholder="#viral, #trending, #fyp..."
              title="Hashtags"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {getTrendingHashtags('trending').slice(0, 6).map(tag => (
              <button
                key={tag}
                onClick={() => setHashtagInput(prev => prev ? `${prev}, ${tag}` : tag)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setEditingHashtags(null)} variant="ghost" className="flex-1">Cancel</Button>
            <Button 
              onClick={() => {
                if (editingHashtags) {
                  const tags = hashtagInput.split(',').map(t => t.trim()).filter(Boolean);
                  updateHashtags(editingHashtags, tags);
                  setEditingHashtags(null);
                }
              }}
              variant="primary" 
              className="flex-1"
            >
              <Save className="w-4 h-4" /> Save Hashtags
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Title Modal */}
      <Modal isOpen={!!editingTitle} onClose={() => setEditingTitle(null)} title="Edit Title">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Clip Title</label>
            <input
              type="text"
              value={titleInput || editingTitle?.custom_title || editingTitle?.title || ''}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter clip title..."
              title="Clip title"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setEditingTitle(null)} variant="ghost" className="flex-1">Cancel</Button>
            <Button 
              onClick={() => {
                if (editingTitle) {
                  updateTitle(editingTitle, titleInput || editingTitle.title);
                  setEditingTitle(null);
                  setTitleInput('');
                }
              }}
              variant="primary" 
              className="flex-1"
            >
              <Save className="w-4 h-4" /> Save Title
            </Button>
          </div>
        </div>
      </Modal>

      {/* Viral Score Modal */}
      <ViralScoreModal 
        isOpen={!!predictingScore} 
        onClose={() => setPredictingScore(null)} 
        clip={predictingScore}
      />

      {/* Caption Editor Modal */}
      <CaptionEditorModal
        isOpen={!!editingCaptions}
        onClose={() => setEditingCaptions(null)}
        clip={editingCaptions}
        onSave={(captions) => {
          if (editingCaptions) saveCaptions(editingCaptions, captions);
        }}
      />

      {/* Manual Clip Editor */}
      <ClipEditorModal
        isOpen={!!manualEditing}
        onClose={() => setManualEditing(null)}
        clip={manualEditing}
        videoUrl={manualEditing ? getVideoUrl(manualEditing) : ''}
        onSave={(start, end, title) => {
          if (manualEditing) saveManualClip(manualEditing, start, end, title);
        }}
      />

      {/* Color Grader Modal */}
      <Modal isOpen={showColorGrader && !!selectedClip} onClose={() => setShowColorGrader(false)} title="Color Grading">
        <div className="p-6 space-y-6">
          {selectedClip && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img 
                  src={selectedClip.thumbnail_url} 
                  alt="Preview"
                  className="w-full h-full object-cover color-filter-image"
                  data-filter-value={`brightness(${colorAdjustments.brightness}%) contrast(${colorAdjustments.contrast}%) saturate(${colorAdjustments.saturation}%) ${getFilterCSS(colorAdjustments.filter)}`}
                  fetchpriority="high"
                  loading="eager"
                />
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-slate-400 mb-3 block">Filter Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['none', 'warm', 'cool', 'bw', 'vintage', 'dramatic'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setColorAdjustments({...colorAdjustments, filter})}
                        className={`p-2.5 rounded-lg text-sm capitalize transition-all ${
                          colorAdjustments.filter === filter 
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title={filter}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-400">Brightness</label>
                      <span className="text-sm text-white">{colorAdjustments.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={colorAdjustments.brightness}
                      onChange={(e) => setColorAdjustments({...colorAdjustments, brightness: Number(e.target.value)})}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      title="Adjust brightness"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-400">Contrast</label>
                      <span className="text-sm text-white">{colorAdjustments.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={colorAdjustments.contrast}
                      onChange={(e) => setColorAdjustments({...colorAdjustments, contrast: Number(e.target.value)})}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      title="Adjust contrast"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-400">Saturation</label>
                      <span className="text-sm text-white">{colorAdjustments.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={colorAdjustments.saturation}
                      onChange={(e) => setColorAdjustments({...colorAdjustments, saturation: Number(e.target.value)})}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      title="Adjust saturation"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => selectedClip && applyColorGrade(selectedClip, colorAdjustments)}
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Apply Color Grade
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      {selectedClip && !showColorGrader && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 md:bg-black/90 flex flex-col md:items-center md:justify-center md:p-4 backdrop-blur-sm"
          onClick={() => setSelectedClip(null)}
        >
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <button onClick={() => setSelectedClip(null)} className="flex items-center gap-2 text-slate-300">
              <ChevronLeft className="w-6 h-6" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); deleteClip(selectedClip.id); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete clip">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setSelectedClip(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Close preview">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 md:flex-none md:bg-slate-900 md:rounded-3xl md:w-full md:max-w-4xl md:max-h-[90vh] overflow-y-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center p-6 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-xl text-white">{selectedClip.custom_title || selectedClip.title}</h3>
                <span className="text-yellow-400 text-sm flex items-center gap-1 mt-1">
                  <Zap className="w-4 h-4" /> Score: {calculateViralScore(selectedClip).score}/100
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setManualEditing(selectedClip)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Manual Edit">
                  <Scissors className="w-5 h-5" />
                </button>
                <button onClick={(e) => { deleteClip(selectedClip.id, e); setSelectedClip(null); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete clip">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedClip(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Close preview">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Video Player */}
              <div className="aspect-[9/16] md:aspect-video max-h-[60vh] md:max-h-[50vh] bg-black rounded-2xl overflow-hidden relative mx-auto w-full md:w-auto">
                {videoLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-2" />
                    <p className="text-slate-300 text-sm">Loading...</p>
                  </div>
                )}
                
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                    <p className="text-red-400 font-medium mb-2">Failed to load</p>
                    <Button onClick={() => { setVideoError(null); setVideoLoading(true); }} variant="secondary" size="sm">
                      Retry
                    </Button>
                  </div>
                )}

                {getVideoUrl(selectedClip) ? (
                  <video 
                    ref={videoRef}
                    key={selectedClip.id}
                    src={getVideoUrl(selectedClip)}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain color-filter-video"
                    onLoadedData={() => { setVideoLoading(false); setVideoError(null); }}
                    onError={() => { setVideoError('Failed'); setVideoLoading(false); }}
                    data-filter-value={selectedClip.color_grade 
                      ? `brightness(${selectedClip.color_grade.brightness}%) contrast(${selectedClip.color_grade.contrast}%) saturate(${selectedClip.color_grade.saturation}%) ${getFilterCSS(selectedClip.color_grade.filter)}` 
                      : 'none'
                    }
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                    <p className="text-slate-400">No video URL</p>
                  </div>
                )}
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  onClick={() => burnCaptions(selectedClip)}
                  disabled={processingCaptions || selectedClip.has_burned_captions}
                  variant={selectedClip.has_burned_captions ? 'secondary' : 'primary'}
                >
                  <Type className="w-4 h-4" />
                  {selectedClip.has_burned_captions ? 'Burned ✓' : 'Burn Captions'}
                </Button>
                
                <Button 
                  onClick={() => setEditingCaptions(selectedClip)}
                  variant="secondary"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Captions
                </Button>
                
                <Button 
                  onClick={() => autoReframe(selectedClip)}
                  disabled={loading || selectedClip.is_reframed}
                  variant={selectedClip.is_reframed ? 'secondary' : 'primary'}
                >
                  <Film className="w-4 h-4" />
                  {selectedClip.is_reframed ? 'Reframed ✓' : 'Auto-Reframe'}
                </Button>

                <Button 
                  onClick={() => setShowColorGrader(true)}
                  variant="secondary"
                >
                  <Palette className="w-4 h-4" />
                  Color Grade
                </Button>
              </div>

              {/* Hashtags Section */}
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-400" />
                    AI Hashtags
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingHashtags(selectedClip)}
                      className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 px-3 py-1.5 bg-purple-500/10 rounded-lg"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button 
                      onClick={() => copyHashtags(selectedClip.custom_hashtags || selectedClip.hashtags || generateHashtags(selectedClip.title, selectedClip.virality_score))}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-lg"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedClip.custom_hashtags || selectedClip.hashtags || generateHashtags(selectedClip.title, selectedClip.virality_score)).map((tag, i) => (
                    <span key={i} className="text-sm px-4 py-2 bg-slate-800 text-purple-300 rounded-full border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share & Export */}
              <div className="grid grid-cols-3 gap-3">
                <Button onClick={() => shareClip('facebook', selectedClip)} variant="secondary">
                  <Facebook className="w-5 h-5 text-blue-400" />
                  <span className="hidden sm:inline">Facebook</span>
                </Button>
                <Button onClick={() => shareClip('tiktok', selectedClip)} variant="secondary">
                  <Music2 className="w-5 h-5 text-cyan-400" />
                  <span className="hidden sm:inline">TikTok</span>
                </Button>
                <Button onClick={() => shareClip('youtube', selectedClip)} variant="secondary">
                  <Youtube className="w-5 h-5 text-red-400" />
                  <span className="hidden sm:inline">YouTube</span>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['9:16', '1:1', '16:9'].map((format) => (
                  <Button 
                    key={format}
                    onClick={() => handleExport(selectedClip, format)}
                    disabled={exporting}
                    variant="ghost"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {format}
                  </Button>
                ))}
              </div>

              {(selectedClip.edited_captions || selectedClip.captions)?.length > 0 && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold mb-3 text-sm text-slate-300">Captions</h4>
                  {(selectedClip.edited_captions || selectedClip.captions).map((cap, i) => (
                    <div key={i} className="text-sm text-slate-400 mb-2 font-mono flex gap-3">
                      <span className="text-purple-400">[{formatTime(cap.startTime)}]</span>
                      <span>{cap.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trending Hashtags Modal */}
      <Modal isOpen={showTrendingHashtags} onClose={() => setShowTrendingHashtags(false)} title="Trending Hashtags">
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {['trending', 'gaming', 'tech', 'fitness', 'food', 'motivation', 'funny', 'beauty', 'travel'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm capitalize transition-all ${
                  selectedCategory === cat 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {getTrendingHashtags(selectedCategory).map((tag, i) => (
              <button
                key={i}
                onClick={() => {
                  navigator.clipboard.writeText(tag);
                  alert(`Copied ${tag}!`);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
              >
                <Hash className="w-4 h-4 text-purple-400" />
                {tag}
                <Copy className="w-3 h-3 text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* URL Import Modal */}
      <Modal isOpen={showUrlImport} onClose={() => setShowUrlImport(false)} title="Import from URL">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Paste a YouTube, Instagram, or TikTok URL to import and analyze.
          </p>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <Button
            onClick={handleUrlImport}
            disabled={importingUrl || !urlInput}
            className="w-full"
          >
            {importingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Import Video
          </Button>
        </div>
      </Modal>
      
      {/* Footer target for skip links */}
      <footer id="footer" tabIndex={-1} className="sr-only">
        Footer content
      </footer>
    </div>
  );
}


