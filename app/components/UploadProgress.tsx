'use client'

import { FileVideo, Upload, CheckCircle, Pause, Play, X, AlertTriangle, RotateCcw, Zap } from 'lucide-react'
import { MediaList } from './MediaList'
import { useFileContext } from '@/app/contexts/FileContext'
import { usePlaylistContext } from '@/app/contexts/PlaylistContext'
import { useUploadContext } from '@/app/contexts/UploadContext'
import { useSettingsContext } from '@/app/contexts/SettingsContext'
import { useAppStore } from '@/app/store'
import { useCallback } from 'react'

interface UploadProgressProps {
  isUploadDisabled: boolean
  onUpload: () => void
}

function formatBytes(bytes: number): string {
  if (!bytes || !isFinite(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || !isFinite(bytesPerSec)) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function UploadProgress({ isUploadDisabled, onUpload }: UploadProgressProps) {
  const { videos, removeVideo, updateVideo } = useFileContext()
  const { existingPlaylistVideos, loadingExistingVideos } = usePlaylistContext()
  const {
    currentUpload,
    isUploading,
    isPaused,
    uploadStats,
    quotaWarning,
    pauseUpload,
    resumeUpload,
    cancelUpload,
  } = useUploadContext()
  const { uploadSettings, currentPlaylistId } = useSettingsContext()
  const pendingAudioConversions = useAppStore(s => s.pendingAudioConversions)

  const completedVideos = videos.filter(v => v.status === 'completed')
  const errorVideos = videos.filter(v => v.status === 'error')
  const pendingVideos = videos.filter(v => v.status === 'pending')
  const uploadingVideos = videos.filter(v => v.status === 'uploading')
  const totalVideosCount = videos.length
  const overallPercentage = totalVideosCount > 0 ? (completedVideos.length / totalVideosCount) * 100 : 100
  const batchLimit = uploadSettings.maxVideos

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRetryFailed = useCallback(() => {
    errorVideos.forEach(video => {
      const idx = videos.findIndex(v => v.path === video.path)
      if (idx !== -1) {
        updateVideo(idx, { status: 'pending', error: undefined, progress: 0 })
      }
    })
  }, [errorVideos, videos, updateVideo])

  const handleCancelAll = useCallback(() => {
    if (confirm('Are you sure you want to cancel all uploads? Progress will be lost.')) {
      cancelUpload()
      videos.forEach((video, idx) => {
        if (video.status !== 'completed') {
          updateVideo(idx, { status: 'pending', error: undefined, progress: 0 })
        }
      })
    }
  }, [cancelUpload, videos, updateVideo])

  const convertingCount = Object.values(pendingAudioConversions).filter(s => s === 'converting').length
  const hasActiveItems = isUploading || convertingCount > 0

  if (videos.length === 0) {
    return (
      <div className="bg-yt-panel border border-yt-border rounded-xl lg:sticky lg:top-24 overflow-hidden w-full max-w-full">
        <div className="p-3 sm:p-4 border-b border-yt-border bg-[#F9F9F9]">
          <h3 className="text-yt-text-primary font-medium text-sm sm:text-base">Progress</h3>
        </div>
        <div className="p-6 sm:p-8 text-center text-yt-text-secondary flex flex-col items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yt-bg rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <FileVideo size={18} />
          </div>
          <p className="text-xs sm:text-sm">No videos queued for upload.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yt-panel border border-yt-border rounded-xl lg:sticky lg:top-24 overflow-hidden w-full max-w-full">
      <div className="p-4 border-b border-yt-border bg-[#F9F9F9]">
        <div className="flex items-center justify-between">
          <h3 className="text-yt-text-primary font-medium text-base">Progress</h3>
          {hasActiveItems && (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={resumeUpload}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors text-xs font-medium min-h-[44px] touch-manipulation"
                >
                  <Play size={18} />
                  <span className="hidden sm:inline">Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseUpload}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors text-xs font-medium min-h-[44px] touch-manipulation"
                >
                  <Pause size={18} />
                  <span className="hidden sm:inline">Pause</span>
                </button>
              )}
              <button
                onClick={handleCancelAll}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-xs font-medium min-h-[44px] touch-manipulation"
              >
                <X size={18} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
        {quotaWarning && (
          <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-500">Quota Warning</p>
              <p className="text-xs text-yt-text-secondary">{quotaWarning}</p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between text-sm text-yt-text-secondary mb-2">
            <span>Overall Progress</span>
            <span className="font-medium text-yt-text-primary">{completedVideos.length} of {totalVideosCount}</span>
          </div>
          <div className="h-2 bg-yt-bg rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-yt-blue'}`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-yt-text-secondary mt-2 gap-1">
            <span className="flex items-center gap-2">
              <span>Pending: {pendingVideos.length}</span>
              {uploadingVideos.length > 0 && (
                <span className="text-yt-blue">Uploading: {uploadingVideos.length}</span>
              )}
              {convertingCount > 0 && (
                <span className="text-yellow-500">Converting: {convertingCount}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {errorVideos.length > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-400 transition-colors min-h-[44px] touch-manipulation"
                >
                  <RotateCcw size={14} />
                  <span className="text-xs font-medium">Retry ({errorVideos.length})</span>
                </button>
              )}
              {pendingVideos.length > batchLimit && (
                <span className="text-yt-text-primary bg-yt-bg px-2 py-0.5 rounded">Batch: {batchLimit}</span>
              )}
            </div>
          </div>
        </div>

        {isUploading && uploadStats && (
          <div className="bg-yt-bg rounded-lg p-3 border border-yt-border">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-sm font-medium text-yt-text-primary">
                <Zap size={14} className={isPaused ? 'text-yellow-500' : 'text-yt-blue'} />
                {isPaused ? 'Paused' : 'Uploading'}
              </span>
              <span className="text-sm font-medium text-yt-text-primary">
                {formatSpeed(uploadStats.uploadSpeed)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-yt-text-secondary mb-1">
              <span>{formatBytes(uploadStats.uploadedBytes)} / {formatBytes(uploadStats.totalBytes)}</span>
              <span>ETA: {formatTime(uploadStats.estimatedTimeRemaining)}</span>
            </div>
            <div className="w-full h-1.5 bg-yt-panel rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isPaused ? 'bg-yellow-500' : 'bg-yt-blue'}`}
                style={{ width: `${uploadStats.totalBytes > 0 ? (uploadStats.uploadedBytes / uploadStats.totalBytes) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Duplicate Videos Info */}
        {uploadSettings.useExistingPlaylist && (
          <div>
            {loadingExistingVideos && (
              <div className="flex items-start space-x-3 p-3 bg-yt-bg rounded-lg border border-yt-border">
                <div className="w-4 h-4 border-2 border-yt-text-secondary border-t-white rounded-full animate-spin mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yt-text-primary">Checking playlist</p>
                  <p className="text-xs text-yt-text-secondary">Looking for duplicate videos...</p>
                </div>
              </div>
            )}
            {!loadingExistingVideos && existingPlaylistVideos.length > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yt-bg rounded-lg border border-yt-border">
                <CheckCircle size={16} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yt-text-primary">Duplicate check complete</p>
                  <p className="text-xs text-yt-text-secondary">
                    Found {existingPlaylistVideos.length} matching videos. They will be skipped.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Upload */}
        {currentUpload && (
          <div className="flex items-start space-x-3 p-3 bg-yt-bg rounded-lg border border-yt-border">
            <Upload size={16} className="text-yt-blue mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yt-text-primary truncate">{currentUpload}</p>
              <p className="text-xs text-yt-text-secondary">Uploading now...</p>
            </div>
          </div>
        )}

        {/* Playlist Link */}
        {currentPlaylistId && (
          <div className="p-3 bg-yt-bg rounded-lg border border-green-500/30">
            <p className="text-xs font-medium text-green-500 mb-2">
              {uploadSettings.useExistingPlaylist ? 'Playlist Connected' : 'Playlist Created'}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-yt-text-secondary font-mono">{currentPlaylistId.substring(0, 12)}...</span>
              <a
                href={`https://www.youtube.com/playlist?list=${currentPlaylistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yt-blue hover:text-yt-text-primary transition-colors"
              >
                View →
              </a>
            </div>
          </div>
        )}

        <MediaList
          videos={videos}
          maxVideos={uploadSettings.maxVideos}
          onRemoveVideo={removeVideo}
        />

        {/* Upload button — hidden on mobile (handled by fixed bottom bar) */}
        <div className="hidden lg:block pt-4 border-t border-yt-border">
          <button
            onClick={onUpload}
            disabled={isUploadDisabled}
            className="w-full px-6 py-2.5 bg-yt-blue text-black font-medium rounded-full hover:bg-[#65b8ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
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
  )
}
