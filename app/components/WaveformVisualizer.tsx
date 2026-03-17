'use client'

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  waveform: number[]
  width?: number
  height?: number
  color?: string
  backgroundColor?: string
  interactive?: boolean
  currentTime?: number // 0-1 normalized
  onSeek?: (normalizedTime: number) => void
  className?: string
}

export function WaveformVisualizer({
  waveform,
  width = 160,
  height = 90,
  color = '#ff3333', // Softer red
  backgroundColor = 'transparent',
  interactive = false,
  currentTime = 0,
  onSeek,
  className = ''
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Draw waveform on canvas
  const drawWaveform = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill background if specified
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Normalize waveform data to fit canvas height
    const maxAmplitude = Math.max(...waveform)
    const normalized = maxAmplitude > 0
      ? waveform.map(v => v / maxAmplitude)
      : waveform.map(() => 0)

    // Draw waveform bars
    const barWidth = canvas.width / normalized.length
    const centerY = canvas.height / 2
    const maxBarHeight = canvas.height * 0.8

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    // Draw smooth line through waveform points
    for (let i = 0; i < normalized.length; i++) {
      const amplitude = normalized[i]
      const x = i * barWidth
      const y = centerY - (amplitude * maxBarHeight) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Draw playback progress indicator
    if (currentTime > 0 && currentTime <= 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      const progressX = currentTime * canvas.width
      ctx.fillRect(progressX - 1, 0, 2, canvas.height)
    }

    // Draw playhead if interactive
    if (interactive && currentTime > 0 && currentTime <= 1) {
      ctx.fillStyle = '#ffffff'
      const playheadX = currentTime * canvas.width
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, canvas.height)
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Handle click/tap for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onSeek) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const normalizedTime = Math.max(0, Math.min(1, x / canvas.width))

    onSeek(normalizedTime)
  }

  // Handle drag for seeking
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onSeek) return
    isDragging.current = true
    handleCanvasClick(e)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !interactive || !onSeek || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const normalizedTime = Math.max(0, Math.min(1, x / canvas.width))

    onSeek(normalizedTime)
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // Add event listeners for drag interaction
  useEffect(() => {
    if (!interactive) return

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [interactive, onSeek])

  // Draw waveform when props change
  useEffect(() => {
    drawWaveform()
  }, [waveform, width, height, color, backgroundColor, currentTime])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        className="cursor-pointer"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      />
      {interactive && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-black/50 rounded-full p-2">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for small thumbnails
export function CompactWaveformVisualizer({
  waveform,
  width = 64,
  height = 36,
  color = '#ff3333',
  backgroundColor = 'transparent'
}: Omit<WaveformVisualizerProps, 'interactive' | 'currentTime' | 'onSeek' | 'className'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill background if specified
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Normalize waveform
    const maxAmplitude = Math.max(...waveform)
    const normalized = maxAmplitude > 0
      ? waveform.map(v => v / maxAmplitude)
      : waveform.map(() => 0)

    // Draw simplified waveform (every other point for performance)
    const step = Math.max(1, Math.floor(normalized.length / 50))
    const barWidth = canvas.width / (normalized.length / step)
    const centerY = canvas.height / 2
    const maxBarHeight = canvas.height * 0.6

    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()

    // Draw simplified line waveform
    for (let i = 0; i < normalized.length; i += step) {
      const amplitude = normalized[i]
      const x = (i / step) * barWidth
      const y = centerY - (amplitude * maxBarHeight) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()
  }, [waveform, width, height, color, backgroundColor])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block"
    />
  )
}