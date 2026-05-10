'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import type { GooglePhotosImportItem } from '@/app/types/googlePhotos'

interface GooglePhotosPickerProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: GooglePhotosImportItem[]) => void
}

type PickerStatus = 'creating' | 'picking' | 'retrieving' | 'done'

interface PickedMediaFile {
  baseUrl: string
  mimeType: string
  filename: string
  mediaFileMetadata?: { width?: number; height?: number }
}

interface RawPickedItem {
  id: string
  createTime?: string
  type?: string
  mediaFile: PickedMediaFile
}

export default function GooglePhotosPicker({ isOpen, onClose, onImport }: GooglePhotosPickerProps) {
  const [status, setStatus] = useState<PickerStatus>('creating')
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const pickerWindowRef = useRef<Window | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortedRef = useRef(false)

  const cleanup = useCallback(() => {
    abortedRef.current = true
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (pickerWindowRef.current && !pickerWindowRef.current.closed) {
      pickerWindowRef.current.close()
    }
    pickerWindowRef.current = null
  }, [])

  const handleClose = useCallback(() => {
    cleanup()
    onClose()
  }, [cleanup, onClose])

  useEffect(() => {
    if (!isOpen) return

    abortedRef.current = false
    setStatus('creating')
    setError(null)
    setNeedsReauth(false)

    let cancelled = false

    const run = async () => {
      try {
        // 1. Create picker session
        const createRes = await fetch('/api/photos/create-session', { method: 'POST' })

        if (createRes.status === 403) {
          const data = await createRes.json()
          if (data.needsReauth) {
            setNeedsReauth(true)
            setError('Google Photos permission required. Please sign out and sign in again to grant access.')
          }
          return
        }
        if (!createRes.ok) {
          throw new Error('Failed to create picker session')
        }

        const { sessionId, pickerUri } = await createRes.json()
        sessionIdRef.current = sessionId
        setStatus('picking')

        if (cancelled) return

        // 2. Open Google Photos picker in a new window
        const pickerUrl = pickerUri.endsWith('/') ? `${pickerUri}autoclose` : `${pickerUri}/autoclose`
        pickerWindowRef.current = window.open(pickerUrl, 'google-photos-picker', 'width=800,height=700')

        // 3. Poll until the user finishes picking
        let attempts = 0
        const maxAttempts = 150 // 5 minutes max
        let windowClosedAttempts = 0
        const maxWindowClosedAttempts = 30 // 30s after window closes

        const poll = async (): Promise<void> => {
          if (cancelled || abortedRef.current) return

          attempts++
          if (attempts > maxAttempts) {
            setError('Timed out waiting for selection. Please try again.')
            return
          }

          if (pickerWindowRef.current?.closed) {
            windowClosedAttempts++
            if (windowClosedAttempts > maxWindowClosedAttempts) {
              setError('Picker window was closed. Please try again.')
              return
            }
          }

          try {
            const res = await fetch(`/api/photos/session?sessionId=${sessionId}`)
            if (!res.ok) {
              const err = await res.json().catch(() => ({}))
              if (err.needsReauth) {
                setNeedsReauth(true)
                setError('Google Photos permission required. Please sign out and sign in again to grant access.')
                return
              }
              throw new Error(err.error || 'Failed to check session')
            }

            const data = await res.json()

            if (!data.ready) {
              // Poll faster once the window closes, so we pick up Done quickly
              const delay = pickerWindowRef.current?.closed ? 1000 : 2000
              pollTimerRef.current = setTimeout(poll, delay)
              return
            }

            // 4. Session complete — map items and import
            setStatus('retrieving')

            const videoItems: GooglePhotosImportItem[] = (data.mediaItems || [])
              .filter((item: RawPickedItem) => item.type === 'VIDEO' || item.mediaFile?.mimeType?.startsWith('video/'))
              .map((item: RawPickedItem) => ({
                id: item.id,
                filename: item.mediaFile.filename || item.id,
                mimeType: item.mediaFile.mimeType,
                baseUrl: item.mediaFile.baseUrl,
                creationTime: item.createTime || '',
                width: item.mediaFile.mediaFileMetadata?.width || 0,
                height: item.mediaFile.mediaFileMetadata?.height || 0,
              }))

            if (videoItems.length === 0) {
              setError('No videos were selected. Please try again.')
              return
            }

            setStatus('done')
            onImport(videoItems)
          } catch (err) {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : 'Something went wrong')
            }
          }
        }

        pollTimerRef.current = setTimeout(poll, 1000)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to connect to Google Photos')
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [isOpen, onImport])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={handleClose}>
      <div
        className="bg-white border border-yt-border rounded-xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-yt-border">
          <h3 className="text-lg font-medium text-yt-text-primary">
            Google Photos
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-yt-hover text-yt-text-secondary hover:text-yt-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Reauth banner */}
          {needsReauth && error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="mr-3 text-red-500 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-red-300 font-medium text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error (non-auth) */}
          {error && !needsReauth && (
            <div className="flex flex-col items-center py-6">
              <AlertTriangle className="text-red-500 mb-4" size={32} />
              <p className="text-yt-text-primary text-center mb-2 font-medium">Something went wrong</p>
              <p className="text-yt-text-secondary text-sm text-center mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setStatus('creating')
                  handleClose()
                }}
                className="px-4 py-2 bg-yt-blue text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && (
            <div className="flex flex-col items-center py-8">
              {(status === 'creating') && (
                <>
                  <Loader2 className="animate-spin text-yt-text-secondary mb-4" size={32} />
                  <p className="text-yt-text-primary text-center mb-2 font-medium">Connecting to Google Photos...</p>
                  <p className="text-yt-text-secondary text-sm text-center">Creating a secure picker session</p>
                </>
              )}

              {status === 'picking' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-yt-bg flex items-center justify-center mb-4">
                    <ExternalLink className="text-yt-text-secondary" size={28} />
                  </div>
                  <p className="text-yt-text-primary text-center mb-2 font-medium">Select your videos</p>
                  <p className="text-yt-text-secondary text-sm text-center mb-4">
                    A Google Photos window has opened. Select the videos you want to import, then tap Done.
                  </p>
                  <div className="flex items-center text-yt-text-secondary">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span className="text-xs">Waiting for selection...</span>
                  </div>
                </>
              )}

              {status === 'retrieving' && (
                <>
                  <Loader2 className="animate-spin text-yt-text-secondary mb-4" size={32} />
                  <p className="text-yt-text-primary text-center mb-2 font-medium">Retrieving your videos...</p>
                  <p className="text-yt-text-secondary text-sm text-center">Fetching selected videos from Google Photos</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
