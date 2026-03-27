import React, { useCallback } from 'react'
import { Film } from 'lucide-react'

interface VideoUploaderProps {
  onUpload: (file: File) => Promise<boolean>
  isProcessing: boolean
}

// Check for FFmpeg WASM in cache before processing
async function processVideoOffline(videoFile: File) {
  const cache = await caches.open('ffmpeg-core');
  const ffmpegWasm = await cache.match('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm');
  
  if (!ffmpegWasm) {
    // Show offline warning if WASM not cached
    console.warn('Video processing requires initial online setup. Please connect to internet once to cache processing engine.');
    return;
  }
  
  // Proceed with processing using cached WASM
  // This would integrate with your actual FFmpeg processing logic
  return { success: true, message: 'Offline processing ready' };
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  isProcessing,
}) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) onUpload(file)
    },
    [onUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onUpload(file)
    },
    [onUpload]
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-900/50"
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        id="video-upload"
      />
      <label htmlFor="video-upload" className="cursor-pointer block">
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
            <p className="text-slate-400">Processing video...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-800 rounded-full">
                <Film className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload your video</h3>
            <p className="text-slate-400 mb-4">
              Drag and drop or click to select
            </p>
            <p className="text-sm text-slate-500">
              Supports MP4, MOV, WebM up to 100MB
            </p>
          </>
        )}
      </label>
    </div>
  )
}