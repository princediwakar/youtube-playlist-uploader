'use client'

import { FileVideo, X, CheckCircle, Music, RotateCcw, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { MediaFile, isVideoFile, isAudioFile } from '@/app/types/video'
import { CompactWaveformVisualizer } from './WaveformVisualizer'
import { useUploadContext } from '@/app/contexts/UploadContext'
import { useAppStore } from '@/app/store'

interface MediaListProps {
  videos: MediaFile[]
  maxVideos: number
  onRemoveVideo: (index: number) => void
}

function formatBytes(bytes: number | string | undefined): string {
  if (!bytes) return '0 B'
  if (typeof bytes === 'string') return bytes
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getProgressBytes(video: MediaFile, totalBytes: number): { uploaded: number; total: number } {
  if (video.status === 'completed') {
    return { uploaded: totalBytes, total: totalBytes }
  }
  if (video.status === 'uploading' && video.progress !== undefined) {
    return {
      uploaded: Math.floor((video.progress / 100) * totalBytes),
      total: totalBytes
    }
  }
  return { uploaded: 0, total: totalBytes }
}

export function MediaList({ videos, maxVideos, onRemoveVideo }: MediaListProps) {
  const { uploadQueue, currentUpload } = useUploadContext()
  const pendingAudioConversions = useAppStore(s => s.pendingAudioConversions)

  const pendingVideos = videos.filter(v => v.status === 'pending')
  const sortedVideos = videos

  return (
    <div>
      <h4 className="text-xs font-medium text-yt-text-secondary uppercase tracking-wider mb-3">
        Queue ({pendingVideos.length}/{videos.length})
      </h4>
      {pendingVideos.length > maxVideos && (
        <div className="text-xs text-yt-text-secondary mb-2">
          Showing all {pendingVideos.length} pending videos (batch limit: {maxVideos})
        </div>
      )}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {sortedVideos.map((video, index) => {
          const isCurrentlyUploading = currentUpload === video.name && video.status === 'uploading'
          const isConverting = pendingAudioConversions[video.path] === 'converting'
          const conversionError = pendingAudioConversions[video.path] === 'error'
          const fileSize = typeof video.size === 'number' ? video.size : 0

          return (
            <div
              key={index}
              className="flex items-center p-2 rounded-lg hover:bg-yt-hover transition-colors group relative border border-transparent hover:border-yt-border"
            >
              <button
                onClick={() => {
                  const originalIndex = videos.findIndex(v => v.path === video.path)
                  if (originalIndex !== -1) onRemoveVideo(originalIndex)
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-yt-text-secondary hover:bg-yt-bg hover:text-yt-text-primary opacity-0 group-hover:opacity-100 active:opacity-100 sm:active:opacity-0 sm:group-hover:opacity-100 transition-all z-10 touch-manipulation"
                title="Remove video"
                disabled={video.status === 'uploading'}
              >
                <X size={16} />
              </button>

              <div className="relative w-12 h-7 sm:w-16 sm:h-9 bg-yt-bg rounded overflow-hidden flex-shrink-0 mr-2 sm:mr-3">
                {isVideoFile(video) && video.thumbnail ? (
                  <Image src={video.thumbnail} alt="" fill className="object-cover" />
                ) : isVideoFile(video) && video.googlePhotosBaseUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`/api/photos/thumbnail?baseUrl=${encodeURIComponent(video.googlePhotosBaseUrl)}`} alt="" className="object-cover w-full h-full absolute inset-0" />
                ) : isAudioFile(video) ? (
                  video.waveform && video.waveform.length > 0 ? (
                    <CompactWaveformVisualizer
                      waveform={video.waveform}
                      width={48}
                      height={28}
                      color="#ff3333"
                      backgroundColor="#0f0f0f"
                    />
                  ) : video.audioThumbnail ? (
                    <Image src={video.audioThumbnail} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-yt-text-secondary">
                      <Music size={12} />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-yt-text-secondary">
                    <FileVideo size={12} />
                  </div>
                )}
                {(video.status !== 'pending' || isConverting) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    {isConverting && <Loader2 size={12} className="text-yellow-500 animate-spin" />}
                    {conversionError && <X size={12} className="text-red-500" />}
                    {video.status === 'completed' && <CheckCircle size={12} className="text-green-500" />}
                    {video.status === 'error' && <X size={12} className="text-red-500" />}
                    {video.status === 'uploading' && !isConverting && (
                      <div className="w-3 h-3 border-2 border-yt-text-primary/30 border-t-white rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <p className="text-[11px] sm:text-xs font-medium text-yt-text-primary truncate">{video.name}</p>
                <div className="text-[10px] text-yt-text-secondary flex items-center gap-2 flex-wrap">
                  <span>{video.size}</span>

                  {isConverting && (
                    <span className="text-yellow-500 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      Converting...
                    </span>
                  )}

                  {conversionError && (
                    <span className="text-red-500">Conversion failed</span>
                  )}

                  {video.status !== 'pending' && !isConverting && !conversionError && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                      video.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      video.status === 'error' ? 'bg-red-500/20 text-red-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {video.status}
                    </span>
                  )}
                </div>

                {(video.status === 'uploading' || isCurrentlyUploading) && fileSize > 0 && (
                  <div className="mt-1">
                    <div className="h-1 bg-yt-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yt-blue transition-all duration-300 rounded-full"
                        style={{ width: `${video.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-yt-text-secondary mt-0.5">
                      <span>{formatBytes(getProgressBytes(video, fileSize).uploaded)}</span>
                      <span>{formatBytes(fileSize)}</span>
                    </div>
                  </div>
                )}

                {video.status === 'error' && video.error && (
                  <p className="text-[10px] sm:text-xs text-red-400 mt-0.5 truncate max-w-[160px] sm:max-w-[200px]">{video.error}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}