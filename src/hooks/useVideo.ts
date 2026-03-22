import { useState, useCallback } from 'react'
import type { VideoFile } from '../types'

export function useVideo() {
  const [video, setVideo] = useState<VideoFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const uploadVideo = useCallback(async (file: File): Promise<boolean> => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file')
      return false
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size too large. Max 100MB.')
      return false
    }

    setIsProcessing(true)

    try {
      const url = URL.createObjectURL(file)
      
      // Get video duration
      const videoElement = document.createElement('video')
      videoElement.preload = 'metadata'
      
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = resolve
        videoElement.onerror = reject
        videoElement.src = url
      })

      setVideo({
        file,
        url,
        duration: videoElement.duration,
      })
      
      setIsProcessing(false)
      return true
    } catch (error) {
      console.error('Error loading video:', error)
      setIsProcessing(false)
      return false
    }
  }, [])

  const clearVideo = useCallback(() => {
    if (video?.url) {
      URL.revokeObjectURL(video.url)
    }
    setVideo(null)
  }, [video])

  return {
    video,
    isProcessing,
    uploadVideo,
    clearVideo,
  }
}