'use client'

import { FileVideo, X, CheckCircle, Music } from 'lucide-react'
import { MediaFile, isVideoFile, isAudioFile } from '@/app/types/video'
import { CompactWaveformVisualizer } from './WaveformVisualizer'

interface MediaListProps {
  videos: MediaFile[]
  maxVideos: number
  onRemoveVideo: (index: number) => void
}

export function MediaList({ videos, maxVideos, onRemoveVideo }: MediaListProps) {
  // Calculate pending videos
  const pendingVideos = videos.filter(v => v.status === 'pending');

  // Sort videos by status priority: pending > uploading > error > completed
  const statusPriority = { 'pending': 0, 'uploading': 1, 'error': 2, 'completed': 3 };
  const sortedVideos = [...videos].sort((a, b) => {
    return statusPriority[a.status] - statusPriority[b.status];
  });

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
        {sortedVideos.map((video, index) => (
          <div
            key={index}
            className="flex items-center p-2 rounded-lg hover:bg-yt-hover transition-colors group relative border border-transparent hover:border-yt-border"
          >
            {/* Remove Button */}
            <button
              onClick={() => {
                // Find original index in unsorted videos array
                const originalIndex = videos.findIndex(v => v.path === video.path);
                if (originalIndex !== -1) onRemoveVideo(originalIndex);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-yt-text-secondary hover:bg-yt-bg hover:text-yt-text-primary opacity-0 group-hover:opacity-100 transition-all z-10"
              title="Remove video"
              disabled={video.status === 'uploading'}
            >
              <X size={14} />
            </button>

            {/* Thumbnail */}
            <div className="relative w-16 h-9 bg-yt-bg rounded overflow-hidden flex-shrink-0 mr-3">
              {isVideoFile(video) && video.thumbnail ? (
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : isAudioFile(video) ? (
                video.waveform && video.waveform.length > 0 ? (
                  <CompactWaveformVisualizer
                    waveform={video.waveform}
                    width={64}
                    height={36}
                    color="#ff0000"
                    backgroundColor="#0f0f0f"
                  />
                ) : video.audioThumbnail ? (
                  <img src={video.audioThumbnail} alt="" className="w-full h-full object-cover" />
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
              {video.status !== 'pending' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  {video.status === 'completed' && <CheckCircle size={12} className="text-green-500" />}
                  {video.status === 'error' && <X size={12} className="text-red-500" />}
                  {video.status === 'uploading' && <div className="w-3 h-3 border-2 border-yt-text-primary/30 border-t-white rounded-full animate-spin" />}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-xs font-medium text-yt-text-primary truncate">{video.name}</p>
              <p className="text-[10px] text-yt-text-secondary">
                {video.size}
                {video.status !== 'pending' && (
                  <span className={`ml-2 px-1 py-0.5 rounded text-[9px] ${
                    video.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    video.status === 'error' ? 'bg-red-500/20 text-red-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {video.status}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}