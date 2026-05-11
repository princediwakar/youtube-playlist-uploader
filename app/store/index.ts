'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { MediaFile, UploadSettings } from '@/app/types/video'
import type { PlaylistItem, YouTubePlaylistVideo } from '@/app/types/video'
import type { UploadQueueItem, UploadStats } from '@/app/hooks/useVideoUpload'

export type { UploadQueueItem, UploadStats } from '@/app/hooks/useVideoUpload'

const IDB_KEYS = {
  videos: 'upload_store_videos',
  uploadQueue: 'upload_store_queue',
  uploadStats: 'upload_store_stats',
  uploadState: 'upload_store_state',
  playlists: 'upload_store_playlists',
  settings: 'upload_store_settings',
  fileHandles: 'upload_store_file_handles',
  fileMetadata: 'upload_store_file_metadata',
} as const

interface FileMetadata {
  name: string
  size: number
  path: string
  folder: string
}

interface FileHandleData {
  id: string
  handle: FileSystemFileHandle
}

interface FileMetadataData {
  id: string
  metadata: FileMetadata
}

interface AppState {
  videos: MediaFile[]
  uploadQueue: UploadQueueItem[]
  uploadStats: UploadStats | null
  isUploading: boolean
  isPaused: boolean
  currentUpload: string | null
  quotaWarning: string | null
  availablePlaylists: PlaylistItem[]
  existingPlaylistVideos: YouTubePlaylistVideo[]
  loadingPlaylists: boolean
  loadingExistingVideos: boolean
  settings: UploadSettings
  showAdvancedSettings: boolean
  currentPlaylistId: string | null
  authError: string | null
  ffmpegEngineReady: boolean
  pendingAudioConversions: Record<string, 'pending' | 'converting' | 'done' | 'error'>
}

interface AppActions {
  setVideos: (videos: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => void
  addVideos: (videos: MediaFile[]) => void
  removeVideo: (index: number) => void
  updateVideo: (index: number, updates: Partial<MediaFile>) => void
  resetVideoStatuses: () => void
  clearVideos: () => void

  setUploadQueue: (queue: UploadQueueItem[] | ((prev: UploadQueueItem[]) => UploadQueueItem[])) => void
  clearUploadQueue: () => void
  setUploadStats: (stats: UploadStats | null) => void

  setIsUploading: (isUploading: boolean) => void
  setIsPaused: (isPaused: boolean) => void
  setCurrentUpload: (current: string | null) => void
  setQuotaWarning: (warning: string | null) => void
  clearQuotaWarning: () => void

  setAvailablePlaylists: (playlists: PlaylistItem[]) => void
  setExistingPlaylistVideos: (videos: YouTubePlaylistVideo[]) => void
  setLoadingPlaylists: (loading: boolean) => void
  setLoadingExistingVideos: (loading: boolean) => void
  clearPlaylistCache: () => void

  setSettings: (settings: UploadSettings | ((prev: UploadSettings) => UploadSettings)) => void
  setShowAdvancedSettings: (show: boolean) => void
  setCurrentPlaylistId: (id: string | null) => void
  setAuthError: (error: string | null) => void

  saveFileHandles: (handles: FileHandleData[]) => Promise<void>
  loadFileHandles: () => Promise<FileHandleData[] | null>
  clearFileHandles: () => Promise<void>
  saveFileMetadata: (metadata: FileMetadataData[]) => Promise<void>
  loadFileMetadata: () => Promise<FileMetadataData[] | null>
  clearFileMetadata: () => Promise<void>

  hasStoredFiles: () => Promise<boolean>
  restoreSession: () => Promise<{ handles: FileHandleData[] | null, metadata: FileMetadataData[] | null }>
  clearSession: () => Promise<void>
  setFfmpegEngineReady: (ready: boolean) => void
  setPendingAudioConversion: (id: string, status: 'pending' | 'converting' | 'done' | 'error') => void
  clearPendingAudioConversion: (id: string) => void
}

const defaultSettings: UploadSettings = {
  playlistName: '',
  privacyStatus: 'private',
  maxVideos: 10,
  contentType: 'auto',
  uploadMode: 'playlist',
  madeForKids: false,
  category: '27',
  titleFormat: 'cleaned',
  customTitlePrefix: '',
  customTitleSuffix: '',
  addPlaylistNavigation: true,
  useExistingPlaylist: false,
  selectedPlaylistId: '',
  audioCategory: '10',
  generateAudioFrames: true,
}

const initialState: AppState = {
  videos: [],
  uploadQueue: [],
  uploadStats: null,
  isUploading: false,
  isPaused: false,
  currentUpload: null,
  quotaWarning: null,
  availablePlaylists: [],
  existingPlaylistVideos: [],
  loadingPlaylists: false,
  loadingExistingVideos: false,
  settings: defaultSettings,
  showAdvancedSettings: false,
  currentPlaylistId: null,
  authError: null,
  ffmpegEngineReady: false,
  pendingAudioConversions: {},
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet(name)
    return value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name)
  },
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, _get) => ({
      ...initialState,

      setVideos: (videos) => set((state) => ({
        videos: typeof videos === 'function' ? videos(state.videos) : videos
      })),

      addVideos: (newVideos) => set((state) => ({
        videos: [...state.videos, ...newVideos]
      })),

      removeVideo: (index) => set((state) => ({
        videos: state.videos.filter((_, i) => i !== index)
      })),

      updateVideo: (index, updates) => set((state) => ({
        videos: state.videos.map((v, i) => i === index ? { ...v, ...updates } : v)
      })),

      resetVideoStatuses: () => set((state) => ({
        videos: state.videos.map((v) => ({
          ...v,
          status: 'pending' as const,
          progress: 0,
          error: undefined,
          videoId: undefined
        }))
      })),

      clearVideos: () => set({ videos: [] }),

      setUploadQueue: (queue) => set((state) => ({
        uploadQueue: typeof queue === 'function' ? queue(state.uploadQueue) : queue
      })),

      clearUploadQueue: () => set({ uploadQueue: [] }),

      setUploadStats: (stats) => set({ uploadStats: stats }),

      setIsUploading: (isUploading) => set({ isUploading }),

      setIsPaused: (isPaused) => set({ isPaused }),

      setCurrentUpload: (currentUpload) => set({ currentUpload }),

      setQuotaWarning: (quotaWarning) => set({ quotaWarning }),

      clearQuotaWarning: () => set({ quotaWarning: null }),

      setAvailablePlaylists: (availablePlaylists) => set({ availablePlaylists }),

      setExistingPlaylistVideos: (existingPlaylistVideos) => set({ existingPlaylistVideos }),

      setLoadingPlaylists: (loadingPlaylists) => set({ loadingPlaylists }),

      setLoadingExistingVideos: (loadingExistingVideos) => set({ loadingExistingVideos }),

      clearPlaylistCache: () => set({ availablePlaylists: [] }),

      setSettings: (settings) => set((state) => ({
        settings: typeof settings === 'function' ? settings(state.settings) : settings
      })),

      setShowAdvancedSettings: (showAdvancedSettings) => set({ showAdvancedSettings }),

      setCurrentPlaylistId: (currentPlaylistId) => set({ currentPlaylistId }),

      setAuthError: (authError) => set({ authError }),

      saveFileHandles: async (handles) => {
        await idbSet(IDB_KEYS.fileHandles, handles)
      },

      loadFileHandles: async () => {
        const value = await idbGet<FileHandleData[]>(IDB_KEYS.fileHandles)
        return value ?? null
      },

      clearFileHandles: async () => {
        await idbDel(IDB_KEYS.fileHandles)
      },

      saveFileMetadata: async (metadata) => {
        await idbSet(IDB_KEYS.fileMetadata, metadata)
      },

      loadFileMetadata: async () => {
        const value = await idbGet<FileMetadataData[]>(IDB_KEYS.fileMetadata)
        return value ?? null
      },

      clearFileMetadata: async () => {
        await idbDel(IDB_KEYS.fileMetadata)
      },

      hasStoredFiles: async () => {
        const handles = await idbGet(IDB_KEYS.fileHandles)
        const metadata = await idbGet(IDB_KEYS.fileMetadata)
        return !!(handles?.length || metadata?.length)
      },

      restoreSession: async () => {
        const handles = await idbGet<FileHandleData[]>(IDB_KEYS.fileHandles) ?? null
        const metadata = await idbGet<FileMetadataData[]>(IDB_KEYS.fileMetadata) ?? null
        return { handles, metadata }
      },

      clearSession: async () => {
        await idbDel(IDB_KEYS.fileHandles)
        await idbDel(IDB_KEYS.fileMetadata)
      },

      setFfmpegEngineReady: (ready) => set({ ffmpegEngineReady: ready }),

      setPendingAudioConversion: (id, status) => set((state) => ({
        pendingAudioConversions: { ...state.pendingAudioConversions, [id]: status }
      })),

      clearPendingAudioConversion: (id) => set((state) => {
        const next = { ...state.pendingAudioConversions }
        delete next[id]
        return { pendingAudioConversions: next }
      }),
    }),
    {
      name: 'youtube-upload-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        settings: state.settings,
        showAdvancedSettings: state.showAdvancedSettings,
        currentPlaylistId: state.currentPlaylistId,
        isPaused: state.isPaused,
        quotaWarning: state.quotaWarning,
        uploadQueue: state.uploadQueue.map(item => ({
          ...item,
          video: {
            ...item.video,
            file: undefined,
          }
        })),
      }),
    }
  )
)

export const isFileHandleSupported = typeof window !== 'undefined' && 
  'showOpenFilePicker' in window

export async function storeFileHandle(_file: File): Promise<FileSystemFileHandle | null> {
  if (!isFileHandleSupported) return null
  
  try {
    const handles = await (window as unknown as { showOpenFilePicker: (options: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
      multiple: false,
      types: [{
        description: 'Media files',
        accept: {
          'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp', '.3gpp', '.ts'],
          'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.opus', '.aiff', '.alac', '.amr'],
        },
      }],
    })
    return handles[0]
  } catch {
    return null
  }
}

export async function getFileFromHandle(handle: FileSystemFileHandle): Promise<File | null> {
  try {
    return await handle.getFile()
  } catch {
    return null
  }
}