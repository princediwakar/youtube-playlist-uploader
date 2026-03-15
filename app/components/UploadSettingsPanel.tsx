'use client'

import { ChevronDown, Check, Database, Sparkles } from 'lucide-react'
import { PlaylistSelector } from './PlaylistSelector'
import { UploadSettings, PlaylistItem, VideoFile } from '@/app/types/video'

interface UploadSettingsPanelProps {
  videos: VideoFile[]
  uploadSettings: UploadSettings
  onSettingsChange: (settings: Partial<UploadSettings>) => void
  availablePlaylists: PlaylistItem[]
  loadingPlaylists: boolean
  existingPlaylistVideos: any[]
  showAdvancedSettings: boolean
  onToggleAdvancedSettings: () => void
  onFetchUserPlaylists: (forceRefresh?: boolean) => void
  onFetchExistingPlaylistVideos: (playlistId: string) => void
  onClearPlaylistCache: () => void
  onClearPlaylistVideosCache: () => void
  onSetExistingPlaylistVideos: (videos: any[]) => void
  onUpload: () => void
  isUploading: boolean
  totalVideos: number
  totalQueued: number
}

export function UploadSettingsPanel({
  videos,
  uploadSettings,
  onSettingsChange,
  availablePlaylists,
  loadingPlaylists,
  existingPlaylistVideos,
  showAdvancedSettings,
  onToggleAdvancedSettings,
  onFetchUserPlaylists,
  onFetchExistingPlaylistVideos,
  onClearPlaylistCache,
  onClearPlaylistVideosCache,
  onSetExistingPlaylistVideos,
  onUpload,
  isUploading,
  totalVideos,
  totalQueued
}: UploadSettingsPanelProps) {
  // Only render if there are videos
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="panel">
      <div className="flex justify-between items-center border-b border-yt-border pb-3 mb-6">
        <h3 className="text-yt-text-primary font-medium text-lg">Upload Settings</h3>
      </div>

      {/* Upload Mode Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-yt-text-primary">Upload Mode</h4>
          {videos.filter(v => v.isShort).length > 0 && (
            <span className="text-xs bg-yt-bg text-yt-text-secondary px-2 py-1 rounded-full border border-yt-border">
              {videos.filter(v => v.isShort).length} SHORTS DETECTED
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={`cursor-pointer border rounded-xl p-4 flex flex-col transition-all ${uploadSettings.uploadMode === 'playlist' ? 'border-yt-text-primary bg-[#F0F0F0]' : 'border-yt-border bg-yt-bg hover:bg-yt-hover'}`}>
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="uploadMode"
                value="playlist"
                checked={uploadSettings.uploadMode === 'playlist'}
                onChange={(e) => onSettingsChange({ uploadMode: e.target.value as 'playlist' | 'individual' })}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${uploadSettings.uploadMode === 'playlist' ? 'border-yt-blue' : 'border-yt-text-secondary'}`}>
                {uploadSettings.uploadMode === 'playlist' && <div className="w-2 h-2 rounded-full bg-yt-blue"></div>}
              </div>
              <span className={`text-sm font-medium ${uploadSettings.uploadMode === 'playlist' ? 'text-yt-text-primary' : 'text-yt-text-secondary'}`}>Upload as Playlist</span>
            </div>
            <span className="text-xs text-yt-text-secondary ml-7 block mt-1">Group videos together in a sequence</span>
          </label>

          <label className={`cursor-pointer border rounded-xl p-4 flex flex-col transition-all ${uploadSettings.uploadMode === 'individual' ? 'border-yt-text-primary bg-[#F0F0F0]' : 'border-yt-border bg-yt-bg hover:bg-yt-hover'}`}>
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="uploadMode"
                value="individual"
                checked={uploadSettings.uploadMode === 'individual'}
                onChange={(e) => onSettingsChange({ uploadMode: e.target.value as 'playlist' | 'individual' })}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${uploadSettings.uploadMode === 'individual' ? 'border-yt-blue' : 'border-yt-text-secondary'}`}>
                {uploadSettings.uploadMode === 'individual' && <div className="w-2 h-2 rounded-full bg-yt-blue"></div>}
              </div>
              <span className={`text-sm font-medium flex items-center flex-wrap ${uploadSettings.uploadMode === 'individual' ? 'text-yt-text-primary' : 'text-yt-text-secondary'}`}>
                Upload Individually
              </span>
            </div>
            <span className="text-xs text-yt-text-secondary ml-7 block mt-1">Standalone videos
              {videos.filter(v => v.isShort).length > 0 && <span className="bg-[#F0F0F0] px-1 py-0.5 rounded ml-2 text-[10px]">Shorts Recommended</span>}
            </span>
          </label>
        </div>
      </div>

      <PlaylistSelector
        uploadSettings={uploadSettings}
        onSettingsChange={onSettingsChange}
        availablePlaylists={availablePlaylists}
        loadingPlaylists={loadingPlaylists}
        existingPlaylistVideos={existingPlaylistVideos}
        onFetchUserPlaylists={onFetchUserPlaylists}
        onFetchExistingPlaylistVideos={onFetchExistingPlaylistVideos}
        onClearPlaylistCache={onClearPlaylistCache}
        onClearPlaylistVideosCache={onClearPlaylistVideosCache}
        onSetExistingPlaylistVideos={onSetExistingPlaylistVideos}
      />

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Privacy Setting */}
        <div>
          <label className="block text-sm font-medium text-yt-text-primary mb-2">
            Visibility
          </label>
          <div className="relative">
            <select
              value={uploadSettings.privacyStatus}
              onChange={(e) => onSettingsChange({
                privacyStatus: e.target.value as 'private' | 'unlisted' | 'public'
              })}
              className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-yt-text-secondary">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Upload Limit */}
        <div>
          <label className="block text-sm font-medium text-yt-text-primary mb-2">
            Batch Size
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={uploadSettings.maxVideos}
            onChange={(e) => onSettingsChange({
              maxVideos: parseInt(e.target.value) || 10
            })}
            className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-yt-text-primary mb-2">
            Content Category
          </label>
          <div className="relative">
            <select
              value={uploadSettings.contentType}
              onChange={(e) => onSettingsChange({ contentType: e.target.value })}
              className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="auto">Auto Detect</option>
              <option value="course">Educational Course</option>
              <option value="business">Business Vlog</option>
              <option value="tech">Tech & Programming</option>
              <option value="creative">Creative Arts</option>
              <option value="health">Health & Fitness</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-yt-text-secondary">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mt-8 pt-6 border-t border-yt-border">
        <button
          type="button"
          onClick={onToggleAdvancedSettings}
          className="flex items-center text-sm font-medium text-yt-text-primary hover:text-yt-blue transition-colors group"
        >
          <ChevronDown
            size={20}
            className={`mr-2 transition-transform duration-300 ${showAdvancedSettings ? 'rotate-180' : ''} text-yt-text-secondary group-hover:text-yt-blue`}
          />
          Advanced Options
        </button>

        {showAdvancedSettings && (
          <div className="mt-4 p-6 bg-[#F9F9F9] rounded-xl border border-yt-border grid md:grid-cols-2 gap-8">
            {/* Made for Kids */}
            <div className="flex items-start space-x-3 group">
              <label className="relative flex cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={uploadSettings.madeForKids}
                  onChange={(e) => onSettingsChange({
                    madeForKids: e.target.checked
                  })}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${uploadSettings.madeForKids ? 'bg-yt-blue border-yt-blue' : 'border-yt-text-secondary group-hover:border-yt-text-primary'}`}>
                  {uploadSettings.madeForKids && <Check size={14} className="text-yt-text-primary" />}
                </div>
              </label>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-yt-text-primary mb-1">COPPA Compliance</span>
                <span className="text-xs text-yt-text-secondary">Flag as made for kids</span>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="flex items-start space-x-3 group">
              <label className="relative flex cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={uploadSettings.useAiAnalysis}
                  onChange={(e) => onSettingsChange({
                    useAiAnalysis: e.target.checked
                  })}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${uploadSettings.useAiAnalysis ? 'bg-yt-blue border-yt-blue' : 'border-yt-text-secondary group-hover:border-yt-text-primary'}`}>
                  {uploadSettings.useAiAnalysis && <Check size={14} className="text-yt-text-primary" />}
                </div>
              </label>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-yt-text-primary mb-1 flex items-center">
                  AI Description & Tags
                  {uploadSettings.useAiAnalysis && <span className="ml-2 px-1.5 py-0.5 bg-yt-blue/20 text-yt-blue text-[10px] font-bold rounded">ON</span>}
                </span>
                <span className="text-xs text-yt-text-secondary">Auto-generate with AI</span>
              </div>
            </div>

            {/* Playlist Navigation */}
            <div className="flex items-start space-x-3 group">
              <label className="relative flex cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={uploadSettings.addPlaylistNavigation}
                  onChange={(e) => onSettingsChange({
                    addPlaylistNavigation: e.target.checked
                  })}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${uploadSettings.addPlaylistNavigation ? 'bg-yt-blue border-yt-blue' : 'border-yt-text-secondary group-hover:border-yt-text-primary'}`}>
                  {uploadSettings.addPlaylistNavigation && <Check size={14} className="text-yt-text-primary" />}
                </div>
              </label>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-yt-text-primary mb-1">Playlist Navigation</span>
                <span className="text-xs text-yt-text-secondary">Add prev/next links to description</span>
              </div>
            </div>

            {/* Cache Management */}
            <div className="md:col-span-2 pt-6 border-t border-yt-border flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center text-xs text-yt-text-secondary">
                <Database size={14} className="mr-2" />
                <span>Local Cache: </span>
                <span className="ml-1 text-yt-text-primary">Playlists: {availablePlaylists.length} | Videos: {existingPlaylistVideos.length}</span>
              </div>

              <button
                onClick={() => {
                  onClearPlaylistCache()
                  onClearPlaylistVideosCache()
                  onSetExistingPlaylistVideos([])
                  alert('Cache cleared.')
                }}
                className="text-sm font-medium text-yt-red hover:text-red-400 mt-3 sm:mt-0 transition-colors"
              >
                Clear specific cache
              </button>
            </div>

            {/* Dropdowns for Categories and Layouts */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6 pt-6 border-t border-yt-border">
              <div>
                <label className="block text-sm font-medium text-yt-text-primary mb-2 flex items-center justify-between">
                  <span>Video Category</span>
                  {uploadSettings.category !== '27' && <span className="text-yt-blue text-[10px] bg-yt-blue/10 px-1.5 py-0.5 rounded">Customized</span>}
                </label>
                <div className="relative">
                  <select
                    value={uploadSettings.category}
                    onChange={(e) => onSettingsChange({ category: e.target.value })}
                    className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="27">27: Education</option>
                    <option value="28">28: Sci-Tech</option>
                    <option value="26">26: HowTo & Style</option>
                    <option value="22">22: People & Blogs</option>
                    <option value="25">25: News & Politics</option>
                    <option value="24">24: Entertainment</option>
                    <option value="19">19: Travel & Events</option>
                    <option value="17">17: Sports</option>
                    <option value="15">15: Pets & Animals</option>
                    <option value="10">10: Music</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-yt-text-secondary">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-yt-text-primary mb-2 flex items-center justify-between">
                  <span>Title Format</span>
                  {uploadSettings.titleFormat === 'original' && uploadSettings.useAiAnalysis && <span className="text-purple-400 text-[10px] bg-purple-400/10 px-1.5 py-0.5 rounded flex items-center"><Sparkles size={10} className="mr-1"/> AI Powered</span>}
                </label>
                <div className="relative">
                  <select
                    value={uploadSettings.titleFormat}
                    onChange={(e) => onSettingsChange({
                      titleFormat: e.target.value as 'original' | 'cleaned' | 'custom'
                    })}
                    className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="original">Original Filename</option>
                    <option value="cleaned">Clean (Remove Extensions)</option>
                    <option value="custom">Custom Format</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-yt-text-secondary">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {uploadSettings.titleFormat === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-yt-text-primary mb-2">
                      Title Prefix
                    </label>
                    <input
                      type="text"
                      value={uploadSettings.customTitlePrefix}
                      onChange={(e) => onSettingsChange({
                        customTitlePrefix: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none placeholder:text-yt-text-secondary"
                      placeholder="Prefix: "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yt-text-primary mb-2">
                      Title Suffix
                    </label>
                    <input
                      type="text"
                      value={uploadSettings.customTitleSuffix}
                      onChange={(e) => onSettingsChange({
                        customTitleSuffix: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-yt-bg text-yt-text-primary rounded-lg border border-yt-border focus:border-yt-blue focus:ring-0 focus:outline-none placeholder:text-yt-text-secondary"
                      placeholder=" - Suffix"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-yt-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-yt-text-secondary flex items-center">
          <span className="w-2 h-2 rounded-full bg-yt-blue mr-2 animate-pulse"></span>
          Queued: <span className="font-medium text-yt-text-primary ml-2">{totalQueued} / {totalVideos} videos</span>
        </div>

        <button
          onClick={onUpload}
          disabled={
            isUploading ||
            (uploadSettings.uploadMode === 'playlist' && (
              (!uploadSettings.useExistingPlaylist && !uploadSettings.playlistName) ||
              (uploadSettings.useExistingPlaylist && !uploadSettings.selectedPlaylistId)
            ))
          }
          className="px-6 py-2.5 bg-yt-blue text-black font-medium rounded-full hover:bg-[#65b8ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
              Uploading...
            </span>
          ) : (
            "Upload videos"
          )}
        </button>
      </div>
    </div>
  )
}