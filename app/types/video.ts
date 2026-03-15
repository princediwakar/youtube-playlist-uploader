export interface VideoFile {
  file: File
  name: string
  size: string
  path: string
  relativePath: string
  folder: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  videoId?: string
  error?: string
  thumbnail?: string
  isShort?: boolean
  duration?: number
  aspectRatio?: number
}

export interface UploadSettings {
  playlistName: string
  privacyStatus: 'private' | 'unlisted' | 'public'
  maxVideos: number
  contentType: string
  // Upload mode
  uploadMode: 'playlist' | 'individual'
  // Advanced settings
  madeForKids: boolean
  category: string
  useAiAnalysis: boolean
  titleFormat: 'original' | 'cleaned' | 'custom'
  customTitlePrefix: string
  customTitleSuffix: string
  addPlaylistNavigation: boolean
  // Playlist selection
  useExistingPlaylist: boolean
  selectedPlaylistId: string
}

export interface PlaylistItem {
  id: string
  snippet: {
    title: string
    description?: string
    publishedAt: string
  }
  contentDetails: {
    itemCount: number
  }
}