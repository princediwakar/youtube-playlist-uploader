// Re-export types from media module for backward compatibility
export * from './media'

// Keep VideoFile as an alias for backward compatibility
// Note: VideoFile is now defined in media.ts as part of discriminated union

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
  // Audio-specific settings
  audioCategory: string
  generateAudioFrames: boolean
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