'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, AlertTriangle, Loader2, ExternalLink, Monitor } from 'lucide-react'
import type { GooglePhotosImportItem } from '@/app/types/googlePhotos'
import { createPhotosSession } from '@/app/actions/photos'
import type { PickedMediaItem } from '@/app/services/googlePhotosApi'

interface GooglePhotosPickerProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: GooglePhotosImportItem[]) => void
  initialWindow?: Window | null
}

type PickerStatus = 'creating' | 'picking' | 'retrieving' | 'done'

function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/.test(ua) || (/Android/.test(ua) && /Mobile/.test(ua))
}

export default function GooglePhotosPicker({ isOpen, onClose, onImport, initialWindow }: GooglePhotosPickerProps) {
  const [status, setStatus] = useState<PickerStatus>('creating')
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const pickerWindowRef = useRef<Window | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortedRef = useRef(false)
  const isMobileRef = useRef(false)

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

    if (isMobileBrowser()) {
      isMobileRef.current = true
      setError('Google Photos Picker requires a desktop browser. Please switch to a desktop or laptop computer to import videos from Google Photos.')
      return
    }
    isMobileRef.current = false

    let cancelled = false

    const run = async () => {
      try {
        pickerWindowRef.current = initialWindow || (isMobileBrowser() ? null : window.open('', '_blank'))

        let sessionData: { sessionId: string; pickerUri: string }
        try {
          sessionData = await createPhotosSession()
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          if (pickerWindowRef.current && !pickerWindowRef.current.closed) {
             pickerWindowRef.current.document.body.innerHTML = `
               <div style="text-align: center; font-family: system-ui, sans-serif; padding: 20px; background: #0f0f0f; color: #fff; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; margin: 0;">
                 <h2 style="color: #ef4444; margin-bottom: 8px;">Connection Failed</h2>
                 <p style="color: #ddd;">${errorMessage}</p>
                 <p style="color: #aaa; font-size: 14px; margin-top: 16px;">Please close this tab and return to the main window.</p>
                 <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Tab</button>
               </div>
             `
          }
          if (errorMessage.includes('403') || errorMessage.includes('Photos permission')) {
            setNeedsReauth(true)
            setError('Google Photos permission required. Please sign out and sign in again to grant access.')
            return
          }
          throw err
        }

        const { sessionId, pickerUri } = sessionData
        sessionIdRef.current = sessionId
        setStatus('picking')

        if (cancelled) return

        const pickerUrl = pickerUri.endsWith('/') ? `${pickerUri}autoclose` : `${pickerUri}/autoclose`
        if (pickerWindowRef.current && !pickerWindowRef.current.closed) {
          pickerWindowRef.current.location.href = pickerUrl
        } else if (!isMobileBrowser()) {
          pickerWindowRef.current = window.open(pickerUrl, '_blank')
        }

        let attempts = 0
        const maxAttempts = 150
        let windowClosedAttempts = 0
        const maxWindowClosedAttempts = 30

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
            const { pollPhotosSession } = await import('@/app/actions/photos')
            const data = await pollPhotosSession(sessionId)

            if (!data.ready) {
              const delay = pickerWindowRef.current?.closed ? 1000 : 2000
              pollTimerRef.current = setTimeout(poll, delay)
              return
            }

            setStatus('retrieving')

            const videoItems: GooglePhotosImportItem[] = (data.mediaItems || [])
              .filter((item: PickedMediaItem) => item.type === 'VIDEO' || item.mediaFile?.mimeType?.startsWith('video/'))
              .map((item: PickedMediaItem) => ({
                id: item.id,
                filename: item.mediaFile.filename || item.id,
                mimeType: item.mediaFile.mimeType,
                baseUrl: item.mediaFile.baseUrl,
                fetchedAt: data.fetchedAt || new Date().toISOString(),
                creationTime: item.createTime || '',
                width: item.mediaFile.mediaFileMetadata?.width || 0,
                height: item.mediaFile.mediaFileMetadata?.height || 0,
              }))

            if (videoItems.length === 0) {
              if (data.mediaItems && data.mediaItems.length > 0) {
                setError('You selected photos, but this tool only supports video uploads. Please try again and select video files.')
              } else {
                setError('No videos were selected. Please try again.')
              }
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
        className="bg-white border border-yt-border rounded-xl w-full max-w-sm sm:max-w-md mx-4 my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-yt-border">
          <h3 className="text-base sm:text-lg font-medium text-yt-text-primary">
            Google Photos
          </h3>
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-lg flex items-center justify-center text-yt-text-secondary hover:bg-yt-hover hover:text-yt-text-primary transition-colors touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
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
              {isMobileRef.current ? (
                <>
                  <Monitor className="text-yt-text-secondary mb-4" size={32} />
                  <p className="text-yt-text-primary text-center mb-2 font-medium">Desktop Required</p>
                  <p className="text-yt-text-secondary text-sm text-center mb-6">{error}</p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-yt-blue text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    OK
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
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
                    A Google Photos tab has opened. Select your videos, then close the tab when done.
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
