// app/components/UploadScreen.tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, FolderOpen, Image, AlertTriangle, RotateCcw } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { isVideoFile } from '@/app/types/video'
import type { GooglePhotosImportItem } from '@/app/types/googlePhotos'
import { extractPlaylistName } from '@/app/utils/videoHelpers'
import { createPlaylist } from '@/app/actions/playlist'
import GooglePhotosPicker from '@/app/components/GooglePhotosPicker'
import { CompactFileBar } from '@/app/components/CompactFileBar'
import { UploadSettingsPanel } from '@/app/components/UploadSettingsPanel'
import { UploadProgress } from '@/app/components/UploadProgress'
import { useFileContext } from '@/app/contexts/FileContext'
import { usePlaylistContext } from '@/app/contexts/PlaylistContext'
import { useSettingsContext } from '@/app/contexts/SettingsContext'
import { useVideoUpload } from '@/app/hooks/useVideoUpload'
import { getFileFromHandle, isFileHandleSupported } from '@/app/store'
import type { Session } from 'next-auth'

interface UploadScreenProps {
  session: Session
}

export default function UploadScreen({ session }: UploadScreenProps) {
  const { videos, setVideos, replaceVideos, addVideos, hasStoredFiles, restoreSession, clearSession, updateVideo } = useFileContext()
  usePlaylistContext()
  const { isUploading, quotaWarning, clearQuotaWarning, uploadVideos } = useVideoUpload()
  const { uploadSettings, setUploadSettings, setCurrentPlaylistId, authError, setAuthError } = useSettingsContext()

  const [isPhotosPickerOpen, setIsPhotosPickerOpen] = useState(false)
  const [isUploadCardsExpanded, setIsUploadCardsExpanded] = useState(true)
  const [showRestoreSession, setShowRestoreSession] = useState(false)
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Track which import method triggered the drop, so onDrop can auto-set uploadMode
  const importModeRef = useRef<'individual' | 'playlist' | null>(null)

  // Auto-detect Shorts after media analysis completes
  const shortsDetectedRef = useRef(false)

  useEffect(() => {
    if (shortsDetectedRef.current) return
    const videoFiles = videos.filter(v => isVideoFile(v))
    if (videoFiles.length === 0) return
    const allAnalyzed = videoFiles.every(v => v.isShort !== undefined)
    if (!allAnalyzed) return
    if (videoFiles.every(v => v.isShort)) {
      shortsDetectedRef.current = true
      setUploadSettings(prev => ({ ...prev, uploadMode: 'individual' }))
    }
  }, [videos, setUploadSettings])

  // Reset Shorts detection when files are replaced
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    shortsDetectedRef.current = false
    const { added: newVideos, errors } = await replaceVideos(acceptedFiles)

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
    }

    if (newVideos.length === 0) return

    const mode = importModeRef.current || 'individual'
    setUploadSettings(prev => ({ ...prev, uploadMode: mode }))
    importModeRef.current = null

    setCurrentPlaylistId(null)
    setIsUploadCardsExpanded(false)

    if (newVideos.length > 0 && !uploadSettings.playlistName) {
      const rootFolder = newVideos[0].folder
      const playlistName = rootFolder !== 'Root' ? rootFolder : extractPlaylistName(newVideos[0].name)
      setUploadSettings(prev => ({ ...prev, playlistName }))
    }
  }, [uploadSettings.playlistName, replaceVideos, setCurrentPlaylistId, setUploadSettings])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp', '.3gpp', '.ts'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.opus', '.aiff', '.alac', '.amr'],
    },
  })

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    importModeRef.current = 'playlist'
    const files = Array.from(event.target.files || [])
    onDrop(files)
  }

  const handleGooglePhotosImport = useCallback(async (items: GooglePhotosImportItem[]) => {
    shortsDetectedRef.current = false

    const placeholderFiles = items.map(item => {
      const ext = item.mimeType.split('/')[1] || 'mp4'
      return new File([new Blob()], `${item.filename || item.id}.${ext}`, { type: item.mimeType })
    })

    await replaceVideos(placeholderFiles)

    setVideos(prev => prev.map(v => {
      const match = items.find(item =>
        (item.filename && v.file.name.includes(item.filename)) ||
        v.file.name.includes(item.id)
      )
      if (!match) return v
      return {
        ...v,
        googlePhotosMediaId: match.id,
        googlePhotosBaseUrl: match.baseUrl,
        googlePhotosFetchedAt: match.fetchedAt,
        name: match.filename || v.name,
        size: 'Google Photos',
      }
    }))

    setIsPhotosPickerOpen(false)
    setIsUploadCardsExpanded(false)
  }, [replaceVideos, setVideos])

  const handleOptimizedUpload = useCallback(async () => {
    if (!session?.accessToken) {
      setAuthError('Please sign in to upload videos')
      return
    }

    const videosToUpload = videos.filter(v => v.status === 'pending')
    if (videosToUpload.length === 0) return

    let playlistId: string | undefined

    if (uploadSettings.uploadMode === 'playlist') {
      if (uploadSettings.useExistingPlaylist) {
        playlistId = uploadSettings.selectedPlaylistId
      } else {
        try {
          const result = await createPlaylist(uploadSettings.playlistName, '', uploadSettings.privacyStatus)
          playlistId = result.playlistId
          setCurrentPlaylistId(playlistId)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create playlist'
          setAuthError(message)
          return
        }
      }
    }

    const queue: import('@/app/hooks/useVideoUpload').UploadQueueItem[] = videosToUpload.map((video, idx) => ({
      video,
      metadata: {
        title: video.name,
        description: video.duration ? `Duration: ${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : '',
        tags: [],
        category: uploadSettings.category,
      },
      position: idx,
    }))

    await uploadVideos(
      queue,
      uploadSettings,
      playlistId,
      undefined,
      (video) => {
        // onVideoStart
        const idx = videos.findIndex(v => v.path === video.path)
        if (idx !== -1) updateVideo(idx, { status: 'uploading', progress: 0 })
      },
      (video, progress) => {
        // onVideoProgress
        const idx = videos.findIndex(v => v.path === video.path)
        if (idx !== -1) updateVideo(idx, { progress })
      },
      (video, result) => {
        // onVideoComplete
        const idx = videos.findIndex(v => v.path === video.path)
        if (idx !== -1) updateVideo(idx, { status: 'completed', progress: 100 })
      },
      (video, error) => {
        // onVideoError
        const idx = videos.findIndex(v => v.path === video.path)
        if (idx !== -1) updateVideo(idx, { status: 'error', error: error.message })
      }
    )
  }, [session, videos, uploadSettings, uploadVideos, setAuthError, setCurrentPlaylistId, updateVideo])

  // Compute upload button disabled state
  const isUploadDisabled =
    isUploading ||
    (uploadSettings.uploadMode === 'playlist' && (
      (!uploadSettings.useExistingPlaylist && !uploadSettings.playlistName) ||
      (uploadSettings.useExistingPlaylist && !uploadSettings.selectedPlaylistId)
    ))

  const hasFiles = videos.length > 0

  // Check for stored files on mount
  useEffect(() => {
    hasStoredFiles().then(hasStored => {
      setShowRestoreSession(hasStored)
    })
  }, [hasStoredFiles])

  const handleRestoreSession = useCallback(async () => {
    const { handles, metadata } = await restoreSession()

    let restoredFiles: File[] = []

    if (isFileHandleSupported && handles && handles.length > 0) {
      const validHandles = handles.filter((h): h is FileSystemFileHandle => 
        h && typeof h === 'object' && 'kind' in h && (h as FileSystemFileHandle).kind === 'file'
      )

      if (validHandles.length > 0) {
        const filePromises = validHandles.map(async (handle) => {
          try {
            return await getFileFromHandle(handle)
          } catch (error) {
            console.warn('Failed to get file from handle:', error)
            return null
          }
        })

        const files = await Promise.all(filePromises)
        restoredFiles = files.filter((f): f is File => f !== null)

        if (restoredFiles.length > 0) {
          await addVideos(restoredFiles)
          await clearSession()
          setShowRestoreSession(false)
          return
        }
      }
    }

    if (metadata && metadata.length > 0) {
      alert(`Found ${metadata.length} previously uploaded files. Please re-select your files to continue the session.`)
    }
    
    await clearSession()
    setShowRestoreSession(false)
  }, [restoreSession, clearSession, addVideos])

  return (
    <>
      {/* Error Banners */}
      {authError && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center">
              <AlertTriangle className="mr-2 sm:mr-3 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" size={18} />
              <div>
                <p className="text-red-300 font-medium text-sm sm:text-base">{authError}</p>
                <p className="text-red-400 text-xs sm:text-sm mt-1">Please sign out and sign in again to refresh your access token.</p>
              </div>
            </div>
            <button onClick={() => setAuthError(null)} className="text-red-300 hover:text-red-100 text-sm self-end sm:self-auto flex-shrink-0">
              Dismiss
            </button>
          </div>
        </div>
      )}
      {quotaWarning && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center">
              <AlertTriangle className="mr-2 sm:mr-3 text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" size={18} />
              <div>
                <p className="text-yellow-300 font-medium text-sm sm:text-base">YouTube API Quota Exceeded</p>
                <p className="text-yellow-400 text-xs sm:text-sm mt-1">{quotaWarning}</p>
              </div>
            </div>
            <button onClick={() => clearQuotaWarning()} className="text-yellow-300 hover:text-yellow-100 text-sm self-end sm:self-auto flex-shrink-0">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upload Cards — shown when no files OR user expanded them */}
      {(!hasFiles || isUploadCardsExpanded) && (
        <div className="panel mb-6">
          <div className="flex justify-between items-center border-b border-yt-border pb-3 mb-4 sm:mb-6">
            <h3 className="text-yt-text-primary font-medium text-base sm:text-lg flex items-center">
              <FolderOpen className="mr-2 sm:mr-3 text-yt-text-secondary" size={18} />
              Upload Videos
            </h3>
            {hasFiles && (
              <button
                onClick={() => setIsUploadCardsExpanded(false)}
                className="text-xs sm:text-sm text-yt-text-secondary hover:text-yt-text-primary transition-colors"
              >
                Collapse ▲
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Drag & Drop Individual Videos */}
            <div
              {...getRootProps()}
              className={`upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px] p-5 sm:p-8 border-2 border-dashed rounded-xl transition-all ${
                isDragActive ? 'border-yt-blue bg-[#e3f2fd] scale-[0.99]' : 'border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-yt-bg flex items-center justify-center mb-4 sm:mb-6 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
                <Upload className={`transition-colors duration-300 ${isDragActive ? 'text-yt-blue' : 'text-yt-text-secondary group-hover:text-yt-text-primary'}`} size={28} />
              </div>

              {isDragActive ? (
                <div className="text-center">
                  <p className="text-base sm:text-lg font-medium text-yt-text-primary mb-1 sm:mb-2">Drop files here</p>
                </div>
              ) : (
                <div className="text-center">
                  <h4 className="text-sm sm:text-lg font-medium text-yt-text-primary mb-1 sm:mb-2">
                    Individual Files
                  </h4>
                  <span className="inline-block text-[10px] sm:text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border mb-2 sm:mb-3">
                    MULTIPLE
                  </span>
                  <p className="hidden sm:block text-xs sm:text-sm text-yt-text-secondary mb-4">
                    {isTouchDevice ? 'Tap to select media files' : 'Drag and drop media files or click to select'}
                  </p>
                  <p className="hidden sm:block text-[10px] text-yt-text-secondary">
                    Video: MP4, MOV, AVI, MKV, WEBM, 3GP · Audio: MP3, WAV, M4A, FLAC
                  </p>
                </div>
              )}
            </div>

            {/* Folder/Playlist Upload */}
            <div
              className="upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px] p-5 sm:p-8 border-2 border-dashed border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover rounded-xl transition-all"
              role="button"
              tabIndex={0}
              aria-label="Upload playlist from folder"
              onClick={() => {
                if (isTouchDevice) {
                  const mobileInput = document.getElementById('folder-upload-input-mobile') as HTMLInputElement
                  mobileInput?.click()
                } else {
                  const folderInput = document.querySelector('input[webkitdirectory]') as HTMLInputElement
                  folderInput?.click()
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (isTouchDevice) {
                    const mobileInput = document.getElementById('folder-upload-input-mobile') as HTMLInputElement
                    mobileInput?.click()
                  } else {
                    const folderInput = document.querySelector('input[webkitdirectory]') as HTMLInputElement
                    folderInput?.click()
                  }
                }
              }}
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-yt-bg flex items-center justify-center mb-4 sm:mb-6">
                <FolderOpen className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={28} />
              </div>
              <div className="text-center">
                <h4 className="text-sm sm:text-lg font-medium text-yt-text-primary mb-1 sm:mb-2">
                  Folder as Playlist
                </h4>
                <span className="inline-block text-[10px] sm:text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border mb-2 sm:mb-3">
                  PLAYLIST
                </span>
                <p className="hidden sm:block text-xs sm:text-sm text-yt-text-secondary mb-4">
                  {isTouchDevice ? 'Select multiple files to create a playlist' : 'Select a folder to auto-create a YouTube playlist'}
                </p>
                <p className="hidden sm:block text-[10px] text-yt-text-secondary">
                  {isTouchDevice ? 'Pick all the videos you want in your playlist' : 'Perfect for courses, tutorials, or series'}
                </p>
              </div>

              <input
                type="file"
                {...{ webkitdirectory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>}
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                accept="video/*,audio/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v,.3gp,.3gpp,.ts,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma,.opus,.aiff,.alac,.amr"
                id="folder-upload-input"
              />
              <input
                type="file"
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                accept="video/*,audio/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v,.3gp,.3gpp,.ts,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma,.opus,.aiff,.alac,.amr"
                id="folder-upload-input-mobile"
              />
            </div>

            {/* Google Photos Import */}
            <div
              className="upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px] p-5 sm:p-8 border-2 border-dashed border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover rounded-xl transition-all"
              role="button"
              tabIndex={0}
              aria-label="Import from Google Photos"
              onClick={() => setIsPhotosPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsPhotosPickerOpen(true)
                }
              }}
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-yt-bg flex items-center justify-center mb-4 sm:mb-6">
                {/* eslint-disable-next-line jsx-a11y/alt-text -- lucide-react icon, not <img> */}
                <Image className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={28} />
              </div>
              <div className="text-center">
                <h4 className="text-sm sm:text-lg font-medium text-yt-text-primary mb-1 sm:mb-2">
                  Google Photos
                </h4>
                <span className="inline-block text-[10px] sm:text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border mb-2 sm:mb-3">
                  CLOUD
                </span>
                <p className="hidden sm:block text-xs sm:text-sm text-yt-text-secondary mb-4">
                  Import videos directly from Google Photos
                </p>
                <p className="hidden sm:block text-[10px] text-yt-text-secondary">
                  Your Google Photos videos, ready for YouTube
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact file bar — shown when files selected and cards collapsed */}
      {hasFiles && !isUploadCardsExpanded && (
        <div className="mb-6">
          <CompactFileBar
            onExpandCards={() => setIsUploadCardsExpanded(true)}
          />
        </div>
      )}

      {/* Main layout: Settings + Progress */}
      {hasFiles ? (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-20 lg:pb-0">
          {/* Settings Column */}
          <div className="lg:col-span-7">
            <UploadSettingsPanel />
          </div>

          {/* Progress Column */}
          <div className="lg:col-span-5">
            <UploadProgress isUploadDisabled={isUploadDisabled} onUpload={handleOptimizedUpload} />
          </div>

          {/* Mobile fixed bottom upload bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-yt-bg/95 backdrop-blur-md border-t border-yt-border px-4 py-3 pb-safe shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-yt-text-secondary min-w-0">
                <span className="font-medium text-yt-text-primary">{videos.filter(v => v.status === 'pending').length}</span>
                {' '}of{' '}
                <span className="font-medium text-yt-text-primary">{videos.length}</span>
                {' '}videos
              </div>
              <button
                onClick={handleOptimizedUpload}
                disabled={isUploadDisabled}
                className="px-5 py-2.5 bg-yt-blue text-black font-medium rounded-full hover:bg-[#65b8ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-shrink-0"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </span>
                ) : (
                  'Upload videos'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state progress panel when no files */
        <UploadProgress isUploadDisabled={true} onUpload={() => {}} />
      )}

      {isPhotosPickerOpen && (
        <GooglePhotosPicker
          isOpen={isPhotosPickerOpen}
          onClose={() => setIsPhotosPickerOpen(false)}
          onImport={handleGooglePhotosImport}
        />
      )}

      {/* Restore Session Banner */}
      {showRestoreSession && !hasFiles && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center">
              <RotateCcw className="mr-2 sm:mr-3 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" size={18} />
              <div>
                <p className="text-blue-300 font-medium text-sm sm:text-base">Previous session found</p>
                <p className="text-blue-400 text-xs sm:text-sm mt-1">Restore your files and continue uploading where you left off.</p>
              </div>
            </div>
            <button 
              onClick={handleRestoreSession} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm self-end sm:self-auto flex-shrink-0"
            >
              Restore Session
            </button>
          </div>
        </div>
      )}
    </>
  )
}
