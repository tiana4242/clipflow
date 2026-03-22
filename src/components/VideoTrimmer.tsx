import React, { useState, useRef, useEffect } from 'react'
import { Scissors, Play, Pause } from 'lucide-react'

interface VideoTrimmerProps {
  videoUrl: string
  duration: number
  onCreateClip: (start: number, end: number) => void
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoUrl,
  duration,
  onCreateClip,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(Math.min(30, duration))
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    video.addEventListener('timeupdate', updateTime)
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleCreateClip = () => {
    const clipDuration = endTime - startTime
    if (clipDuration >= 15 && clipDuration <= 30) {
      onCreateClip(startTime, endTime)
    } else {
      alert('Clip must be between 15-30 seconds')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[500px]"
          onClick={togglePlay}
        />
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-4 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(endTime)}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="start-time" className="text-sm text-slate-400 mb-2 block">
              Start Time: {formatTime(startTime)}
            </label>
            <input
              id="start-time"
              type="range"
              min={0}
              max={duration - 15}
              step={0.1}
              value={startTime}
              onChange={(e) => {
                const newStart = parseFloat(e.target.value)
                setStartTime(newStart)
                if (endTime - newStart > 30) {
                  setEndTime(newStart + 30)
                } else if (endTime - newStart < 15) {
                  setEndTime(newStart + 15)
                }
              }}
              className="w-full accent-blue-500"
              aria-label="Start time slider"
              title="Adjust start time of the clip"
            />
          </div>

          <div>
            <label htmlFor="end-time" className="text-sm text-slate-400 mb-2 block">
              End Time: {formatTime(endTime)}
            </label>
            <input
              id="end-time"
              type="range"
              min={startTime + 15}
              max={Math.min(startTime + 30, duration)}
              step={0.1}
              value={endTime}
              onChange={(e) => setEndTime(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
              aria-label="End time slider"
              title="Adjust end time of the clip"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-slate-400">
            Duration: {(endTime - startTime).toFixed(1)}s (15-30s)
          </span>
          <button
            onClick={handleCreateClip}
            className="btn-primary flex items-center gap-2"
          >
            <Scissors className="w-4 h-4" />
            Create Clip
          </button>
        </div>
      </div>
    </div>
  )
}