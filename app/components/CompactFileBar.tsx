'use client'

import { FolderOpen, Plus, Edit3, X } from 'lucide-react'
import { useFileContext } from '@/app/contexts/FileContext'

interface CompactFileBarProps {
  onExpandCards: () => void
  onAddMore: () => void
}

export function CompactFileBar({ onExpandCards, onAddMore }: CompactFileBarProps) {
  const { videos, removeVideo } = useFileContext()

  const folderCount = Array.from(new Set(videos.map(v => v.folder))).length
  const fileCount = videos.length

  return (
    <div className="panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-yt-red/10 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="text-yt-red" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-yt-text-primary truncate">
            {fileCount} file{fileCount !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-yt-text-secondary">
            from {folderCount} folder{folderCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={onExpandCards}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-yt-text-secondary hover:text-yt-text-primary rounded-lg hover:bg-yt-hover transition-colors"
        >
          <Edit3 size={14} />
          <span className="hidden sm:inline">Change files</span>
          <span className="sm:hidden">Change</span>
        </button>
        <button
          onClick={onAddMore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-yt-blue hover:text-blue-400 rounded-lg hover:bg-yt-blue/10 transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add more</span>
          <span className="sm:hidden">Add</span>
        </button>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to clear all ${videos.length} files?`)) {
              const count = videos.length
              for (let i = count - 1; i >= 0; i--) {
                removeVideo(i)
              }
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-yt-red hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-auto sm:ml-0"
        >
          <X size={14} />
          <span className="hidden sm:inline">Clear all</span>
        </button>
      </div>
    </div>
  )
}