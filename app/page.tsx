'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Upload, Youtube, FolderOpen, User, LogOut, AlertCircle, Clock, Play, X, ChevronDown, Check, Database, Sparkles } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { VideoFile, UploadSettings, PlaylistItem } from '@/app/types/video'
import { formatFileSize, extractPlaylistName, analyzeVideo, generateTitle, checkForDuplicateVideos, calculateInsertionPositions } from '@/app/utils/videoHelpers'
import { VideoList } from '@/app/components/VideoList'
import { PlaylistSelector } from '@/app/components/PlaylistSelector'
import { UploadSettingsPanel } from '@/app/components/UploadSettingsPanel'
import { UploadProgress } from '@/app/components/UploadProgress'
import { useFileHandling } from '@/app/hooks/useFileHandling'
import { usePlaylistManager } from '@/app/hooks/usePlaylistManager'
import { useVideoProcessing } from '@/app/hooks/useVideoProcessing'
import { useVideoUpload } from '@/app/hooks/useVideoUpload'

export default function HomePage() {
  const { data: session, status } = useSession()
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
    currentUpload,
    uploadQueue,
    uploadVideo,
    uploadVideos,
    addNavigationLinks
  } = useVideoUpload()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    playlistName: '',
    privacyStatus: 'public',
    maxVideos: 10,
    contentType: 'auto',
    // Upload mode
    uploadMode: 'playlist',
    // Advanced settings
    madeForKids: false,
    category: '27', // Education
    useAiAnalysis: true,
    titleFormat: 'original',
    customTitlePrefix: '',
    customTitleSuffix: '',
    addPlaylistNavigation: true,
    // Playlist selection
    useExistingPlaylist: false,
    selectedPlaylistId: ''
  })
  const generateVideoThumbnail = (file: File): Promise<string> => {
    return analyzeVideo(file).then(result => result.thumbnail)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newVideos = replaceVideos(acceptedFiles)
    
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
      const shortVideos = videos.filter(v => v.isShort).length
      if (shortVideos > 0 && shortVideos === videos.length) {
        // All videos are Shorts, suggest individual upload
        setUploadSettings(prev => ({ ...prev, uploadMode: 'individual' }))
      }
    }, 2000) // Give time for video analysis to complete
  }, [uploadSettings.playlistName, uploadSettings.category, replaceVideos, videos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'video/*': [] } });

  // Handle folder selection
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onDrop(files)
  }


  // Optimized upload function
  const handleOptimizedUpload = async () => {
    if (!session) return

    try {
      const initialVideosToProcess = videos.filter(v => v.status === 'pending').slice(0, uploadSettings.maxVideos)
      
      // Phase 1: Playlist management & fetch existing videos
      let playlistId: string | null = null
      let existingVideos: Array<{videoId: string, title: string, position: number}> = []
      
      if (uploadSettings.uploadMode === 'playlist') {
        if (uploadSettings.useExistingPlaylist) {
          if (!uploadSettings.selectedPlaylistId) {
            throw new Error('Please select an existing playlist')
          }
          playlistId = uploadSettings.selectedPlaylistId
          setCurrentPlaylistId(playlistId)
          
          // Fetch existing videos for duplicate detection
          existingVideos = await fetchExistingPlaylistVideos(playlistId) || []
        } else {
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
          
          // Invalidate playlists cache when a new playlist is created
          clearPlaylistCache()
          console.log('Playlists cache invalidated due to new playlist creation')
        }
      }

      // Phase 2: Filter duplicates BEFORE pre-processing
      let videosToProcess = initialVideosToProcess
      if (uploadSettings.uploadMode === 'playlist' && uploadSettings.useExistingPlaylist && existingVideos.length > 0) {
        videosToProcess = checkForDuplicateVideos(initialVideosToProcess, existingVideos, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix, uploadSettings.useAiAnalysis)
        
        const skippedCount = initialVideosToProcess.length - videosToProcess.length
        if (skippedCount > 0) {
          console.log(`Filtered ${skippedCount} duplicate videos before processing`)
          // Mark skipped videos as completed visually
          const videosToProcessPaths = new Set(videosToProcess.map(v => v.path))
          const skippedPaths = initialVideosToProcess
            .filter(v => !videosToProcessPaths.has(v.path))
            .map(v => v.path)
          setVideos(prev => prev.map(v =>
            skippedPaths.includes(v.path) ? { ...v, status: 'completed', progress: 100 } : v
          ))
        }
      }

      // Phase 3: Pre-processing (AI generation etc.) only on non-duplicates
      const processedVideos = await preProcessVideos(videosToProcess, uploadSettings)

      // Calculate positions for videos
      let positions: number[] = []
      if (uploadSettings.uploadMode === 'playlist' && uploadSettings.useExistingPlaylist) {
        // Compute positions for all initial videos
        const allPositions = calculateInsertionPositions(initialVideosToProcess, existingVideos, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix, uploadSettings.useAiAnalysis)
        // Map to videosToProcess (non-duplicates) using path for reliable lookup
        const positionMap = new Map<string, number>()
        initialVideosToProcess.forEach((video, index) => {
          positionMap.set(video.path, allPositions[index])
        })
        positions = videosToProcess.map(video => positionMap.get(video.path) || 0)
      } else {
        // New playlist or individual upload: positions start from 0
        positions = processedVideos.map((_, index) => index)
      }

      // Prepare upload queue with positions
      const uploadQueue = processedVideos.map(({ video, metadata }, index) => ({
        video,
        metadata,
        position: positions[index]
      }))


      // Update status to uploading for all videos in the queue
      setVideos(prev => prev.map(v =>
        uploadQueue.some(item => item.video.file === v.file)
          ? { ...v, status: 'uploading', progress: 0 }
          : v
      ))

      // Phase 4: Use uploadVideos hook for parallel uploads
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

          // Invalidate playlist videos cache when video is successfully uploaded to playlist
          if (playlistId) {
            clearPlaylistVideosCache(playlistId)
            console.log('Playlist videos cache invalidated for playlist:', playlistId)
          }

          // Add navigation links immediately if enabled
          if (uploadSettings.addPlaylistNavigation && result.videoId && playlistId) {
            // Use addNavigationLinks from hook
            addNavigationLinks(result.videoId, playlistId, uploadQueue.find(item => item.video.file === video.file)?.position || 0)
              .catch(navError => {
                console.error('Navigation link failed for video:', video.name, navError)
              })
          }
        },
        // onVideoError callback
        (video, error) => {
          console.error('Upload error for video:', video.name, error)
          setVideos(prev => prev.map(v =>
            v.file === video.file
              ? {
                  ...v,
                  status: 'error',
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : v
          ))
        }
      )

    } catch (error) {
      console.error('Upload process error:', error)
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const completedUploads = videos.filter(v => v.status === 'completed').length;
  const totalVideos = videos.length;

  return (
    <div className="min-h-screen relative font-sans text-gray-300 selection:bg-youtube-neon selection:text-black pb-8 overflow-x-hidden">
      {/* Structural Wireframe Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30">
        <div className="absolute top-0 left-4 md:left-10 lg:left-20 w-[1px] h-full bg-yt-border"></div>
        <div className="absolute top-0 right-4 md:right-10 lg:right-20 w-[1px] h-full bg-yt-border"></div>
      </div>

      {/* Clean Studio Header */}
      <header className="border-b border-yt-border bg-yt-bg/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-0 sm:h-20 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yt-red rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <Youtube className="text-yt-text-primary relative z-10" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-medium text-yt-text-primary tracking-tight">
                  YouTube Uploader
                </h1>
                <span className="text-[10px] md:text-xs text-yt-text-secondary mt-0.5">
                  Studio Interface // {session ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 ml-auto">
              {session ? (
                <div className="flex items-center space-x-4 md:space-x-6">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-yt-text-primary">{session.user?.name}</span>
                    <span className="text-xs text-green-500 flex items-center justify-end">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center text-yt-text-secondary hover:text-yt-text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-yt-hover"
                  >
                    <LogOut className="mr-2" size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="btn-primary flex items-center py-2 px-4 md:py-3 md:px-6 text-xs md:text-sm"
                >
                  <User className="mr-2 md:mr-3" size={16} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-20 py-8 md:py-12">
        {!session ? (
          /* Not Authenticated State */
          <div className="flex flex-col items-center justify-center py-12 md:py-32">
            <div className="relative mb-12">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-yt-panel rounded-full flex items-center justify-center shadow-lg border border-yt-border">
                <Youtube className="text-yt-red" size={64} />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-medium text-yt-text-primary mb-6 tracking-tight text-center leading-tight">
              A Better Way to <br/><span className="text-yt-blue">Upload Videos</span>
            </h2>
            
            <p className="text-yt-text-secondary text-sm md:text-base max-w-2xl text-center mb-12 leading-relaxed">
              Simplify your workflow. Upload individual videos or entire playlists directly to your YouTube channel with smart, AI-powered defaults that save you time.
            </p>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 w-full">
              <div className="upload-card group flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
                  <FolderOpen className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-yt-text-primary font-medium mb-2 text-base">Select Videos</h3>
                <p className="text-sm text-yt-text-secondary">Upload multiple video files or select entire folders from your computer.</p>
              </div>
              <div className="upload-card group flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
                  <Upload className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-yt-text-primary font-medium mb-2 text-base">Processing & AI</h3>
                <p className="text-sm text-yt-text-secondary">Save time with AI-generated titles, descriptions, categories, and tags.</p>
              </div>
              <div className="upload-card group flex flex-col items-center text-center sm:col-span-2 md:col-span-1">
                <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
                  <Youtube className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-yt-text-primary font-medium mb-2 text-base">Start Upload</h3>
                <p className="text-sm text-yt-text-secondary">Publish directly to your YouTube channel with correct playlist organization.</p>
              </div>
            </div>
            
            <button
              onClick={() => signIn('google')}
              className="btn-primary flex items-center"
            >
              <User className="mr-2" size={20} />
              <span>Sign In with Google</span>
            </button>
          </div>
        ) : (
          /* Authenticated - Main App Grid */
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
                            Drag and drop multiple video files or click to select them individually
                          </p>
                          <div className="mt-4 text-xs text-yt-text-secondary">
                            MP4, MOV, AVI, MKV, WEBM, FLV, WMV
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
                          Select a folder containing videos to automatically create a YouTube playlist. Videos are ordered by filename.
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
                        accept="video/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v"
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
                          Ready to upload: {videos.length} video{videos.length !== 1 ? 's' : ''}
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
                onRemoveVideo={removeVideo}
              />
            </div>
          </div>
        )}
      </main>

    </div>
  )
}



