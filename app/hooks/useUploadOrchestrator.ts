'use client'

import { useCallback } from 'react'
import { MediaFile, UploadSettings, YouTubePlaylistVideo } from '@/app/types/video'
import { generateTitle, getBasename, calculateInsertionPositions } from '@/app/utils/videoHelpers'
import type { UploadQueueItem } from './useVideoUpload'

interface OrchestratorDeps {
  session: { accessToken?: string } | null
  videos: MediaFile[]
  setVideos: (videos: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => void
  uploadSettings: UploadSettings
  setCurrentPlaylistId: (id: string | null) => void
  setAuthError: (error: string | null) => void
  fetchExistingPlaylistVideos: (playlistId: string, forceRefresh?: boolean) => Promise<YouTubePlaylistVideo[]>
  setExistingPlaylistVideos: (videos: YouTubePlaylistVideo[] | ((prev: YouTubePlaylistVideo[]) => YouTubePlaylistVideo[])) => void
  clearPlaylistCache: () => void
  clearPlaylistVideosCache: (playlistId?: string) => void
  uploadVideos: (
    queue: UploadQueueItem[],
    uploadSettings: UploadSettings,
    playlistId?: string,
    onProgress?: (completed: number, total: number) => void,
    onVideoComplete?: (video: MediaFile, result: { videoId: string; url: string }) => void,
    onVideoError?: (video: MediaFile, error: Error) => void
  ) => Promise<void>
  addNavigationLinks: (videoId: string, playlistId: string, position: number, title: string) => Promise<void>
  cancelUpload: () => void
  clearQuotaWarning: () => void
}

export function useUploadOrchestrator(deps: OrchestratorDeps) {
  const {
    session,
    videos,
    setVideos,
    uploadSettings,
    setCurrentPlaylistId,
    setAuthError,
    fetchExistingPlaylistVideos,
    setExistingPlaylistVideos,
    clearPlaylistCache,
    clearPlaylistVideosCache,
    uploadVideos,
    addNavigationLinks,
    cancelUpload,
    clearQuotaWarning,
  } = deps

  const handleOptimizedUpload = useCallback(async () => {
    if (!session) return

    setAuthError(null)
    clearQuotaWarning()

    try {
      // Pre-flight: refresh the access token so it doesn't expire mid-upload
      try {
        const refreshRes = await fetch('/api/auth/refresh')
        if (!refreshRes.ok) {
          const refreshErr = await refreshRes.json().catch(() => ({}))
          setAuthError(refreshErr.error || 'Your session has expired. Please sign out and sign in again.')
          return
        }
        const refreshData = await refreshRes.json()
        if (refreshData.refreshed) {
          console.log('Access token refreshed before upload')
        }
      } catch (refreshError) {
        console.error('Pre-upload token refresh failed:', refreshError)
        setAuthError('Unable to verify your session. Please check your connection and try again.')
        return
      }

      let batchNumber = 0
      let pendingQueue = videos.filter(v => v.status === 'pending')
      let playlistId: string | null = null
      let positionOffset = 0
      let activeExistingVideos: YouTubePlaylistVideo[] = []
      let hasAuthError = false
      let hasQuotaError = false

      while (pendingQueue.length > 0) {
        batchNumber++
        console.log(`Starting batch ${batchNumber}...`)

        const initialVideosToProcess = pendingQueue.slice(0, uploadSettings.maxVideos)
        const remainingCount = pendingQueue.length - initialVideosToProcess.length
        console.log(`Batch ${batchNumber}: ${initialVideosToProcess.length} videos (${remainingCount} remaining)`)

        // Phase 1: Playlist management
        if (uploadSettings.uploadMode === 'playlist') {
          if (uploadSettings.useExistingPlaylist) {
            if (!uploadSettings.selectedPlaylistId) {
              throw new Error('Please select an existing playlist')
            }
            playlistId = uploadSettings.selectedPlaylistId
            setCurrentPlaylistId(playlistId)

            if (batchNumber === 1) {
              let fetchedVideos: YouTubePlaylistVideo[] = []
              try {
                fetchedVideos = await fetchExistingPlaylistVideos(playlistId, true) || []
              } catch (fetchError) {
                console.error('Failed to fetch existing playlist videos:', fetchError)
                fetchedVideos = []
              }
              activeExistingVideos = fetchedVideos.filter(
                v => v && typeof v.videoId === 'string' && typeof v.title === 'string' && typeof v.position === 'number'
              )
              activeExistingVideos.sort((a, b) => a.position - b.position)
              console.log(`Batch ${batchNumber}: Fetched ${activeExistingVideos.length} existing videos from playlist`)
            }
          } else {
            if (batchNumber === 1) {
              if (!uploadSettings.playlistName) {
                throw new Error('Please enter a playlist name')
              }

              const playlistResponse = await fetch('/api/youtube/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: uploadSettings.playlistName,
                  description: '',
                  privacyStatus: uploadSettings.privacyStatus
                })
              })

              if (!playlistResponse.ok) {
                const error = await playlistResponse.json()
                throw new Error(error.details || 'Failed to create playlist')
              }

              const { playlistId: newPlaylistId } = await playlistResponse.json()
              playlistId = newPlaylistId
              setCurrentPlaylistId(playlistId)
              activeExistingVideos = []
            }
          }
        }

        // Phase 2: Generate metadata from filenames (no AI)
        const processedVideos = initialVideosToProcess.map(video => ({
          video,
          metadata: {
            title: generateTitle(
              getBasename(video.file.name),
              uploadSettings.titleFormat,
              uploadSettings.customTitlePrefix,
              uploadSettings.customTitleSuffix
            ),
            description: '',
            tags: [] as string[],
            category: video.mediaType === 'audio' ? uploadSettings.audioCategory : uploadSettings.category
          }
        }))

        // Phase 3: Filter duplicates
        let videosToProcess = processedVideos

        const existingTitles = new Set<string>()
        for (const existing of activeExistingVideos) {
          if (existing?.title && typeof existing.title === 'string') {
            existingTitles.add(existing.title.trim().toLowerCase())
          }
        }

        if (uploadSettings.uploadMode === 'playlist' && existingTitles.size > 0) {
          videosToProcess = processedVideos.filter(pv => {
            const videoTitle = pv.metadata?.title || ''
            const normalizedTitle = videoTitle.trim().toLowerCase()
            const isDuplicate = existingTitles.has(normalizedTitle)
            if (isDuplicate) {
              console.log(`Skipping duplicate video: ${videoTitle}`)
            }
            return !isDuplicate
          })

          const skippedCount = processedVideos.length - videosToProcess.length
          if (skippedCount > 0) {
            console.log(`Filtered ${skippedCount} duplicate videos`)
            const videosToProcessPaths = new Set(videosToProcess.map(v => v.video.path))
            const skippedPaths = processedVideos
              .filter(v => !videosToProcessPaths.has(v.video.path))
              .map(v => v.video.path)
            setVideos(prev => prev.map(v =>
              skippedPaths.includes(v.path) ? { ...v, status: 'completed', progress: 100 } : v
            ))
          }
        }

        // Phase 4: Calculate positions
        let positions: number[] = []

        if (videosToProcess.length === 0) {
          console.log(`Batch ${batchNumber}: All videos are duplicates, skipping`)
          setVideos(prev => prev.map(v =>
            initialVideosToProcess.some(iv => iv.file === v.file) ? { ...v, status: 'completed', progress: 100 } : v
          ))
          pendingQueue = pendingQueue.slice(initialVideosToProcess.length)
          continue
        }

        if (uploadSettings.uploadMode === 'playlist') {
          if (uploadSettings.useExistingPlaylist) {
            const allPositions = calculateInsertionPositions(
              videosToProcess.map(pv => pv.video),
              activeExistingVideos,
              uploadSettings.titleFormat,
              uploadSettings.customTitlePrefix,
              uploadSettings.customTitleSuffix
            )
            const positionMap = new Map<string, number>()
            videosToProcess.forEach((pv, index) => {
              positionMap.set(pv.video.path, allPositions[index])
            })
            positions = videosToProcess.map(pv => positionMap.get(pv.video.path) || 0)
          } else {
            positions = videosToProcess.map((_, index) => positionOffset + index)
            positionOffset += videosToProcess.length
          }
        } else {
          positions = videosToProcess.map((_, index) => index)
        }

        const queue = videosToProcess.map(({ video, metadata }, index) => ({
          video,
          metadata,
          position: positions[index]
        }))
        console.log(`Batch ${batchNumber}: Upload queue prepared with ${queue.length} videos`)

        setVideos(prev => prev.map(v =>
          queue.some(item => item.video.file === v.file)
            ? { ...v, status: 'uploading', progress: 0 }
            : v
        ))

        // Phase 5: Upload
        await uploadVideos(
          queue,
          uploadSettings,
          playlistId || undefined,
          (_completed, _total) => {},
          (video, result) => {
            setVideos(prev => prev.map(v =>
              v.file === video.file
                ? { ...v, status: 'completed', progress: 100, videoId: result.videoId }
                : v
            ))

            if (playlistId && uploadSettings.uploadMode === 'playlist') {
              const queueItem = queue.find(item => item.video.file === video.file)
              const position = queueItem?.position ?? activeExistingVideos.length

              const newVideoRecord: YouTubePlaylistVideo = { videoId: result.videoId, title: video.name, position }
              activeExistingVideos.push(newVideoRecord)
              activeExistingVideos.sort((a, b) => a.position - b.position)

              setExistingPlaylistVideos(prev => {
                if (!prev) return [newVideoRecord]
                const updated = [...prev, newVideoRecord]
                updated.sort((a, b) => a.position - b.position)
                return updated
              })
            }

            if (uploadSettings.addPlaylistNavigation && result.videoId && playlistId) {
              const queueItem = queue.find(item => item.video.file === video.file)
              addNavigationLinks(result.videoId, playlistId, queueItem?.position || 0, queueItem?.metadata.title || video.name)
                .catch(navError => {
                  console.error('Navigation link failed for video:', video.name, navError)
                })
            }
          },
          (video, error) => {
            console.error('Upload error for video:', video.name, error)
            const errorMessage = error instanceof Error ? error.message : 'Upload failed'

            if (errorMessage.includes('access token has expired') || errorMessage.includes('unauthorized') || errorMessage.includes('Invalid Credentials')) {
              setAuthError(errorMessage)
              hasAuthError = true
              cancelUpload()
            }

            if (errorMessage.includes('quota') || errorMessage.includes('QUOTA') || errorMessage.includes('quotaExceeded')) {
              hasQuotaError = true
              cancelUpload()
            }

            setVideos(prev => prev.map(v =>
              v.file === video.file
                ? { ...v, status: 'error', progress: 0, error: errorMessage }
                : v
            ))
          }
        )

        if (hasAuthError || hasQuotaError) {
          break
        }

        pendingQueue = pendingQueue.slice(initialVideosToProcess.length)

        if (pendingQueue.length > 0) {
          console.log(`Batch ${batchNumber} complete. ${pendingQueue.length} videos remaining.`)
        }
      }

      if (playlistId) {
        clearPlaylistCache()
        clearPlaylistVideosCache(playlistId)
        console.log('Playlists cache invalidated after all uploads complete')
      }

    } catch (error) {
      console.error('Upload process error:', error)
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [
    session,
    videos,
    uploadSettings,
    setVideos,
    setCurrentPlaylistId,
    setAuthError,
    fetchExistingPlaylistVideos,
    setExistingPlaylistVideos,
    clearPlaylistCache,
    clearPlaylistVideosCache,
    uploadVideos,
    addNavigationLinks,
    cancelUpload,
    clearQuotaWarning,
  ])

  return { handleOptimizedUpload }
}
