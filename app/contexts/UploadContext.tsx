'use client'

import { createContext, useContext, useCallback, useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { useVideoUpload } from '@/app/hooks/useVideoUpload'
import { useFfmpegEngine, type EngineOptions } from '@/app/hooks/useFfmpegEngine'

interface UploadContextValue {
  isUploading: boolean
  isPaused: boolean
  currentUpload: string | null
  uploadQueue: import('@/app/hooks/useVideoUpload').UploadQueueItem[]
  uploadStats: import('@/app/hooks/useVideoUpload').UploadStats | null
  quotaWarning: string | null
  ffmpegEngineReady: boolean
  pauseUpload: () => void
  resumeUpload: () => void
  cancelUpload: () => void
  clearQuotaWarning: () => void
  convertAudioFile: (file: File, opts: EngineOptions) => Promise<Blob>
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const setQuotaWarning = useAppStore((s) => s.setQuotaWarning)
  const setFfmpegEngineReady = useAppStore((s) => s.setFfmpegEngineReady)

  const {
    isUploading,
    isPaused,
    currentUpload,
    uploadQueue,
    uploadStats,
    quotaWarning,
    pauseUpload,
    resumeUpload,
    cancelUpload,
  } = useVideoUpload()

  const { status, convert, ready } = useFfmpegEngine()

  useEffect(() => {
    setFfmpegEngineReady(status === 'ready')
  }, [status, setFfmpegEngineReady])

  const clearQuotaWarning = useCallback(() => {
    setQuotaWarning(null)
  }, [setQuotaWarning])

  const convertAudioFile = useCallback(
    (file: File, opts: EngineOptions = {}): Promise<Blob> => {
      if (!ready) return Promise.reject(new Error('FFmpeg engine not ready'))
      return convert(file, opts)
    },
    [convert, ready]
  )

  const value: UploadContextValue = {
    isUploading,
    isPaused,
    currentUpload,
    uploadQueue,
    uploadStats,
    quotaWarning,
    ffmpegEngineReady: ready,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearQuotaWarning,
    convertAudioFile,
  }

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUploadContext(): UploadContextValue {
  const ctx = useContext(UploadContext)
  if (!ctx) {
    throw new Error('useUploadContext must be used within an UploadProvider')
  }
  return ctx
}