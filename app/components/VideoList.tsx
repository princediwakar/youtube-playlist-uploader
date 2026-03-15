'use client'

import { FileVideo, X, CheckCircle } from 'lucide-react'
import { VideoFile } from '@/app/types/video'

interface VideoListProps {
  videos: VideoFile[]
  maxVideos: number
  onRemoveVideo: (index: number) => void
}

export function VideoList({ videos, maxVideos, onRemoveVideo }: VideoListProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-yt-text-secondary uppercase tracking-wider mb-3">
        Queue ({videos.length})
      </h4>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {videos.slice(0, maxVideos).map((video, index) => (
          <div
            key={index}
            className="flex items-center p-2 rounded-lg hover:bg-yt-hover transition-colors group relative border border-transparent hover:border-yt-border"
          >
            {/* Remove Button */}
            <button
              onClick={() => onRemoveVideo(index)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-yt-text-secondary hover:bg-yt-bg hover:text-yt-text-primary opacity-0 group-hover:opacity-100 transition-all z-10"
              title="Remove video"
              disabled={video.status === 'uploading'}
            >
              <X size={14} />
            </button>

            {/* Thumbnail */}
            <div className="relative w-16 h-9 bg-yt-bg rounded overflow-hidden flex-shrink-0 mr-3">
              {video.thumbnail ? (
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
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
              <p className="text-[10px] text-yt-text-secondary">{video.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}