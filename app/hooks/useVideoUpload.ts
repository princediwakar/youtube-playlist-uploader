'use client'

import { useState, useCallback, useRef } from 'react'
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
  retryCount?: number
}

export interface UploadStats {
  totalBytes: number
  uploadedBytes: number
  uploadSpeed: number
  estimatedTimeRemaining: number
  startTime: number
}

export function useVideoUpload() {
  const { data: session } = useSession()

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentUpload, setCurrentUpload] = useState<string | null>(null)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)

  // Refs for upload control
  const isPausedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const statsRef = useRef<UploadStats | null>(null)

  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 5000, 15000] // Exponential backoff

  // Pause upload
  const pauseUpload = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
  }, [])

  // Resume upload
  const resumeUpload = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    isPausedRef.current = false
    statsRef.current = null
    setIsPaused(false)
    setIsUploading(false)
    setUploadQueue([])
    setCurrentUpload(null)
    setUploadStats(null)
    setQuotaWarning(null)
  }, [])

  // Retry a failed upload with exponential backoff
  const retryWithBackoff = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        // Don't retry on certain errors
        if (error instanceof Error) {
          // Quota errors - don't retry
          if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
            throw error
          }
          // Auth errors - don't retry
          if (error.message.includes('unauthorized') || error.message.includes('expired')) {
            throw error
          }
          // User aborted - don't retry
          if (error.name === 'AbortError') {
            throw error
          }
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }, [])

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
      // Use pre-generated category from metadata (contains correct category for both audio and video)
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
      formData.append('isShort', (isVideoFile(video) ? (video.isShort || false) : false).toString())
      formData.append('duration', (video.duration || 0).toString())
      formData.append('aspectRatio', (isVideoFile(video) ? (video.aspectRatio || 1.78) : 1.78).toString())
      formData.append('useAiAnalysis', (uploadSettings.useAiAnalysis || false).toString())
      formData.append('titleFormat', uploadSettings.titleFormat || 'original')
      formData.append('customTitlePrefix', uploadSettings.customTitlePrefix || '')
      formData.append('customTitleSuffix', uploadSettings.customTitleSuffix || '')

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

  // Upload multiple videos with concurrency control and retry logic
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

    // Initialize stats
    const startTime = Date.now()
    const totalBytes = queue.reduce((sum, item) => sum + (item.video.file?.size || 0), 0)
    statsRef.current = { totalBytes, uploadedBytes: 0, uploadSpeed: 0, estimatedTimeRemaining: 0, startTime }
    setUploadStats(statsRef.current)
    abortControllerRef.current = new AbortController()

    setIsUploading(true)
    setIsPaused(false)
    isPausedRef.current = false
    setUploadQueue(queue)

    const concurrencyLimit = 1
    const chunks = []
    for (let i = 0; i < queue.length; i += concurrencyLimit) {
      chunks.push(queue.slice(i, i + concurrencyLimit))
    }

    let completedCount = 0
    let failedCount = 0
    const failedItems: UploadQueueItem[] = []

    try {
      for (const chunk of chunks) {
        // Check for pause
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Check for abort
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Upload cancelled')
          break
        }

        const uploadPromises = chunk.map(async (item) => {
          const { video, metadata, position } = item
          const retryCount = item.retryCount || 0

          try {
            // Use retry logic for uploads
            const result = await retryWithBackoff(async () => {
              // Check pause before retry
              while (isPausedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
              return uploadVideo(video, metadata, uploadSettings, playlistId, position)
            }, MAX_RETRIES - retryCount)

            completedCount++
            updateStats(completedCount, queue.length, startTime)
            if (onProgress) {
              onProgress(completedCount, queue.length)
            }
            if (onVideoComplete) {
              onVideoComplete(video, result)
            }
            return result
          } catch (error) {
            failedCount++
            const errorMessage = error instanceof Error ? error.message : 'Upload failed'

            // Check for quota errors
            if (errorMessage.includes('quota') || errorMessage.includes('QUOTA')) {
              setQuotaWarning('YouTube API quota exceeded. Consider reducing batch size.')
              console.warn('Quota warning:', errorMessage)
            }

            if (onVideoError) {
              onVideoError(video, error as Error)
            }

            // Add to failed items for retry
            failedItems.push({ ...item, retryCount: retryCount + 1 })

            return null
          }
        })

        await Promise.all(uploadPromises)
      }

      // Retry failed items once more
      if (failedItems.length > 0 && !abortControllerRef.current?.signal.aborted) {
        console.log(`Retrying ${failedItems.length} failed uploads...`)
        for (const item of failedItems) {
          if (isPausedRef.current) {
            while (isPausedRef.current) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }

          try {
            const result = await uploadVideo(item.video, item.metadata, uploadSettings, playlistId, item.position)
            completedCount++
            if (onVideoComplete) {
              onVideoComplete(item.video, result)
            }
          } catch (error) {
            console.error(`Final retry failed for ${item.video.name}:`, error)
          }
        }
      }

    } finally {
      setIsUploading(false)
      setIsPaused(false)
      setUploadQueue([])
      setCurrentUpload(null)
      setUploadStats(null)
    }
  }, [session?.accessToken, uploadVideo, retryWithBackoff])

  // Helper to update stats
  const updateStats = (completed: number, total: number, startTime: number) => {
    if (!statsRef.current) return

    const elapsed = (Date.now() - startTime) / 1000
    const progress = completed / total
    const estimatedTotal = elapsed / progress
    const remaining = estimatedTotal - elapsed

    statsRef.current = {
      ...statsRef.current,
      uploadedBytes: completed,
      uploadSpeed: completed / elapsed,
      estimatedTimeRemaining: remaining
    }
    setUploadStats({ ...statsRef.current })
  }

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
    }
  }, [session?.accessToken])

  return {
    // State
    isUploading,
    isPaused,
    currentUpload,
    uploadQueue,
    uploadStats,
    quotaWarning,

    // Functions
    uploadVideo,
    uploadVideos,
    addNavigationLinks,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearQuotaWarning: () => setQuotaWarning(null)
  }
}