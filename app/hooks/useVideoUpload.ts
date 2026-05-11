'use client'

import { useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MediaFile, UploadSettings, isVideoFile, isAudioFile } from '@/app/types/video'
import type { BaseMediaFile } from '@/app/types/media'
import { generateAudioFrame } from '@/app/utils/audioHelpers'
import { uploadToYouTubeResumable, uploadBlobToYouTubeResumable, ChunkedUploader } from '@/app/utils/chunkedUploader'
import { completeUpload } from '@/app/actions/playlist'
import { addNavigationLinksSingle } from '@/app/actions/navigation'
import { recordUpload } from '@/app/actions/history'
import { useAppStore } from '@/app/store'
import { useFfmpegEngine, type EngineOptions } from '@/app/hooks/useFfmpegEngine'

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

  const isUploading = useAppStore((s) => s.isUploading)
  const isPaused = useAppStore((s) => s.isPaused)
  const currentUpload = useAppStore((s) => s.currentUpload)
  const uploadQueue = useAppStore((s) => s.uploadQueue)
  const uploadStats = useAppStore((s) => s.uploadStats)
  const quotaWarning = useAppStore((s) => s.quotaWarning)
  const setIsUploading = useAppStore((s) => s.setIsUploading)
  const setIsPaused = useAppStore((s) => s.setIsPaused)
  const setCurrentUpload = useAppStore((s) => s.setCurrentUpload)
  const setUploadQueue = useAppStore((s) => s.setUploadQueue)
  const setUploadStats = useAppStore((s) => s.setUploadStats)
  const setQuotaWarning = useAppStore((s) => s.setQuotaWarning)

  const isPausedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const statsRef = useRef<UploadStats | null>(null)
  const ffmpegConvert = useFfmpegEngine()

  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 5000, 15000]

  const pauseUpload = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
  }, [setIsPaused])

  const resumeUpload = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
  }, [setIsPaused])

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
  }, [setIsPaused, setIsUploading, setUploadQueue, setCurrentUpload, setUploadStats])

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

        if (error instanceof Error) {
          if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quotaExceeded')) {
            throw error
          }
          if (error.message.includes('unauthorized') || error.message.includes('expired')) {
            throw error
          }
          if (error.name === 'AbortError') {
            throw error
          }
          if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('Request Entity')) {
            throw error
          }
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }, [])

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

  const getVideoProps = (video: MediaFile): { isShort: boolean; aspectRatio: number } => {
    if (video.mediaType === 'video') {
      return { isShort: video.isShort || false, aspectRatio: video.aspectRatio || 1.78 }
    }
    return { isShort: false, aspectRatio: 1.78 }
  }

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
    position?: number,
    onProgress?: (progress: { percent: number; bytesUploaded: number; totalBytes: number }) => void
  ): Promise<{ videoId: string; url: string }> => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setCurrentUpload(video.name)

    try {
      const isGooglePhotos = !!(video as BaseMediaFile).googlePhotosMediaId
      const videoProps = getVideoProps(video)

      if (isVideoFile(video)) {
        try {
          let videoId: string

          if (isGooglePhotos) {
            const googlePhotosVideo = video as BaseMediaFile
            const googlePhotosFetchedAt = (video as BaseMediaFile).googlePhotosFetchedAt
              ? new Date((video as BaseMediaFile).googlePhotosFetchedAt!).getTime()
              : undefined
            const uploader = new ChunkedUploader(
              {
                type: 'googlePhotos',
                size: googlePhotosVideo.file?.size || 0,
                googlePhotosMediaId: googlePhotosVideo.googlePhotosMediaId!,
                googlePhotosBaseUrl: googlePhotosVideo.googlePhotosBaseUrl!,
                googlePhotosFetchedAt,
                accessToken: session.accessToken,
              },
              {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: metadata.category,
                privacyStatus: uploadSettings.privacyStatus,
                madeForKids: uploadSettings.madeForKids,
                isShort: videoProps.isShort,
              },
              null,
              onProgress,
              abortControllerRef.current?.signal
            )
            videoId = await uploader.upload()
          } else {
            videoId = await uploadToYouTubeResumable(
              video.file,
              {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: metadata.category,
                privacyStatus: uploadSettings.privacyStatus,
                madeForKids: uploadSettings.madeForKids,
                isShort: videoProps.isShort,
              },
              onProgress,
              abortControllerRef.current?.signal
            )
          }

          setCurrentUpload(null)

          if (uploadSettings.uploadMode === 'playlist' && playlistId) {
            completeUpload(videoId, playlistId, position).catch(err => console.error('Complete error:', err))
          }

          recordUpload({
            videoId,
            title: metadata.title,
            playlistId,
            fileName: video.name,
            fileSize: video.file?.size || 0,
            mediaType: video.mediaType
          }).catch(err => console.error('Record upload error:', err))

          return { videoId, url: `https://www.youtube.com/watch?v=${videoId}` }
        } catch (error) {
          setCurrentUpload(null)
          throw error
        }
      }

      const { isShort, aspectRatio } = getVideoProps(video)

      if (isAudioFile(video)) {
        let videoBlob: Blob | null = null

        if (ffmpegConvert.ready) {
          try {
            const engineOpts: EngineOptions = {
              width: 1280,
              height: 720,
              waveformColor: '0xff3333',
              backgroundColor: '0x0f0f0f',
              textColor: '0xffffff',
              fontSize: 28,
              showMetadata: true,
              fps: 25,
              waveMode: 'cline',
              metadata: {
                title: metadata.title,
              },
            }
            videoBlob = await ffmpegConvert.convert(video.file, engineOpts)
          } catch (engineErr) {
            console.warn('[upload] FFmpeg engine failed, falling back to server route:', engineErr)
          }
        }

        if (videoBlob) {
          const videoId = await uploadBlobToYouTubeResumable(
            videoBlob,
            video.name.replace(/\.[^/.]+$/, '') + '.mp4',
            {
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              categoryId: metadata.category,
              privacyStatus: uploadSettings.privacyStatus,
              madeForKids: uploadSettings.madeForKids,
              isShort: false,
            },
            onProgress,
            abortControllerRef.current?.signal
          )

          setCurrentUpload(null)

          if (uploadSettings.uploadMode === 'playlist' && playlistId) {
            completeUpload(videoId, playlistId, position).catch(err => console.error('Complete error:', err))
          }

          recordUpload({
            videoId,
            title: metadata.title,
            playlistId,
            fileName: video.name,
            fileSize: videoBlob.size,
            mediaType: 'audio'
          }).catch(err => console.error('Record upload error:', err))

          return { videoId, url: `https://www.youtube.com/watch?v=${videoId}` }
        }
      }

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
      formData.append('isShort', isShort.toString())
      formData.append('duration', (video.duration || 0).toString())
      formData.append('aspectRatio', aspectRatio.toString())
      formData.append('titleFormat', uploadSettings.titleFormat || 'original')
      formData.append('customTitlePrefix', uploadSettings.customTitlePrefix || '')
      formData.append('customTitleSuffix', uploadSettings.customTitleSuffix || '')

      if ((video as BaseMediaFile).googlePhotosMediaId) {
        formData.append('googlePhotosMediaId', (video as BaseMediaFile).googlePhotosMediaId!)
        formData.append('googlePhotosBaseUrl', (video as BaseMediaFile).googlePhotosBaseUrl!)
      }

      if (isAudioFile(video)) {
        let thumbnailDataUrl: string | undefined

        try {
          if (uploadSettings.generateAudioFrames && video.waveform && video.waveform.length > 0) {
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
          } else if (video.audioThumbnail) {
            thumbnailDataUrl = video.audioThumbnail
          }

          if (thumbnailDataUrl) {
            const thumbnailFile = dataURLtoFile(thumbnailDataUrl, 'audio-thumbnail.jpg')
            formData.append('thumbnail', thumbnailFile)
          }
        } catch (thumbnailError) {
          console.warn('Failed to generate audio thumbnail:', thumbnailError)
        }
      }

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current?.signal
      })

      if (!response.ok) {
        let errorMessage = `Upload failed (HTTP ${response.status})`
        try {
          const error = await response.json()
          errorMessage = error.details || error.error || errorMessage
        } catch {
          const text = await response.text().catch(() => '')
          if (text) errorMessage = text
        }
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent || '')
        if (isIOS && response.status === 413) {
          errorMessage += '. The file may be too large for mobile upload. Try a smaller file or use a desktop browser.'
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setCurrentUpload(null)

      if (result.videoId) {
        recordUpload({
          videoId: result.videoId,
          title: metadata.title,
          playlistId,
          fileName: video.name,
          fileSize: video.file?.size || 0,
          mediaType: video.mediaType
        }).catch(err => console.error('Record upload error:', err))
      }

      return result
    } catch (error) {
      setCurrentUpload(null)
      throw error
    }
  }, [session?.accessToken, setCurrentUpload])

  const updateStats = useCallback((completed: number, uploadedBytes: number, total: number, startTime: number) => {
    if (!statsRef.current) return

    const elapsed = (Date.now() - startTime) / 1000
    const progress = total > 0 ? completed / total : 0
    const estimatedTotal = progress > 0 ? elapsed / progress : 0
    const remaining = Math.max(0, estimatedTotal - elapsed)

    statsRef.current = {
      ...statsRef.current,
      uploadedBytes,
      uploadSpeed: elapsed > 0 ? uploadedBytes / elapsed : 0,
      estimatedTimeRemaining: remaining
    }
    setUploadStats({ ...statsRef.current })
  }, [setUploadStats])

  const uploadVideos = useCallback(async (
    queue: UploadQueueItem[],
    uploadSettings: UploadSettings,
    playlistId?: string,
    onProgress?: (completed: number, total: number) => void,
    onVideoStart?: (video: MediaFile) => void,
    onVideoProgress?: (video: MediaFile, progress: number) => void,
    onVideoComplete?: (video: MediaFile, result: { videoId: string; url: string }) => void,
    onVideoError?: (video: MediaFile, error: Error) => void
  ) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    const startTime = Date.now()
    const totalBytes = queue.reduce((sum, item) => sum + (item.video.file?.size || 0), 0)
    statsRef.current = { totalBytes, uploadedBytes: 0, uploadSpeed: 0, estimatedTimeRemaining: 0, startTime }
    setUploadStats(statsRef.current)
    abortControllerRef.current = new AbortController()

    setIsUploading(true)
    setIsPaused(false)
    isPausedRef.current = false
    setUploadQueue(queue)

    const concurrencyLimit = 3
    const chunks = []
    for (let i = 0; i < queue.length; i += concurrencyLimit) {
      chunks.push(queue.slice(i, i + concurrencyLimit))
    }

    let completedCount = 0
    let uploadedBytesFromCompleted = 0
    const activeUploadsBytes = new Map<string, number>()

    try {
      for (const chunk of chunks) {
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (abortControllerRef.current?.signal.aborted) {
          console.log('Upload cancelled')
          break
        }

        const uploadPromises = chunk.map(async (item) => {
          const { video, metadata, position } = item
          const retryCount = item.retryCount || 0

          try {
            if (onVideoStart) onVideoStart(video)

            const result = await retryWithBackoff(async () => {
              while (isPausedRef.current) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
              return uploadVideo(
                video,
                metadata,
                uploadSettings,
                playlistId,
                position,
                (p) => {
                  if (onVideoProgress) onVideoProgress(video, p.percent)
                  activeUploadsBytes.set(video.name, p.bytesUploaded)
                  const currentActiveBytes = Array.from(activeUploadsBytes.values()).reduce((a, b) => a + b, 0)
                  updateStats(completedCount, uploadedBytesFromCompleted + currentActiveBytes, queue.length, startTime)
                }
              )
            }, MAX_RETRIES - retryCount)

            completedCount++
            uploadedBytesFromCompleted += video.file?.size || 0
            activeUploadsBytes.delete(video.name)
            
            const currentActiveBytes = Array.from(activeUploadsBytes.values()).reduce((a, b) => a + b, 0)
            updateStats(completedCount, uploadedBytesFromCompleted + currentActiveBytes, queue.length, startTime)
            if (onProgress) {
              onProgress(completedCount, queue.length)
            }
            if (onVideoComplete) {
              onVideoComplete(video, result)
            }
            return result
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed'

            const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('QUOTA') || errorMessage.includes('quotaExceeded')
            if (isQuotaError) {
              setQuotaWarning('YouTube API daily quota exceeded. Please try again tomorrow or reduce batch size.')
            }

            if (onVideoError) {
              onVideoError(video, error as Error)
            }

            return null
          }
        })

        await Promise.all(uploadPromises)
      }

    } finally {
      setIsUploading(false)
      setIsPaused(false)
      setUploadQueue([])
      setCurrentUpload(null)
      setUploadStats(null)
    }
  }, [session?.accessToken, uploadVideo, retryWithBackoff, setIsUploading, setIsPaused, setUploadQueue, setCurrentUpload, setUploadStats, setQuotaWarning, updateStats])

  const addNavigationLinks = useCallback(async (
    videoId: string,
    playlistId: string,
    position: number,
    title: string
  ) => {
    if (!session?.accessToken) return

    try {
      await addNavigationLinksSingle(videoId, title, playlistId)
    } catch (error) {
      console.error('Navigation link failed for video:', videoId, error)
    }
  }, [session?.accessToken])

  return {
    isUploading,
    isPaused,
    currentUpload,
    uploadQueue,
    uploadStats,
    quotaWarning,
    uploadVideo,
    uploadVideos,
    addNavigationLinks,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearQuotaWarning: () => setQuotaWarning(null)
  }
}