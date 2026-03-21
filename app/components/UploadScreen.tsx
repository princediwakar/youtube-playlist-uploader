'use client'

import { useState, useCallback } from 'react'
import { Upload, FolderOpen, AlertTriangle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { UploadSettings, isVideoFile } from '@/app/types/video'
import { extractPlaylistName, checkForDuplicateVideos, calculateInsertionPositions } from '@/app/utils/videoHelpers'
import { MediaList } from '@/app/components/MediaList'
import { PlaylistSelector } from '@/app/components/PlaylistSelector'
import { UploadSettingsPanel } from '@/app/components/UploadSettingsPanel'
import { UploadProgress } from '@/app/components/UploadProgress'
import { useFileHandling } from '@/app/hooks/useFileHandling'
import { usePlaylistManager } from '@/app/hooks/usePlaylistManager'
import { useVideoProcessing } from '@/app/hooks/useVideoProcessing'
import { useVideoUpload } from '@/app/hooks/useVideoUpload'
import { Session } from 'next-auth'

interface UploadScreenProps {
  session: Session
}

export default function UploadScreen({ session }: UploadScreenProps) {

  const { videos, setVideos, addVideos, replaceVideos, removeVideo, updateVideoStatus, resetVideoStatuses } = useFileHandling()
  const {
    availablePlaylists,
    loadingPlaylists,
    existingPlaylistVideos,
    loadingExistingVideos,
    setExistingPlaylistVideos,
    fetchUserPlaylists,
    fetchExistingPlaylistVideos,
    clearPlaylistCache,
    clearPlaylistVideosCache
  } = usePlaylistManager()
  const {
    preProcessingStatus,
    aiProcessing,
    preProcessVideos,
    generatePlaylistDescription,
    suggestCategory,
    setAiProcessingState
  } = useVideoProcessing()
  const {
    isUploading,
    isPaused,
    currentUpload,
    uploadQueue,
    uploadVideo,
    uploadVideos,
    addNavigationLinks,
    uploadStats,
    quotaWarning,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearQuotaWarning
  } = useVideoUpload()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    playlistName: '',
    privacyStatus: 'private',
    maxVideos: 10,
    contentType: 'auto',
    // Upload mode
    uploadMode: 'playlist',
    // Advanced settings
    madeForKids: false,
    category: '27', // Education
    useAiAnalysis: false,
    titleFormat: 'cleaned',
    customTitlePrefix: '',
    customTitleSuffix: '',
    addPlaylistNavigation: true,
    // Playlist selection
    useExistingPlaylist: false,
    selectedPlaylistId: '',
    // Audio-specific settings
    audioCategory: '10', // Music
    generateAudioFrames: true
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const { added: newVideos, errors } = replaceVideos(acceptedFiles)

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
    }

    if (newVideos.length === 0) return

    // Clear previous playlist ID when new videos are selected
    setCurrentPlaylistId(null)

    // Auto-generate playlist name from folder structure
    if (newVideos.length > 0 && !uploadSettings.playlistName) {
      const rootFolder = newVideos[0].folder
      const playlistName = rootFolder !== 'Root' ? rootFolder : extractPlaylistName(newVideos[0].name)
      setUploadSettings(prev => ({ ...prev, playlistName }))
    }

    // Auto-detect if we should suggest individual upload mode for Shorts
    // Wait for video analysis to complete (isShort will be set by replaceVideos)
    setTimeout(() => {
      const shortVideos = videos.filter(v => isVideoFile(v) && v.isShort).length
      if (shortVideos > 0 && shortVideos === videos.length) {
        // All videos are Shorts, suggest individual upload
        setUploadSettings(prev => ({ ...prev, uploadMode: 'individual' }))
      }
    }, 2000) // Give time for video analysis to complete
  }, [uploadSettings.playlistName, uploadSettings.category, replaceVideos, videos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'video/*': [], 'audio/*': [] } });

  // Handle folder selection
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onDrop(files)
  }

  // Optimized upload function with batching support
  const handleOptimizedUpload = async () => {
    if (!session) return

    // Clear any previous error states
    setAuthError(null)
    clearQuotaWarning?.()

    try {
      // Keep uploading in batches until all pending videos are processed
      // Use a local mutable queue to avoid stale closure issues during the async loop
      let batchNumber = 0
      let pendingQueue = videos.filter(v => v.status === 'pending')
      let playlistId: string | null = null
      let positionOffset = 0
      let activeExistingVideos: Array<{videoId: string, title: string, position: number}> = []
      let hasAuthError = false
      let hasQuotaError = false

      while (pendingQueue.length > 0) {
        batchNumber++
        console.log(`Starting batch ${batchNumber}...`)

        const initialVideosToProcess = pendingQueue.slice(0, uploadSettings.maxVideos)
        const remainingCount = pendingQueue.length - initialVideosToProcess.length
        console.log(`Batch ${batchNumber}: ${initialVideosToProcess.length} videos (${remainingCount} remaining)`)

        // Phase 1: Playlist management & fetch existing videos
        if (uploadSettings.uploadMode === 'playlist') {
          if (uploadSettings.useExistingPlaylist) {
            if (!uploadSettings.selectedPlaylistId) {
              throw new Error('Please select an existing playlist')
            }
            playlistId = uploadSettings.selectedPlaylistId
            setCurrentPlaylistId(playlistId)

            // Only fetch from API on the first batch to get the initial baseline state
            if (batchNumber === 1) {
              let fetchedVideos: any[] = []
              try {
                fetchedVideos = await fetchExistingPlaylistVideos(playlistId, true) || []
              } catch (fetchError) {
                console.error('Failed to fetch existing playlist videos:', fetchError)
                fetchedVideos = []
              }
              activeExistingVideos = fetchedVideos.filter(
                v => v && typeof v.videoId === 'string' && typeof v.title === 'string' && typeof v.position === 'number'
              )
              // Ensure initial array is sorted by position
              activeExistingVideos.sort((a, b) => a.position - b.position)
              console.log(`Batch ${batchNumber}: Fetched ${activeExistingVideos.length} existing videos from playlist`)
            } else {
              console.log(`Batch ${batchNumber}: Using ${activeExistingVideos.length} locally tracked existing videos from playlist`)
            }
          } else {
            // Only create playlist once (first batch)
            if (batchNumber === 1) {
              if (!uploadSettings.playlistName) {
                throw new Error('Please enter a playlist name')
              }

              // Generate description using all initial videos
              const playlistDescription = await generatePlaylistDescription(initialVideosToProcess, uploadSettings)
              const playlistResponse = await fetch('/api/youtube/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: uploadSettings.playlistName,
                  description: playlistDescription,
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
              
              // New playlist means no existing videos initially
              activeExistingVideos = []
            } else {
              console.log(`Batch ${batchNumber}: Using ${activeExistingVideos.length} locally tracked existing videos for new playlist`)
            }
          }
        }

        // Phase 2: Pre-processing FIRST to get actual titles for duplicate detection
        const processedVideos = await preProcessVideos(initialVideosToProcess, uploadSettings)

        // Phase 3: Filter duplicates using ACTUAL pre-processed titles
        let videosToProcess = processedVideos
        
        // Build a Set of existing titles for O(1) lookup (normalized: lowercase, trimmed)
        const existingTitles = new Set<string>()
        for (const existing of activeExistingVideos) {
          if (existing?.title && typeof existing.title === 'string') {
            existingTitles.add(existing.title.trim().toLowerCase())
          }
        }
        
        if (uploadSettings.uploadMode === 'playlist' && existingTitles.size > 0) {
          // Filter using actual AI-generated titles
          videosToProcess = processedVideos.filter(pv => {
            const videoTitle = pv.metadata?.title || ''
            const normalizedTitle = videoTitle.trim().toLowerCase()
            
            // Check for exact title match with existing videos
            const isDuplicate = existingTitles.has(normalizedTitle)

            if (isDuplicate) {
              console.log(`Skipping duplicate video: ${videoTitle}`)
            }
            return !isDuplicate
          })

          const skippedCount = processedVideos.length - videosToProcess.length
          if (skippedCount > 0) {
            console.log(`Filtered ${skippedCount} duplicate videos`)
            // Mark skipped videos as completed visually
            const videosToProcessPaths = new Set(videosToProcess.map(v => v.video.path))
            const skippedPaths = processedVideos
              .filter(v => !videosToProcessPaths.has(v.video.path))
              .map(v => v.video.path)
            setVideos(prev => prev.map(v =>
              skippedPaths.includes(v.path) ? { ...v, status: 'completed', progress: 100 } : v
            ))
          }
        }

        // Phase 4: Calculate positions for non-duplicate videos
        let positions: number[] = []
        
        // Early exit: if no videos to process after duplicate filtering, skip to next batch
        if (videosToProcess.length === 0) {
          console.log(`Batch ${batchNumber}: All videos are duplicates, skipping`)
          // Mark these specific videos as completed since they are duplicates
          setVideos(prev => prev.map(v => 
            initialVideosToProcess.some(iv => iv.file === v.file) ? { ...v, status: 'completed', progress: 100 } : v
          ))
          pendingQueue = pendingQueue.slice(initialVideosToProcess.length)
          continue
        }
        
        if (uploadSettings.uploadMode === 'playlist') {
          if (uploadSettings.useExistingPlaylist) {
            // Use actual pre-processed titles for position calculation (only non-duplicates)
            const allPositions = calculateInsertionPositions(
              videosToProcess.map(pv => pv.video), 
              activeExistingVideos, 
              uploadSettings.titleFormat, 
              uploadSettings.customTitlePrefix, 
              uploadSettings.customTitleSuffix, 
              uploadSettings.useAiAnalysis
            )
            // Map to videosToProcess using path for reliable lookup
            const positionMap = new Map<string, number>()
            videosToProcess.forEach((pv, index) => {
              positionMap.set(pv.video.path, allPositions[index])
            })
            positions = videosToProcess.map(pv => positionMap.get(pv.video.path) || 0)
            console.log(`Batch ${batchNumber}: Calculated positions for ${videosToProcess.length} videos (existing: ${activeExistingVideos.length})`, positions)
          } else {
            // New playlist: positions continue from previous batch
            positions = videosToProcess.map((_, index) => positionOffset + index)
            positionOffset += videosToProcess.length
            console.log(`Batch ${batchNumber}: Using offset positions starting at ${positions[0]}, offset now: ${positionOffset}`)
          }
        } else {
          // Individual upload: positions start from 0
          positions = videosToProcess.map((_, index) => index)
          console.log(`Batch ${batchNumber}: Using sequential positions for individual upload`)
        }

        // Prepare upload queue with positions
        const uploadQueue = videosToProcess.map(({ video, metadata }, index) => ({
          video,
          metadata,
          position: positions[index]
        }))
        console.log(`Batch ${batchNumber}: Upload queue prepared with ${uploadQueue.length} videos, positions:`, uploadQueue.map(q => ({ name: q.video.name, position: q.position })))

        // Update status to uploading for all videos in the queue
        setVideos(prev => prev.map(v =>
          uploadQueue.some(item => item.video.file === v.file)
            ? { ...v, status: 'uploading', progress: 0 }
            : v
        ))

        // Phase 5: Use uploadVideos hook for parallel uploads
        await uploadVideos(
          uploadQueue,
          uploadSettings,
          playlistId || undefined,
          // onProgress callback
          (completed, total) => {
            // Progress is tracked via video status updates in onVideoComplete/onVideoError
          },
          // onVideoComplete callback
          (video, result) => {
            // Update status to completed
            setVideos(prev => prev.map(v =>
              v.file === video.file
                ? { ...v, status: 'completed', progress: 100, videoId: result.videoId }
                : v
            ))

            // Update existingPlaylistVideos to prevent false duplicates in subsequent batches
            if (playlistId && uploadSettings.uploadMode === 'playlist') {
              const queueItem = uploadQueue.find(item => item.video.file === video.file)
              const position = queueItem?.position ?? activeExistingVideos.length
              
              const newVideoRecord = { videoId: result.videoId, title: video.name, position }
              
              // Update local tracking array for the next batch loop
              activeExistingVideos.push(newVideoRecord)
              // Keep array sorted by position for consistent calculations in next batch
              activeExistingVideos.sort((a, b) => a.position - b.position)

              // Update React UI state (sorted by position)
              setExistingPlaylistVideos(prev => {
                if (!prev) return [newVideoRecord]
                const updated = [...prev, newVideoRecord]
                updated.sort((a, b) => a.position - b.position)
                return updated
              })
            }

            // Cache invalidation is deferred until all uploads complete to avoid
            // triggering API requests with stale data during multi-batch uploads
            // The cache will be cleared after all batches finish (see line 381-386)

            // Add navigation links immediately if enabled
            if (uploadSettings.addPlaylistNavigation && result.videoId && playlistId) {
              const queueItem = uploadQueue.find(item => item.video.file === video.file)
              addNavigationLinks(result.videoId, playlistId, queueItem?.position || 0, queueItem?.metadata.title || video.name)
                .catch(navError => {
                  console.error('Navigation link failed for video:', video.name, navError)
                })
            }
          },
          // onVideoError callback
          (video, error) => {
            console.error('Upload error for video:', video.name, error)

            const errorMessage = error instanceof Error ? error.message : 'Upload failed'

            // Check for authentication errors
            if (errorMessage.includes('access token has expired') || errorMessage.includes('unauthorized') || errorMessage.includes('Invalid Credentials')) {
              console.log('Authentication error detected, cancelling uploads')
              setAuthError(errorMessage)
              hasAuthError = true
              cancelUpload()
            }

            // Check for quota errors
            if (errorMessage.includes('quota') || errorMessage.includes('QUOTA') || errorMessage.includes('quotaExceeded')) {
              console.log('Quota error detected, cancelling uploads')
              hasQuotaError = true
              cancelUpload()
            }

            setVideos(prev => prev.map(v =>
              v.file === video.file
                ? {
                    ...v,
                    status: 'error',
                    progress: 0,
                    error: errorMessage
                  }
                : v
            ))
          }
        )

        // Check for authentication or quota error to break the batch loop
        if (hasAuthError || hasQuotaError) {
          break
        }

        // Advance the queue
        pendingQueue = pendingQueue.slice(initialVideosToProcess.length)
        
        if (pendingQueue.length > 0) {
          console.log(`Batch ${batchNumber} complete. ${pendingQueue.length} videos remaining.`)
        }
      }

      // Invalidate playlists cache after all uploads complete
      if (playlistId) {
        clearPlaylistCache()
        clearPlaylistVideosCache(playlistId)
        console.log('Playlists cache invalidated after all uploads complete')
      }

    } catch (error) {
      console.error('Upload process error:', error)
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const completedUploads = videos.filter(v => v.status === 'completed').length;
  const totalVideos = videos.length;

  return (
    <>
      {authError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-3 text-red-500" size={20} />
              <div>
                <p className="text-red-300 font-medium">{authError}</p>
                <p className="text-red-400 text-sm mt-1">Please sign out and sign in again to refresh your access token.</p>
              </div>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-300 hover:text-red-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {quotaWarning && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-3 text-yellow-500" size={20} />
              <div>
                <p className="text-yellow-300 font-medium">YouTube API Quota Exceeded</p>
                <p className="text-yellow-400 text-sm mt-1">{quotaWarning}</p>
              </div>
            </div>
            <button
              onClick={() => clearQuotaWarning()}
              className="text-yellow-300 hover:text-yellow-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-12 gap-8 items-start">

      {/* Left Column: Intake & Configuration */}
      <div className="lg:col-span-8 flex flex-col gap-8">

        {/* Payload Intake */}
        <div className="panel">
          <div className="flex justify-between items-center border-b border-yt-border pb-3 mb-6">
            <h3 className="text-yt-text-primary font-medium text-lg flex items-center">
              <FolderOpen className="mr-3 text-yt-text-secondary" size={20} />
              Upload Videos
            </h3>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Drag & Drop Individual Videos */}
              <div
                {...getRootProps()}
                className={`upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[240px] p-8 border-2 border-dashed ${isDragActive ? 'border-yt-blue bg-[#e3f2fd] scale-[0.99]' : 'border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover'}`}
              >
                <input {...getInputProps()} />
                <div className={`w-20 h-20 rounded-full bg-yt-bg flex items-center justify-center mb-6 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
                  <Upload className={`transition-colors duration-300 ${isDragActive ? 'text-yt-blue' : 'text-yt-text-secondary group-hover:text-yt-text-primary'}`} size={36} />
                </div>

                {isDragActive ? (
                  <div className="text-center">
                    <p className="text-lg font-medium text-yt-text-primary mb-2">Drop videos here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <h4 className="text-lg font-medium text-yt-text-primary">
                        Upload Individual Videos
                      </h4>
                      <span className="ml-2 text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border">
                        MULTIPLE
                      </span>
                    </div>
                    <p className="text-sm text-yt-text-secondary mb-6">
                      Drag and drop multiple media files (video or audio) or click to select them individually
                    </p>
                    <div className="mt-4 text-xs text-yt-text-secondary">
                      Video: MP4, MOV, AVI, MKV, WEBM, FLV, WMV • Audio: MP3, WAV, M4A, FLAC, OGG, AAC
                    </div>
                  </div>
                )}
              </div>

              {/* Folder/Playlist Upload */}
              <div
                className="upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[240px] p-8 border-2 border-dashed border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover"
                role="button"
                tabIndex={0}
                aria-label="Upload playlist from folder"
                onClick={() => {
                  // Trigger folder input click
                  const folderInput = document.querySelector('input[webkitdirectory]') as HTMLInputElement
                  folderInput?.click()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    const folderInput = document.querySelector('input[webkitdirectory]') as HTMLInputElement
                    folderInput?.click()
                  }
                }}
              >
                <div className="w-20 h-20 rounded-full bg-yt-bg flex items-center justify-center mb-6">
                  <FolderOpen className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={36} />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <h4 className="text-lg font-medium text-yt-text-primary">
                      Upload Folder as Playlist
                    </h4>
                    <span className="ml-2 text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border">
                      PLAYLIST
                    </span>
                  </div>
                  <p className="text-sm text-yt-text-secondary mb-6">
                    Select a folder containing media files (video or audio) to automatically create a YouTube playlist. Files are ordered by filename.
                  </p>
                  <div className="mt-4 text-xs text-yt-text-secondary">
                    Perfect for courses, tutorials, or video series
                  </div>
                </div>

                <input
                  type="file"
                  {...({} as any)}
                  webkitdirectory="true"
                  multiple
                  onChange={handleFolderSelect}
                  className="hidden"
                  accept="video/*,audio/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma,.opus,.aiff,.alac"
                  id="folder-upload-input"
                />
              </div>
            </div>
          </div>

          {videos.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-yt-bg rounded-lg border border-yt-border flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-yt-text-primary mb-1">
                    Ready to upload: {videos.length} media file{videos.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yt-text-secondary">
                    FROM {Array.from(new Set(videos.map(v => v.folder))).length} FOLDER{Array.from(new Set(videos.map(v => v.folder))).length !== 1 ? 'S' : ''}
                  </p>
                </div>
              </div>

              <div className="max-h-32 overflow-y-auto bg-yt-bg rounded-lg border border-yt-border p-3">
                <p className="text-xs text-yt-text-secondary mb-3 border-b border-yt-border pb-2">Folders:</p>
                <div className="space-y-2 text-sm text-yt-text-secondary">
                  {Array.from(new Set(videos.map(v => v.folder))).map(folder => {
                    const folderVideos = videos.filter(v => v.folder === folder)
                    return (
                      <div key={folder} className="flex items-center group">
                        <FolderOpen className="mr-3 text-yt-text-secondary" size={16} />
                        <span className="text-yt-text-primary">{folder}</span>
                        <span className="ml-auto text-yt-text-secondary">({folderVideos.length})</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Settings */}
        {videos.length > 0 && (
          <UploadSettingsPanel
            videos={videos}
            uploadSettings={uploadSettings}
            onSettingsChange={(settings) => setUploadSettings(prev => ({ ...prev, ...settings }))}
            availablePlaylists={availablePlaylists}
            loadingPlaylists={loadingPlaylists}
            existingPlaylistVideos={existingPlaylistVideos}
            showAdvancedSettings={showAdvancedSettings}
            onToggleAdvancedSettings={() => setShowAdvancedSettings(!showAdvancedSettings)}
            onFetchUserPlaylists={fetchUserPlaylists}
            onFetchExistingPlaylistVideos={fetchExistingPlaylistVideos}
            onClearPlaylistCache={clearPlaylistCache}
            onClearPlaylistVideosCache={clearPlaylistVideosCache}
            onSetExistingPlaylistVideos={setExistingPlaylistVideos}
            onUpload={handleOptimizedUpload}
            isUploading={isUploading}
            totalVideos={videos.length}
            totalQueued={Math.min(pendingVideos.length, uploadSettings.maxVideos)}
          />
        )}
      </div>
      {/* Progress Panel */}
      <div className="lg:col-span-4 w-full self-stretch">
        <UploadProgress
          videos={videos}
          uploadSettings={uploadSettings}
          loadingExistingVideos={loadingExistingVideos}
          existingPlaylistVideos={existingPlaylistVideos}
          preProcessingStatus={preProcessingStatus}
          aiProcessing={aiProcessing}
          currentUpload={currentUpload}
          currentPlaylistId={currentPlaylistId}
          totalVideos={totalVideos}
          completedUploads={completedUploads}
          isUploading={isUploading}
          isPaused={isPaused}
          uploadStats={uploadStats}
          quotaWarning={quotaWarning}
          onPause={pauseUpload}
          onResume={resumeUpload}
          onCancel={cancelUpload}
          onRemoveVideo={removeVideo}
        />
      </div>
    </div>
  </>
)
}