'use client'

import { useCallback } from 'react'
import { useAppStore } from '@/app/store'
import { useFfmpegEngine, type EngineOptions } from '@/app/hooks/useFfmpegEngine'

export interface ConvertedAudio {
  id: string
  originalPath: string
  blob: Blob
  file: File
}

let idCounter = 0

export function useAudioConverter() {
  const { status, convert, ready } = useFfmpegEngine()
  const setEngineReady = useAppStore((s) => s.setFfmpegEngineReady)
  const setConversion = useAppStore((s) => s.setPendingAudioConversion)
  const clearConversion = useAppStore((s) => s.clearPendingAudioConversion)

  const setReady = useCallback((r: boolean) => {
    setEngineReady(r)
  }, [setEngineReady])

  const convertToVideo = useCallback(async (
    file: File,
    path: string,
    opts: EngineOptions = {}
  ): Promise<Blob> => {
    if (!ready) throw new Error('FFmpeg engine not ready')

    const id = `conv_${++idCounter}_${Date.now()}`
    setConversion(id, 'converting')

    try {
      const blob = await convert(file, opts)
      setConversion(id, 'done')
      return blob
    } catch (err) {
      clearConversion(id)
      throw err
    }
  }, [convert, ready, setConversion, clearConversion])

  return {
    engineReady: ready,
    engineStatus: status,
    setReady,
    convertToVideo,
  }
}

export function useAudioQueue() {
  const pending = useAppStore((s) => s.pendingAudioConversions)
  return pending
}