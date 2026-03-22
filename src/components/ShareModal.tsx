import { useState } from 'react'
import { Share2, Download, Trash2, Link2, Check, Facebook, Youtube, Music2 } from 'lucide-react'
import type { Clip } from '../types'

interface ClipCardProps {
  clip: Clip
  onDelete: (id: string) => void
}

export function ClipCard({ clip, onDelete }: ClipCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)

  // Placeholder functions until useSocialShare hook is created
  const shareToFacebook = ({ url }: any) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const prepareForTikTok = ({ title, hashtags }: any) => {
    const caption = `${title}\n\n${hashtags.map((tag: string) => `#${tag}`).join(' ')}`
    navigator.clipboard.writeText(caption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 3000)
    window.open('https://www.tiktok.com/upload', '_blank')
  }

  const uploadToYouTube = () => {
    window.open('https://studio.youtube.com/', '_blank')
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadClip = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const shareUrl = `${window.location.origin}/clip/${clip.id}`

  // Generate viral hashtags based on clip tags or defaults
  const hashtags = ['Viral', 'Shorts', 'Trending', 'Content']

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group">
      <div className="relative aspect-[9/16] bg-black">
        {clip.videoUrl ? (
          <video
            src={clip.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 bg-slate-800">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
              <Share2 className="w-8 h-8" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
          {clip.duration.toFixed(1)}s
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-1">{clip.title}</h3>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {new Date(clip.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
                title="Share clip"
                aria-label="Share clip"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-10">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Share to Platform
                  </div>

                  {/* Facebook */}
                  <button
                    onClick={() => {
                      shareToFacebook({
                        url: shareUrl,
                        title: clip.title,
                        text: `Check out this clip: ${clip.title}`,
                      })
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-sm">Facebook</span>
                      <span className="text-xs text-slate-500">Share to feed</span>
                    </div>
                  </button>

                  {/* TikTok */}
                  <button
                    onClick={() => {
                      prepareForTikTok({
                        url: shareUrl,
                        title: clip.title,
                        text: clip.title,
                        hashtags,
                      })
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center">
                      <Music2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-sm">TikTok</span>
                      <span className="text-xs text-slate-500">
                        {copiedCaption ? 'Caption copied! ✓' : 'Copy caption & open'}
                      </span>
                    </div>
                  </button>

                  {/* YouTube */}
                  <button
                    onClick={() => {
                      uploadToYouTube()
                      downloadClip(clip.videoUrl, `youtube-short-${clip.id}.mp4`)
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
                      <Youtube className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-sm">YouTube Shorts</span>
                      <span className="text-xs text-slate-500">Download & open Studio</span>
                    </div>
                  </button>

                  <div className="border-t border-slate-700 my-1"></div>

                  {/* Copy Link */}
                  <button
                    onClick={() => {
                      copyLink(shareUrl)
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-300 text-sm"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {copied ? 'Copied to clipboard!' : 'Copy Link'}
                  </button>

                  {/* Download */}
                  <button
                    onClick={() => {
                      downloadClip(clip.videoUrl, `clipflow-${clip.title}.mp4`)
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-slate-300 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download MP4
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onDelete(clip.id)}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Delete clip"
              aria-label="Delete clip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}