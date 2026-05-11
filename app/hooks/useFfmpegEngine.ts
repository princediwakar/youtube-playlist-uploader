'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'

type EngineOutgoing =
  | { type: 'init' }
  | { type: 'convert'; id: string; file: ArrayBuffer; options: EngineOptions }

type EngineIncoming =
  | { type: 'boot' }
  | { type: 'loaded' }
  | { type: 'progress'; progress: number }
  | { type: 'done'; id: string; blob: number[]; blobSize: number }
  | { type: 'error'; id?: string; error: string }

export interface EngineOptions {
  width?: number
  height?: number
  waveformColor?: string
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  showMetadata?: boolean
  metadata?: {
    title?: string
    artist?: string
    album?: string
  }
  fps?: number
  waveMode?: string
}

interface ConversionJob {
  id: string
  arrayBuffer: ArrayBuffer
  options: EngineOptions
  resolve: (blob: Blob) => void
  reject: (error: Error) => void
}

let idCounter = 0
let globalInstance: { engine: Window | null; booted: boolean } | null = null

export function useFfmpegEngine() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [status, setStatus] = useState<'idle' | 'booting' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Map<string, ConversionJob>>(new Map())
  const engineRef = useRef<Window | null>(null)
  const bootedRef = useRef(false)
  const initRef = useRef<(() => void) | null>(null)

  const sendMessage = useCallback((msg: EngineOutgoing) => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    try {
      iframe.contentWindow.postMessage(msg, '*')
    } catch {}
  }, [])

  const cleanup = useCallback(() => {
    pendingRef.current.forEach((job) => {
      job.reject(new DOMException('Engine destroyed', 'AbortError'))
    })
    pendingRef.current.clear()
  }, [])

  useEffect(() => {
    if (globalInstance?.booted) {
      setStatus('loading')
      sendMessage({ type: 'init' })
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'ffmpeg-engine-' + Math.random().toString(36).slice(2)
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;top:-9999px;left:-9999px;border:none;outline:none;background:transparent'
    iframe.src = '/api/engine'
    iframe.setAttribute('allow', 'cross-origin-isolated; cross-origin-resource-policy: cross-origin')
    document.body.appendChild(iframe)
    iframeRef.current = iframe
    setStatus('booting')

    const onMessage = (e: MessageEvent<EngineIncoming>) => {
      const { type } = e.data

      if (type === 'boot') {
        globalInstance = { engine: iframe.contentWindow, booted: true }
        engineRef.current = iframe.contentWindow
        bootedRef.current = true
        sendMessage({ type: 'init' })
        setStatus('loading')
        return
      }

      if (type === 'loaded') {
        setStatus('ready')
        return
      }

      if (type === 'progress') {
        return
      }

      if (type === 'done') {
        const job = pendingRef.current.get(e.data.id)
        if (job) {
          pendingRef.current.delete(e.data.id)
          const uint8 = new Uint8Array(e.data.blob)
          const blob = new Blob([uint8], { type: 'video/mp4' })
          job.resolve(blob)
        }
        return
      }

      if (type === 'error') {
        const id = e.data.id
        if (id) {
          const job = pendingRef.current.get(id)
          if (job) {
            pendingRef.current.delete(id)
            job.reject(new Error(e.data.error))
          }
        }
        if (!id) {
          setError(e.data.error)
          setStatus('error')
        }
        return
      }
    }

    window.addEventListener('message', onMessage)
    initRef.current = () => {
      try {
        window.removeEventListener('message', onMessage)
      } catch {}
      try {
        document.body.removeChild(iframe)
      } catch {}
      iframeRef.current = null
      engineRef.current = null
      bootedRef.current = false
      globalInstance = null
    }

    return () => {
      cleanup()
      if (initRef.current) initRef.current()
      initRef.current = null
    }
  }, [sendMessage, cleanup])

  const convert = useCallback(
    (file: File | ArrayBuffer, opts: EngineOptions = {}): Promise<Blob> => {
      if (status !== 'ready') {
        return Promise.reject(new Error(`Engine not ready (status: ${status})`))
      }

      const engine = globalInstance?.engine ?? engineRef.current

      const arrayBuffer: Promise<ArrayBuffer> =
        file instanceof ArrayBuffer ? Promise.resolve(file) : file.arrayBuffer()

      return arrayBuffer.then((ab) => {
        return new Promise<Blob>((resolve, reject) => {
          const id = String(++idCounter)
          const job: ConversionJob = { id, arrayBuffer: ab, options: opts, resolve, reject }
          pendingRef.current.set(id, job)

          try {
            engine?.postMessage(
              { type: 'convert', id, file: ab, options: opts },
              '*'
            )
          } catch (err) {
            pendingRef.current.delete(id)
            reject(err instanceof Error ? err : new Error(String(err)))
          }

          setTimeout(() => {
            if (pendingRef.current.has(id)) {
              pendingRef.current.delete(id)
              reject(new DOMException('Conversion timed out', 'TimeoutError'))
            }
          }, 120_000)
        })
      })
    },
    [status]
  )

  return useMemo(() => ({ status, error, convert, ready: status === 'ready' }), [status, error, convert])
}