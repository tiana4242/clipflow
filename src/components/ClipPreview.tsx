import React, { useState, useEffect } from 'react'

import { Download, Share2, Trash2 } from 'lucide-react'

import type { Clip } from '../types'

import { ShareModal } from './ShareModal'

import { supabase } from '../lib/supabase'
import { API_CONFIG } from '../config/api'

const API_URL = API_CONFIG.getCurrentUrl()


interface ClipPreviewProps {

  clip: Clip

  onDelete?: (id: string) => void

}



export const ClipPreview: React.FC<ClipPreviewProps> = ({ clip, onDelete }) => {

  const [showShare, setShowShare] = useState(false)

  const [videoUrl, setVideoUrl] = useState<string>('')



  useEffect(() => {

    const fetchPreviewUrl = async () => {

      try {

        const token = (await supabase.auth.getSession()).data.session?.access_token;

        const response = await fetch(`${API_URL}/api/clips/${clip.id}/preview`, {

          headers: { 'Authorization': `Bearer ${token}` }

        });

        

        if (response.ok) {

          const blob = await response.blob();

          const url = URL.createObjectURL(blob);

          setVideoUrl(url);

          

          // Cleanup on unmount

          return () => URL.revokeObjectURL(url);

        }

      } catch (error) {

        console.error('Failed to fetch preview:', error);

      }

    };



    fetchPreviewUrl();

  }, [clip.id]);



  const formatTime = (seconds: number) => {

    const mins = Math.floor(seconds / 60)

    const secs = Math.floor(seconds % 60)

    return `${mins}:${secs.toString().padStart(2, '0')}`

  }



  return (

    <>

      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">

        <div className="aspect-video bg-black relative">

          <video

            src={videoUrl}

            className="w-full h-full object-cover"

            controls

            preload="metadata"

          />

        </div>

        

        <div className="p-4">

          <h4 className="font-medium mb-2 line-clamp-1">{clip.title}</h4>

          <div className="flex items-center justify-between text-sm text-slate-400">

            <span>

              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}

            </span>

            <span>{clip.duration.toFixed(1)}s</span>

          </div>

          

          <div className="flex items-center gap-2 mt-4">

            <button

              onClick={() => setShowShare(true)}

              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"

            >

              <Share2 className="w-4 h-4" />

              Share

            </button>

            <button

              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"

            >

              <Download className="w-4 h-4" />

              Download

            </button>

            {onDelete && (

              <button
                onClick={() => onDelete(clip.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                aria-label="Delete clip"
                title="Delete clip"
              >

                <Trash2 className="w-4 h-4" />

              </button>

            )}

          </div>

        </div>

      </div>



      {showShare && <ShareModal clip={clip} onClose={() => setShowShare(false)} />}

    </>

  )

}