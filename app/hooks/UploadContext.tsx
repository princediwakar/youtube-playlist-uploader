'use client'

import { createContext, useContext } from 'react'
import type { MediaFile, UploadSettings, PlaylistItem, YouTubePlaylistVideo } from '@/app/types/video'
import type { UploadQueueItem, UploadStats } from '@/app/hooks/useVideoUpload'

interface PreProcessingStatus {
  isPreProcessing: boolean
  currentStep: string
  progress: number
  totalSteps: number
}

interface AiProcessing {
  categoryAnalysis: boolean
  playlistAnalysis: boolean
  videoAnalysis: boolean
  currentVideoAnalysis: string | null
  addingNavigation: boolean
}

export interface UploadContextValue {
  // File state
  videos: MediaFile[]
  setVideos: (videos: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => void
  addVideos: (files: File[]) => { added: MediaFile[]; errors: string[] }
  replaceVideos: (files: File[]) => { added: MediaFile[]; errors: string[] }
  removeVideo: (index: number) => void
  updateVideoStatus: (index: number, updates: Partial<MediaFile>) => void
  resetVideoStatuses: () => void

  // Playlist state
  availablePlaylists: PlaylistItem[]
  loadingPlaylists: boolean
  existingPlaylistVideos: YouTubePlaylistVideo[]
  loadingExistingVideos: boolean
  setExistingPlaylistVideos: (videos: YouTubePlaylistVideo[] | ((prev: YouTubePlaylistVideo[]) => YouTubePlaylistVideo[])) => void
  fetchUserPlaylists: (forceRefresh?: boolean) => void
  fetchExistingPlaylistVideos: (playlistId: string, forceRefresh?: boolean) => Promise<YouTubePlaylistVideo[]>
  clearPlaylistCache: () => void
  clearPlaylistVideosCache: (playlistId?: string) => void

  // Processing state
  preProcessingStatus: PreProcessingStatus
  aiProcessing: AiProcessing
  preProcessVideos: (
    videos: MediaFile[],
    uploadSettings: UploadSettings,
    onVideoProcessed?: (video: MediaFile, metadata: { title: string; description: string; tags: string[]; category: string }) => void,
    signal?: AbortSignal
  ) => Promise<Array<{ video: MediaFile; metadata: { title: string; description: string; tags: string[]; category: string } }>>
  generatePlaylistDescription: (videos: MediaFile[], uploadSettings: UploadSettings) => Promise<string>
  suggestCategory: (videos: MediaFile[], signal?: AbortSignal) => Promise<string | null>
  setAiProcessingState: (updates: Partial<AiProcessing>) => void

  // Upload state
  isUploading: boolean
  isPaused: boolean
  currentUpload: string | null
  uploadQueue: UploadQueueItem[]
  uploadStats: UploadStats | null
  quotaWarning: string | null
  pauseUpload: () => void
  resumeUpload: () => void
  cancelUpload: () => void
  clearQuotaWarning: () => void

  // Settings & UI
  uploadSettings: UploadSettings
  setUploadSettings: (settings: UploadSettings | ((prev: UploadSettings) => UploadSettings)) => void
  showAdvancedSettings: boolean
  setShowAdvancedSettings: (show: boolean) => void
  currentPlaylistId: string | null
  setCurrentPlaylistId: (id: string | null) => void
  authError: string | null
  setAuthError: (error: string | null) => void

  // Upload action
  handleOptimizedUpload: () => Promise<void>
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function useUploadContext(): UploadContextValue {
  const ctx = useContext(UploadContext)
  if (!ctx) {
    throw new Error('useUploadContext must be used within an UploadContext.Provider')
  }
  return ctx
}

export default UploadContext
