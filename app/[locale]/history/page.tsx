import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { History, ChevronLeft, ChevronRight, Play, Clock, HardDrive } from 'lucide-react'
import { getUploadHistory, getUploadStats } from '@/app/actions/history'
import ExportButton from './ExportButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload History'
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(date))
}

interface HistoryPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await auth()
  if (!session) {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const limit = 20

  const [historyResult, statsResult] = await Promise.all([
    getUploadHistory({ page, limit, search: params.search }),
    getUploadStats()
  ])

  const { uploads, total } = historyResult
  const { stats } = statsResult
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-pearl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-yt-text-secondary hover:text-yt-text-primary transition-colors"
          >
            <ChevronLeft className="mr-1" size={16} />
            Back to Uploader
          </Link>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yt-red/10 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <History className="text-yt-red" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-medium text-yt-text-primary">Upload History</h1>
                <p className="text-sm text-yt-text-secondary mt-1">
                  {stats.totalUploads} uploads totaling {formatBytes(stats.totalBytes)}
                </p>
              </div>
            </div>
            <ExportButton uploads={uploads} page={page} />
          </div>

          {stats.byMediaType && Object.keys(stats.byMediaType).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {Object.entries(stats.byMediaType).map(([type, count]) => (
                <div key={type} className="bg-yt-bg rounded-lg p-3 sm:p-4 text-center border border-yt-border">
                  <div className="text-xl sm:text-2xl font-medium text-yt-text-primary">{count}</div>
                  <div className="text-xs text-yt-text-secondary capitalize">{type}</div>
                </div>
              ))}
            </div>
          )}

          {uploads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yt-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="text-yt-text-secondary" size={32} />
              </div>
              <p className="text-yt-text-secondary">No uploads yet</p>
              <Link href="/" className="text-yt-red hover:underline mt-2 inline-block">
                Start uploading
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yt-border">
                      <th className="text-left py-3 px-3 sm:px-4 text-sm font-medium text-yt-text-primary">Title</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-sm font-medium text-yt-text-primary hidden sm:table-cell">File</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-sm font-medium text-yt-text-primary hidden md:table-cell">Type</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-sm font-medium text-yt-text-primary hidden lg:table-cell">Date</th>
                      <th className="text-right py-3 px-3 sm:px-4 text-sm font-medium text-yt-text-primary">Watch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((upload) => (
                      <tr key={upload.id} className="border-b border-yt-border hover:bg-yt-hover transition-colors">
                        <td className="py-3 px-3 sm:px-4">
                          <div className="font-medium text-yt-text-primary truncate max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                            {upload.title}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-yt-text-secondary">
                            <HardDrive className="mr-1.5 flex-shrink-0" size={12} />
                            {formatBytes(upload.fileSize)}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yt-bg text-yt-text-secondary capitalize border border-yt-border">
                            {upload.mediaType || 'video'}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 hidden lg:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-yt-text-secondary">
                            <Clock className="mr-1.5 flex-shrink-0" size={12} />
                            {formatDate(upload.uploadedAt)}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <a
                            href={`https://www.youtube.com/watch?v=${upload.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-yt-red hover:text-red-400 transition-colors p-1"
                          >
                            <Play size={16} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-yt-border">
                  <div className="text-sm text-yt-text-secondary">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={page > 1 ? `/history?page=${page - 1}` : '#'}
                      className={`p-2 rounded-lg ${page > 1 ? 'hover:bg-yt-hover text-yt-text-secondary' : 'text-yt-text-secondary/50 cursor-not-allowed'}`}
                    >
                      <ChevronLeft size={20} />
                    </Link>
                    <Link
                      href={page < totalPages ? `/history?page=${page + 1}` : '#'}
                      className={`p-2 rounded-lg ${page < totalPages ? 'hover:bg-yt-hover text-yt-text-secondary' : 'text-yt-text-secondary/50 cursor-not-allowed'}`}
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}