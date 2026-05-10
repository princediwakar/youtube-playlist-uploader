'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Upload, FolderOpen, Image, AlertTriangle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { UploadSettings, isVideoFile } from '@/app/types/video'
import type { GooglePhotosImportItem } from '@/app/types/googlePhotos'
import { extractPlaylistName } from '@/app/utils/videoHelpers'
import GooglePhotosPicker from '@/app/components/GooglePhotosPicker'
import { PlaylistSelector } from '@/app/components/PlaylistSelector'
import { UploadSettingsPanel } from '@/app/components/UploadSettingsPanel'
import { UploadProgress } from '@/app/components/UploadProgress'
import { useFileHandling } from '@/app/hooks/useFileHandling'
import { usePlaylistManager } from '@/app/hooks/usePlaylistManager'
import { useVideoProcessing } from '@/app/hooks/useVideoProcessing'
import { useVideoUpload } from '@/app/hooks/useVideoUpload'
import { useUploadOrchestrator } from '@/app/hooks/useUploadOrchestrator'
import UploadContext from '@/app/hooks/UploadContext'
import type { Session } from 'next-auth'

interface UploadScreenProps {
  session: Session
}

export default function UploadScreen({ session }: UploadScreenProps) {

  const {
    videos, setVideos, addVideos, replaceVideos, removeVideo,
    updateVideoStatus, resetVideoStatuses,
  } = useFileHandling()
  const {
    availablePlaylists, loadingPlaylists,
    existingPlaylistVideos, loadingExistingVideos,
    setExistingPlaylistVideos, fetchUserPlaylists,
    fetchExistingPlaylistVideos, clearPlaylistCache, clearPlaylistVideosCache,
  } = usePlaylistManager()
  const {
    preProcessingStatus, aiProcessing,
    preProcessVideos, generatePlaylistDescription,
    suggestCategory, setAiProcessingState,
  } = useVideoProcessing()
  const {
    isUploading, isPaused, currentUpload, uploadQueue,
    uploadStats, quotaWarning,
    pauseUpload, resumeUpload, cancelUpload, clearQuotaWarning,
    uploadVideos, addNavigationLinks,
  } = useVideoUpload()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isPhotosPickerOpen, setIsPhotosPickerOpen] = useState(false)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    playlistName: '',
    privacyStatus: 'private',
    maxVideos: 10,
    contentType: 'auto',
    uploadMode: 'playlist',
    madeForKids: false,
    category: '27',
    useAiAnalysis: false,
    titleFormat: 'cleaned',
    customTitlePrefix: '',
    customTitleSuffix: '',
    addPlaylistNavigation: true,
    useExistingPlaylist: false,
    selectedPlaylistId: '',
    audioCategory: '10',
    generateAudioFrames: true,
  })

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to async analysis completion
      setUploadSettings(prev => ({ ...prev, uploadMode: 'individual' }))
    }
  }, [videos])

  // Reset Shorts detection when files are replaced
  const onDrop = useCallback((acceptedFiles: File[]) => {
    shortsDetectedRef.current = false
    const { added: newVideos, errors } = replaceVideos(acceptedFiles)

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
    }

    if (newVideos.length === 0) return

    setCurrentPlaylistId(null)

    if (newVideos.length > 0 && !uploadSettings.playlistName) {
      const rootFolder = newVideos[0].folder
      const playlistName = rootFolder !== 'Root' ? rootFolder : extractPlaylistName(newVideos[0].name)
      setUploadSettings(prev => ({ ...prev, playlistName }))
    }
  }, [uploadSettings.playlistName, replaceVideos, setVideos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [], 'audio/*': [] },
  })

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onDrop(files)
  }

  const handleGooglePhotosImport = useCallback((items: GooglePhotosImportItem[]) => {
    shortsDetectedRef.current = false

    const placeholderFiles = items.map(item => {
      const ext = item.mimeType.split('/')[1] || 'mp4'
      return new File([new Blob()], `${item.filename || item.id}.${ext}`, { type: item.mimeType })
    })

    const { added: newVideos } = replaceVideos(placeholderFiles)

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
        name: match.filename || v.name,
        size: 'Google Photos',
      }
    }))

    setIsPhotosPickerOpen(false)
  }, [replaceVideos, setVideos])

  const { handleOptimizedUpload } = useUploadOrchestrator({
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
    preProcessVideos,
    generatePlaylistDescription,
    uploadVideos,
    addNavigationLinks,
    cancelUpload,
    clearQuotaWarning,
  })

  const contextValue = useMemo(() => ({
    videos, setVideos, addVideos, replaceVideos, removeVideo, updateVideoStatus, resetVideoStatuses,
    availablePlaylists, loadingPlaylists, existingPlaylistVideos, loadingExistingVideos,
    setExistingPlaylistVideos, fetchUserPlaylists, fetchExistingPlaylistVideos,
    clearPlaylistCache, clearPlaylistVideosCache,
    preProcessingStatus, aiProcessing, preProcessVideos, generatePlaylistDescription,
    suggestCategory, setAiProcessingState,
    isUploading, isPaused, currentUpload, uploadQueue, uploadStats, quotaWarning,
    pauseUpload, resumeUpload, cancelUpload, clearQuotaWarning,
    uploadSettings, setUploadSettings, showAdvancedSettings, setShowAdvancedSettings,
    currentPlaylistId, setCurrentPlaylistId, authError, setAuthError,
    handleOptimizedUpload,
  }), [
    videos, setVideos, addVideos, replaceVideos, removeVideo, updateVideoStatus, resetVideoStatuses,
    availablePlaylists, loadingPlaylists, existingPlaylistVideos, loadingExistingVideos,
    setExistingPlaylistVideos, fetchUserPlaylists, fetchExistingPlaylistVideos,
    clearPlaylistCache, clearPlaylistVideosCache,
    preProcessingStatus, aiProcessing, preProcessVideos, generatePlaylistDescription,
    suggestCategory, setAiProcessingState,
    isUploading, isPaused, currentUpload, uploadQueue, uploadStats, quotaWarning,
    pauseUpload, resumeUpload, cancelUpload, clearQuotaWarning,
    uploadSettings, showAdvancedSettings, currentPlaylistId, authError,
    handleOptimizedUpload,
  ])

  return (
    <UploadContext.Provider value={contextValue}>
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
            <div className="grid md:grid-cols-3 gap-6">
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
                      Video: MP4, MOV, AVI, MKV, WEBM, FLV, WMV · Audio: MP3, WAV, M4A, FLAC, OGG, AAC
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
                  {...{ webkitdirectory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>}
                  multiple
                  onChange={handleFolderSelect}
                  className="hidden"
                  accept="video/*,audio/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma,.opus,.aiff,.alac"
                  id="folder-upload-input"
                />
              </div>

              {/* Google Photos Import */}
              <div
                className="upload-card cursor-pointer group flex flex-col items-center justify-center min-h-[240px] p-8 border-2 border-dashed border-yt-border hover:border-yt-text-secondary hover:bg-yt-hover"
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
                <div className="w-20 h-20 rounded-full bg-yt-bg flex items-center justify-center mb-6">
                  <Image className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={36} />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <h4 className="text-lg font-medium text-yt-text-primary">
                      Google Photos
                    </h4>
                    <span className="ml-2 text-xs bg-yt-bg text-yt-text-secondary px-2 py-0.5 rounded-full border border-yt-border">
                      CLOUD
                    </span>
                  </div>
                  <p className="text-sm text-yt-text-secondary mb-6">
                    Browse and import your videos directly from Google Photos. Select multiple videos to add to your upload queue.
                  </p>
                  <div className="mt-4 text-xs text-yt-text-secondary">
                    Your Google Photos videos, ready for YouTube
                  </div>
                </div>
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

        {/* Upload Settings - no props, consumes context */}
        {videos.length > 0 && <UploadSettingsPanel />}
      </div>
      {/* Progress Panel - no props, consumes context */}
      <div className="lg:col-span-4 w-full self-stretch">
        <UploadProgress />
      </div>
    </div>
    {isPhotosPickerOpen && (
      <GooglePhotosPicker
        isOpen={isPhotosPickerOpen}
        onClose={() => setIsPhotosPickerOpen(false)}
        onImport={handleGooglePhotosImport}
      />
    )}
    </UploadContext.Provider>
  )
}
