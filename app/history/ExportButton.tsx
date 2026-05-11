'use client'

import { Download } from 'lucide-react'
import type { HistoryEntry } from '@/app/actions/history'

interface ExportButtonProps {
  uploads: HistoryEntry[]
  page: number
}

export default function ExportButton({ uploads, page }: ExportButtonProps) {
  const handleExport = () => {
    const csv = [
      'Video ID,Title,Playlist ID,File Name,File Size,Media Type,Uploaded At',
      ...uploads.map(u =>
        `${u.videoId},"${u.title}","${u.playlistId || ''}","${u.fileName || ''}",${u.fileSize || ''},${u.mediaType || ''},${u.uploadedAt}`
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `upload-history-${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} className="btn-secondary flex items-center">
      <Download className="mr-2" size={16} />
      Export CSV
    </button>
  )
}