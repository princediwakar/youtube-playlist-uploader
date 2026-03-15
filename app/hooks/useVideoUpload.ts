'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { VideoFile, UploadSettings } from '@/app/types/video'

export interface UploadQueueItem {
  video: VideoFile
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

  // Upload a single video
  const uploadVideo = useCallback(async (
    video: VideoFile,
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
      formData.append('category', metadata.category)
      if (playlistId) {
        formData.append('playlistId', playlistId)
        if (position !== undefined) {
          formData.append('position', position.toString())
        }
      }
      formData.append('privacyStatus', uploadSettings.privacyStatus)
      formData.append('madeForKids', uploadSettings.madeForKids.toString())
      formData.append('uploadMode', uploadSettings.uploadMode)
      formData.append('isShort', (video.isShort || false).toString())
      formData.append('duration', (video.duration || 0).toString())
      formData.append('aspectRatio', (video.aspectRatio || 1.78).toString())

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
    onVideoComplete?: (video: VideoFile, result: any) => void,
    onVideoError?: (video: VideoFile, error: Error) => void
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

    try {
      for (const chunk of chunks) {
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
    position: number
  ) => {
    if (!session?.accessToken) return

    try {
      await fetch('/api/youtube/add-navigation-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          playlistId,
          position
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