'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MediaFile, UploadSettings, isVideoFile, isAudioFile } from '@/app/types/video'
import { generateAudioFrame } from '@/app/utils/audioHelpers'

export interface UploadQueueItem {
  video: MediaFile
  metadata: {
    title: string
    description: string
    tags: string[]
    category: string
  }
  position: number
}

export function useVideoUpload() {
  const { data: session } = useSession()

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [currentUpload, setCurrentUpload] = useState<string | null>(null)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  // Upload a single video
  const uploadVideo = useCallback(async (
    video: MediaFile,
    metadata: {
      title: string
      description: string
      tags: string[]
      category: string
    },
    uploadSettings: UploadSettings,
    playlistId?: string,
    position?: number
  ): Promise<{ videoId: string; url: string }> => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setCurrentUpload(video.name)

    try {
      // Upload video with pre-processed metadata
      const formData = new FormData()
      formData.append('video', video.file)
      formData.append('title', metadata.title)
      formData.append('description', metadata.description)
      formData.append('tags', JSON.stringify(metadata.tags))
      // Use audio category for audio files, generic category for video files
      formData.append('category', isAudioFile(video) ? uploadSettings.audioCategory : metadata.category)
      if (playlistId) {
        formData.append('playlistId', playlistId)
        if (position !== undefined) {
          formData.append('position', position.toString())
        }
      }
      formData.append('privacyStatus', uploadSettings.privacyStatus)
      formData.append('madeForKids', uploadSettings.madeForKids.toString())
      formData.append('uploadMode', uploadSettings.uploadMode)
      formData.append('isShort', (isVideoFile(video) ? (video.isShort || false) : false).toString())
      formData.append('duration', (video.duration || 0).toString())
      formData.append('aspectRatio', (isVideoFile(video) ? (video.aspectRatio || 1.78) : 1.78).toString())
      formData.append('useAiAnalysis', (uploadSettings.useAiAnalysis || false).toString())

      // For audio files, generate thumbnail based on settings
      if (isAudioFile(video)) {
        let thumbnailDataUrl: string | undefined

        try {
          // Generate enhanced audio frame if setting enabled and waveform available
          if (uploadSettings.generateAudioFrames && video.waveform && video.waveform.length > 0) {
            // Generate enhanced audio frame with title, description, and metadata
            thumbnailDataUrl = generateAudioFrame(
              video.waveform,
              metadata.title,
              metadata.description,
              {
                width: 1280,
                height: 720,
                backgroundColor: '#0f0f0f',
                waveformColor: '#ff3333',
                textColor: '#ffffff',
                showMetadata: true,
                metadata: {
                  artist: video.artist,
                  album: video.album,
                  duration: video.duration,
                  format: video.audioFormat,
                }
              }
            )
            console.log('Generated enhanced audio frame with waveform')
          } else if (video.audioThumbnail) {
            // Use existing audioThumbnail (basic waveform)
            thumbnailDataUrl = video.audioThumbnail
            console.log('Using existing audio thumbnail')
          }

          if (thumbnailDataUrl) {
            const thumbnailFile = dataURLtoFile(thumbnailDataUrl, 'audio-thumbnail.jpg')
            formData.append('thumbnail', thumbnailFile)
            console.log('Added audio thumbnail to upload form')
          } else {
            console.log('No audio thumbnail available, backend will generate simple one')
          }
        } catch (thumbnailError) {
          console.warn('Failed to generate or add audio thumbnail:', thumbnailError)
          // Continue without thumbnail, backend will generate one
        }
      }

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Upload failed')
      }

      const result = await response.json()
      setCurrentUpload(null)
      return result
    } catch (error) {
      setCurrentUpload(null)
      throw error
    }
  }, [session?.accessToken])

  // Upload multiple videos with concurrency control
  const uploadVideos = useCallback(async (
    queue: UploadQueueItem[],
    uploadSettings: UploadSettings,
    playlistId?: string,
    onProgress?: (completed: number, total: number) => void,
    onVideoComplete?: (video: MediaFile, result: any) => void,
    onVideoError?: (video: MediaFile, error: Error) => void
  ) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsUploading(true)
    setUploadQueue(queue)

    const concurrencyLimit = 3
    const chunks = []
    for (let i = 0; i < queue.length; i += concurrencyLimit) {
      chunks.push(queue.slice(i, i + concurrencyLimit))
    }

    let completedCount = 0
    let hasError = false

    try {
      for (const chunk of chunks) {
        if (hasError) break
        
        const uploadPromises = chunk.map(async ({ video, metadata, position }) => {
          try {
            const result = await uploadVideo(video, metadata, uploadSettings, playlistId, position)
            completedCount++
            if (onProgress) {
              onProgress(completedCount, queue.length)
            }
            if (onVideoComplete) {
              onVideoComplete(video, result)
            }
            return result
          } catch (error) {
            if (onVideoError) {
              onVideoError(video, error as Error)
            }
            hasError = true
            throw error
          }
        })

        await Promise.all(uploadPromises)
      }
    } finally {
      setIsUploading(false)
      setUploadQueue([])
      setCurrentUpload(null)
    }
  }, [session?.accessToken, uploadVideo])

  // Add navigation links to uploaded video
  const addNavigationLinks = useCallback(async (
    videoId: string,
    playlistId: string,
    position: number,
    title: string
  ) => {
    if (!session?.accessToken) return

    try {
      await fetch('/api/youtube/add-navigation-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          playlistId,
          position,
          title
        })
      })
    } catch (error) {
      console.error('Navigation link failed for video:', videoId, error)
      throw error
    }
  }, [session?.accessToken])

  return {
    // State
    isUploading,
    currentUpload,
    uploadQueue,

    // Functions
    uploadVideo,
    uploadVideos,
    addNavigationLinks
  }
}