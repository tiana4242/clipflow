import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Clip } from '../types'

export function useClips() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const uploadVideo = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const createClip = async (
    videoUrl: string, 
    start: number, 
    end: number, 
    title: string,
    userId: string
  ): Promise<Clip | null> => {
    setProcessing(true)
    try {
      const duration = end - start
      
      // Validate 15-30s requirement
      if (duration < 15 || duration > 30) {
        throw new Error('Clip must be between 15-30 seconds')
      }

      // Call backend to process clip
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/process-clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          start,
          end,
          title,
          userId
        })
      })

      if (!response.ok) throw new Error('Processing failed')
      
      const result = await response.json()
      
      // Save to database
      const { data, error } = await supabase
        .from('clips')
        .insert({
          user_id: userId,
          title,
          video_url: result.clipUrl,
          thumbnail_url: result.thumbnailUrl,
          start_time: start,
          end_time: end,
          duration
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Processing error:', error)
      return null
    } finally {
      setProcessing(false)
    }
  }

  const getUserClips = async (userId: string): Promise<Clip[]> => {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Fetch error:', error)
      return []
    }
    return data || []
  }

  const deleteClip = async (clipId: string) => {
    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId)
    
    if (error) throw error
  }

  return { 
    uploadVideo, 
    createClip, 
    getUserClips, 
    deleteClip, 
    uploading, 
    processing 
  }
}