'use client'

import { FileVideo, Upload, CheckCircle, Pause, Play, X, AlertTriangle } from 'lucide-react'
import { MediaList } from './MediaList'
import { MediaFile, UploadSettings } from '@/app/types/video'

interface UploadStats {
  totalBytes: number
  uploadedBytes: number
  uploadSpeed: number
  estimatedTimeRemaining: number
  startTime: number
}

interface UploadProgressProps {
  videos: MediaFile[]
  uploadSettings: UploadSettings
  loadingExistingVideos: boolean
  existingPlaylistVideos: any[]
  preProcessingStatus: {
    isPreProcessing: boolean
    currentStep: string
    progress: number
  }
  aiProcessing: {
    categoryAnalysis: boolean
    playlistAnalysis: boolean
    videoAnalysis: boolean
    currentVideoAnalysis: string | null
    addingNavigation: boolean
  }
  currentUpload: string | null
  currentPlaylistId: string | null
  totalVideos: number
  completedUploads: number
  isUploading?: boolean
  isPaused?: boolean
  uploadStats?: UploadStats | null
  quotaWarning?: string | null
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  onRemoveVideo: (index: number) => void
}

export function UploadProgress({
  videos,
  uploadSettings,
  loadingExistingVideos,
  existingPlaylistVideos,
  preProcessingStatus,
  aiProcessing,
  currentUpload,
  currentPlaylistId,
  totalVideos,
  completedUploads,
  isUploading,
  isPaused,
  uploadStats,
  quotaWarning,
  onPause,
  onResume,
  onCancel,
  onRemoveVideo
}: UploadProgressProps) {
  const pendingVideos = videos.filter(v => v.status === 'pending');
  const completedVideos = videos.filter(v => v.status === 'completed');
  const errorVideos = videos.filter(v => v.status === 'error');
  const totalVideosCount = videos.length;
  const overallPercentage = totalVideosCount > 0 ? (completedVideos.length / totalVideosCount) * 100 : 100;
  const batchLimit = uploadSettings.maxVideos;

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // If no videos, show empty state
  if (videos.length === 0) {
    return (
      <div className="bg-yt-panel border border-yt-border rounded-xl sticky top-28 overflow-hidden w-full max-w-full">
        <div className="p-4 border-b border-yt-border bg-[#F9F9F9]">
          <h3 className="text-yt-text-primary font-medium text-base">Progress</h3>
        </div>
        <div className="p-8 text-center text-yt-text-secondary flex flex-col items-center">
          <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-4">
            <FileVideo size={20} />
          </div>
          <p className="text-sm">No videos queued for upload.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yt-panel border border-yt-border rounded-xl sticky top-28 overflow-hidden w-full max-w-full">
      <div className="p-4 border-b border-yt-border bg-[#F9F9F9]">
        <div className="flex items-center justify-between">
          <h3 className="text-yt-text-primary font-medium text-base">Progress</h3>
          {isUploading && (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="p-1.5 rounded-md bg-yt-blue/20 text-yt-blue hover:bg-yt-blue/30 transition-colors"
                  title="Resume upload"
                >
                  <Play size={16} />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="p-1.5 rounded-md bg-yt-bg text-yt-text-secondary hover:text-yt-text-primary transition-colors"
                  title="Pause upload"
                >
                  <Pause size={16} />
                </button>
              )}
              <button
                onClick={onCancel}
                className="p-1.5 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                title="Cancel upload"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Quota Warning */}
        {quotaWarning && (
          <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-500">Quota Warning</p>
              <p className="text-xs text-yt-text-secondary">{quotaWarning}</p>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm text-yt-text-secondary mb-2">
            <span>Overall Progress</span>
            <span className="font-medium text-yt-text-primary">{completedVideos.length} of {totalVideosCount}</span>
          </div>
          <div className="h-1 bg-yt-bg rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-yt-blue'}`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-yt-text-secondary mt-2">
            <span>Pending: {pendingVideos.length} video{pendingVideos.length !== 1 ? 's' : ''}</span>
            {errorVideos.length > 0 && (
              <span className="text-red-500">Failed: {errorVideos.length}</span>
            )}
            {pendingVideos.length > batchLimit && (
              <span className="text-yt-text-primary">Batch limit: {batchLimit}</span>
            )}
          </div>
        </div>

        {/* Upload Stats */}
        {isUploading && uploadStats && (
          <div className="flex items-center justify-between text-xs text-yt-text-secondary">
            <span className="flex items-center gap-1">
              <Upload size={12} className={isPaused ? 'text-yellow-500' : 'text-yt-blue'} />
              {isPaused ? 'Paused' : 'Uploading'}
            </span>
            <span>ETA: {formatTime(uploadStats.estimatedTimeRemaining)}</span>
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

        {/* Pre-Processing Status */}
        {preProcessingStatus.isPreProcessing && (
          <div className="flex items-start space-x-3 p-3 bg-yt-bg rounded-lg border border-yt-blue/30">
            <div className="w-4 h-4 border-2 border-yt-blue border-t-transparent rounded-full animate-spin mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yt-text-primary">Pre-processing</p>
              <p className="text-xs text-yt-text-secondary truncate mb-2">
                {preProcessingStatus.currentStep}
              </p>
              <div className="h-1 bg-yt-bg border border-yt-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-yt-blue transition-all duration-300"
                  style={{ width: `${preProcessingStatus.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Processing Status */}
        {(aiProcessing.categoryAnalysis || aiProcessing.playlistAnalysis || aiProcessing.videoAnalysis || aiProcessing.addingNavigation) && (
          <div className="flex items-start space-x-3 p-3 bg-yt-bg rounded-lg border border-yt-border">
            <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yt-text-primary">
                {aiProcessing.addingNavigation ? 'Updating playlist' : 'AI Processing'}
              </p>
              <p className="text-xs text-yt-text-secondary truncate">
                {aiProcessing.categoryAnalysis && 'Analyzing category...'}
                {aiProcessing.playlistAnalysis && 'Generating description...'}
                {aiProcessing.videoAnalysis && aiProcessing.currentVideoAnalysis === 'batch processing' &&
                  'Processing metadata...'}
                {aiProcessing.videoAnalysis && aiProcessing.currentVideoAnalysis && aiProcessing.currentVideoAnalysis !== 'batch processing' &&
                  `Analyzing: ${aiProcessing.currentVideoAnalysis.substring(0, 15)}...`}
                {aiProcessing.addingNavigation && 'Linking videos...'}
              </p>
            </div>
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
          onRemoveVideo={onRemoveVideo}
        />
      </div>
    </div>
  )
}