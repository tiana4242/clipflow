import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const VideoUploader = lazy(() => import('./VideoUploader'));
const VideoTrimmer = lazy(() => import('./VideoTrimmer'));
const ClipPreview = lazy(() => import('./ClipPreview'));
const ShareModal = lazy(() => import('./ShareModal'));
const TitleSuggestions = lazy(() => import('./TitleSuggestions'));

export const LazyVideoUploader = () => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
    <VideoUploader />
  </Suspense>
);

export const LazyVideoTrimmer = (props: any) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
    <VideoTrimmer {...props} />
  </Suspense>
);

export const LazyClipPreview = (props: any) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
    <ClipPreview {...props} />
  </Suspense>
);

export const LazyShareModal = (props: any) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
    <ShareModal {...props} />
  </Suspense>
);

export const LazyTitleSuggestions = (props: any) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
    <TitleSuggestions {...props} />
  </Suspense>
);
