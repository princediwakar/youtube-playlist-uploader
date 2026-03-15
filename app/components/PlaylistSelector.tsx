'use client'

import { ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { UploadSettings, PlaylistItem } from '@/app/types/video'

interface PlaylistSelectorProps {
  uploadSettings: UploadSettings
  onSettingsChange: (settings: Partial<UploadSettings>) => void
  availablePlaylists: PlaylistItem[]
  loadingPlaylists: boolean
  existingPlaylistVideos: any[]
  onFetchUserPlaylists: (forceRefresh?: boolean) => void
  onFetchExistingPlaylistVideos: (playlistId: string) => void
  onClearPlaylistCache: () => void
  onClearPlaylistVideosCache: () => void
  onSetExistingPlaylistVideos: (videos: any[]) => void
}

export function PlaylistSelector({
  uploadSettings,
  onSettingsChange,
  availablePlaylists,
  loadingPlaylists,
  existingPlaylistVideos,
  onFetchUserPlaylists,
  onFetchExistingPlaylistVideos,
  onClearPlaylistCache,
  onClearPlaylistVideosCache,
  onSetExistingPlaylistVideos
}: PlaylistSelectorProps) {
  const { data: session } = useSession()

  // Only show when upload mode is playlist
  if (uploadSettings.uploadMode !== 'playlist') {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-yt-text-primary">Playlist Settings</h4>
        <div className="flex items-center space-x-4">
          {availablePlaylists.length > 0 && (
            <div className="flex items-center text-xs text-yt-text-secondary">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
              Loaded ({availablePlaylists.length})
              <button
                onClick={() => {
                  onClearPlaylistCache()
                  onClearPlaylistVideosCache()
                  onSetExistingPlaylistVideos([])
                }}
                className="ml-3 text-yt-blue hover:text-[#65b8ff] font-medium"
              >
                Refresh
              </button>
            </div>
          )}
          {session && !loadingPlaylists && availablePlaylists.length === 0 && (
            <button
              onClick={() => onFetchUserPlaylists(true)}
              className="text-xs text-yt-blue hover:text-[#65b8ff] font-medium"
            >
              Load Playlists
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 mb-5">
        <label className="flex items-center cursor-pointer group">
          <input
            type="radio"
            name="playlistMode"
            checked={!uploadSettings.useExistingPlaylist}
            onChange={() => {
              onSettingsChange({
                useExistingPlaylist: false,
                selectedPlaylistId: ''
              })
              onSetExistingPlaylistVideos([])
            }}
            className="sr-only"
          />
          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${!uploadSettings.useExistingPlaylist ? 'border-yt-blue' : 'border-yt-text-secondary group-hover:border-yt-text-primary'}`}>
            {!uploadSettings.useExistingPlaylist && <div className="w-2 h-2 rounded-full bg-yt-blue"></div>}
          </div>
          <span className={`text-sm font-medium ${!uploadSettings.useExistingPlaylist ? 'text-yt-text-primary' : 'text-yt-text-secondary group-hover:text-yt-text-primary'}`}>Create New Playlist</span>
        </label>

        <label className="flex items-center cursor-pointer group">
          <input
            type="radio"
            name="playlistMode"
            checked={uploadSettings.useExistingPlaylist}
            onChange={() => {
              onSettingsChange({ useExistingPlaylist: true })
              if (availablePlaylists.length === 0 && !loadingPlaylists) {
                onFetchUserPlaylists()
              }
            }}
            className="sr-only"
          />
          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${uploadSettings.useExistingPlaylist ? 'border-yt-blue' : 'border-yt-text-secondary group-hover:border-yt-text-primary'}`}>
            {uploadSettings.useExistingPlaylist && <div className="w-2 h-2 rounded-full bg-yt-blue"></div>}
          </div>
          <span className={`text-sm font-medium flex items-center ${uploadSettings.useExistingPlaylist ? 'text-yt-text-primary' : 'text-yt-text-secondary group-hover:text-yt-text-primary'}`}>
            Add to Existing Playlist
            {loadingPlaylists && <span className="ml-2 text-xs text-yt-blue bg-yt-blue/10 px-2 py-0.5 rounded animate-pulse">Loading...</span>}
          </span>
        </label>
      </div>

      {!uploadSettings.useExistingPlaylist && (
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 p-3 text-xs text-yt-text-secondary block pointer-events-none transition-opacity duration-200 opacity-0 peer-focus:opacity-100">Title (required)</div>
          <input
            type="text"
            value={uploadSettings.playlistName}
            onChange={(e) => onSettingsChange({ playlistName: e.target.value })}
            className="w-full bg-yt-bg text-yt-text-primary px-4 py-3 rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none placeholder:text-yt-text-secondary"
            placeholder="Add title"
          />
        </div>
      )}

      {uploadSettings.useExistingPlaylist && (
        <div className="mt-4">
          {loadingPlaylists ? (
            <div className="w-full bg-yt-bg text-yt-text-primary px-4 py-3 rounded-lg border border-yt-border flex items-center">
              <span className="w-2 h-2 rounded-full bg-yt-blue mr-3 animate-pulse inline-block"></span>
              <span className="text-yt-text-secondary text-sm">Loading your playlists...</span>
            </div>
          ) : availablePlaylists.length > 0 ? (
            <div className="relative">
              <select
                value={uploadSettings.selectedPlaylistId}
                onChange={(e) => {
                  const playlistId = e.target.value
                  onSettingsChange({ selectedPlaylistId: playlistId })
                  if (playlistId) {
                    onFetchExistingPlaylistVideos(playlistId)
                  } else {
                    onSetExistingPlaylistVideos([])
                  }
                }}
                className="w-full bg-yt-bg text-yt-text-primary px-4 py-3 rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none appearance-none"
              >
                <option value="" className="text-yt-text-secondary">Select a playlist</option>
                {availablePlaylists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.snippet.title} ({playlist.contentDetails.itemCount} videos)
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-yt-text-secondary">
                <ChevronDown size={16} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-red-900/10 rounded-lg border border-red-900/30 text-sm text-yt-text-secondary">
                <span className="text-yt-red mr-2 font-medium">Notice:</span>
                No playlists found.
                <button
                  onClick={() => onFetchUserPlaylists(true)}
                  className="text-yt-text-primary hover:text-yt-blue ml-2 font-medium"
                >
                  Try Again
                </button>
              </div>

              <div className="p-4 bg-yt-panel border border-yt-border rounded-lg">
                <h5 className="text-sm font-medium text-yt-text-primary mb-3">Enter Playlist ID Manually</h5>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter Playlist ID..."
                    className="flex-1 bg-yt-bg text-yt-text-primary px-4 py-2 rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none placeholder:text-yt-text-secondary"
                    onChange={(e) => {
                      const playlistId = e.target.value.trim()
                      if (playlistId) {
                        onSettingsChange({ selectedPlaylistId: playlistId })
                        onFetchExistingPlaylistVideos(playlistId)
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const playlistId = 'PLExdYlNNwoiS7KfsjlIy3UHY69r0Qy-e5'
                      onSettingsChange({ selectedPlaylistId: playlistId })
                      onFetchExistingPlaylistVideos(playlistId)
                    }}
                    className="px-4 py-2 bg-transparent border border-yt-border rounded-lg text-yt-text-secondary hover:text-yt-text-primary hover:border-yt-text-secondary text-sm whitespace-nowrap transition-colors"
                  >
                    Use test ID
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}