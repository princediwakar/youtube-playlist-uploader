// app/utils/audioHelpers.ts
import { AudioFile } from '@/app/types/media'

// Basic audio analysis without Web Audio API
export async function analyzeAudioBasic(file: File): Promise<{
  duration: number
  waveform: number[]  // Array of amplitude values (100-200 samples)
  audioThumbnail: string  // Canvas-generated "video frame"
  artist?: string
  album?: string
  genre?: string
  audioFormat?: string
  bitrate?: number
  sampleRate?: number
  channels?: number
}> {
  // Generate synthetic waveform (flat line with slight variations)
  const samples = 100
  const waveform: number[] = []
  for (let i = 0; i < samples; i++) {
    // Create a simple sine wave pattern for visualization
    const t = i / samples * Math.PI * 4
    waveform.push(0.3 + 0.2 * Math.sin(t))
  }

  // Generate audio thumbnail
  const audioThumbnail = generateAudioThumbnail(waveform, file.name)

  // Extract metadata from filename
  const metadata = await extractAudioMetadata(file)

  // Estimate duration based on file size and format (very rough estimate)
  // Common bitrates: MP3 ~128kbps, WAV ~1411kbps, M4A ~128kbps
  const extension = file.name.toLowerCase().split('.').pop() || ''
  let estimatedBitrate = 128000 // 128 kbps default
  if (extension === 'wav' || extension === 'flac') {
    estimatedBitrate = 1411000 // 1411 kbps for lossless
  } else if (extension === 'm4a' || extension === 'aac') {
    estimatedBitrate = 128000
  } else if (extension === 'ogg') {
    estimatedBitrate = 96000 // 96 kbps typical for OGG
  }

  const estimatedDuration = file.size * 8 / estimatedBitrate // seconds
  const bitrate = Math.round(estimatedBitrate / 1000) // kbps

  return {
    duration: estimatedDuration,
    waveform,
    audioThumbnail,
    audioFormat: getAudioFormat(file.name),
    bitrate,
    sampleRate: 44100, // Common default
    channels: 2, // Stereo default
    ...metadata
  }
}

// Web Audio API integration for audio analysis
export async function analyzeAudio(file: File): Promise<{
  duration: number
  waveform: number[]  // Array of amplitude values (100-200 samples)
  audioThumbnail: string  // Canvas-generated "video frame"
  artist?: string
  album?: string
  genre?: string
  audioFormat?: string
  bitrate?: number
  sampleRate?: number
  channels?: number
}> {
  return new Promise((resolve, reject) => {
    // Feature detection for Web Audio API - fallback to basic analysis if not available
    if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) {
      console.warn('Web Audio API not available, using basic audio analysis')
      analyzeAudioBasic(file).then(resolve).catch(reject)
      return
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Extract waveform data (simplified for performance)
        const channelData = audioBuffer.getChannelData(0)
        const samples = 100 // Number of waveform points (balance detail vs performance)
        const waveform = extractWaveform(channelData, samples)

        // Generate audio thumbnail (canvas-based "video frame")
        const audioThumbnail = generateAudioThumbnail(waveform, file.name)

        // Extract metadata if available
        const metadata = await extractAudioMetadata(file)

        // Calculate approximate bitrate (bits per second)
        const bitrate = file.size * 8 / audioBuffer.duration

        resolve({
          duration: audioBuffer.duration,
          waveform,
          audioThumbnail,
          audioFormat: getAudioFormat(file.name),
          bitrate: Math.round(bitrate / 1000), // kbps
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          ...metadata
        })
      } catch (error) {
        reject(error)
      } finally {
        // Clean up AudioContext to prevent memory leaks
        audioContext.close()
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read audio file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Performance-optimized waveform extraction
function extractWaveform(channelData: Float32Array, samples: number): number[] {
  const blockSize = Math.floor(channelData.length / samples)
  const waveform: number[] = []

  for (let i = 0; i < samples; i++) {
    const blockStart = i * blockSize
    const blockEnd = Math.min(blockStart + blockSize, channelData.length)

    if (blockStart >= blockEnd) {
      waveform.push(0)
      continue
    }

    // Calculate RMS (root mean square) for better visualization
    let sumOfSquares = 0
    for (let j = blockStart; j < blockEnd; j++) {
      sumOfSquares += channelData[j] * channelData[j]
    }

    const rms = Math.sqrt(sumOfSquares / (blockEnd - blockStart))
    waveform.push(rms)
  }

  return waveform
}

// Generate canvas-based audio thumbnail with waveform visualization
export function generateAudioThumbnail(waveform: number[], fileName: string): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return '' // Fallback if canvas is not supported
  }

  // Set canvas dimensions (YouTube thumbnail size: 1280x720, but we'll use smaller for performance)
  canvas.width = 320
  canvas.height = 180

  // Clear canvas with background
  ctx.fillStyle = '#0f0f0f' // Dark background similar to YouTube
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw waveform
  const maxAmplitude = Math.max(...waveform)
  const normalizedWaveform = maxAmplitude > 0 ? waveform.map(v => v / maxAmplitude) : waveform

  ctx.strokeStyle = '#ff3333' // Softer red
  ctx.lineWidth = 2
  const barWidth = canvas.width / normalizedWaveform.length
  const centerY = canvas.height / 2

  ctx.beginPath()
  for (let i = 0; i < normalizedWaveform.length; i++) {
    const amplitude = normalizedWaveform[i]
    const y = centerY - (amplitude * (canvas.height * 0.8) / 2)

    if (i === 0) {
      ctx.moveTo(i * barWidth, y)
    } else {
      ctx.lineTo(i * barWidth, y)
    }
  }
  ctx.stroke()

  // Add file name text
  const displayName = fileName.replace(/\.[^/.]+$/, '') // Remove extension
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Draw text with shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(displayName, canvas.width / 2, canvas.height - 20)
  ctx.shadowBlur = 0

  // Add "Audio" badge
  ctx.fillStyle = '#ff3333'
  ctx.fillRect(10, 10, 60, 25)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('AUDIO', 15, 25)

  return canvas.toDataURL('image/jpeg', 0.8)
}

// Extract audio metadata from file (basic implementation)
async function extractAudioMetadata(file: File): Promise<{
  artist?: string
  album?: string
  genre?: string
}> {
  // This is a basic implementation
  // In a production app, you would use a library like music-metadata-browser
  // to extract ID3 tags, Vorbis comments, etc.

  const metadata: { artist?: string; album?: string; genre?: string } = {}

  // Extract basic info from filename as fallback
  const fileName = file.name.replace(/\.[^/.]+$/, '')

  // Simple pattern: "Artist - Song" or "Artist - Album - Song"
  const parts = fileName.split(' - ')
  if (parts.length >= 2) {
    metadata.artist = parts[0].trim()

    if (parts.length >= 3) {
      metadata.album = parts[1].trim()
    }
  }

  return metadata
}

// Detect audio format from file extension
function getAudioFormat(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop() || ''

  const formatMap: Record<string, string> = {
    'mp3': 'MP3',
    'wav': 'WAV',
    'm4a': 'M4A/AAC',
    'flac': 'FLAC',
    'ogg': 'OGG/Vorbis',
    'aac': 'AAC',
    'wma': 'WMA',
    'opus': 'Opus',
    'aiff': 'AIFF',
    'alac': 'ALAC'
  }

  return formatMap[extension] || extension.toUpperCase()
}

// Type guard to check if a file is audio
export function isAudioFile(file: File): boolean {
  const audioMimeTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/flac',
    'audio/ogg',
    'audio/x-aac',
    'audio/x-ms-wma',
    'audio/webm'
  ]

  const audioExtensions = /\.(mp3|wav|m4a|flac|ogg|aac|wma|opus|aiff|alac)$/i

  return audioMimeTypes.includes(file.type) || audioExtensions.test(file.name)
}

// Type guard to check if a file is video
export function isVideoFile(file: File): boolean {
  const videoMimeTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/x-flv', 'video/x-ms-wmv', 'video/webm', 'video/x-m4v']
  const videoExtensions = /\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i

  return videoMimeTypes.some(type => file.type.startsWith(type)) || videoExtensions.test(file.name)
}

// Detect media type from file
export function detectMediaType(file: File): 'audio' | 'video' | 'unknown' {
  if (isAudioFile(file)) return 'audio'
  if (isVideoFile(file)) return 'video'
  return 'unknown'
}

// Generate a more sophisticated audio "video frame" with title and description
export function generateAudioFrame(
  waveform: number[],
  title: string,
  description: string,
  options?: {
    width?: number
    height?: number
    backgroundColor?: string
    waveformColor?: string
    textColor?: string
    showMetadata?: boolean
    metadata?: {
      artist?: string
      album?: string
      duration?: number
      format?: string
    }
  }
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  // Default options
  const width = options?.width || 1280
  const height = options?.height || 720
  const backgroundColor = options?.backgroundColor || '#0f0f0f'
  const waveformColor = options?.waveformColor || '#ff3333'
  const textColor = options?.textColor || '#ffffff'
  const showMetadata = options?.showMetadata !== false
  const metadata = options?.metadata || {}

  canvas.width = width
  canvas.height = height

  // Draw background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  // Draw waveform visualization
  const maxAmplitude = Math.max(...waveform)
  const normalizedWaveform = maxAmplitude > 0 ? waveform.map(v => v / maxAmplitude) : waveform

  const waveformHeight = height * 0.4
  const waveformTop = height * 0.3
  const barWidth = width / normalizedWaveform.length

  ctx.strokeStyle = waveformColor
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 0; i < normalizedWaveform.length; i++) {
    const amplitude = normalizedWaveform[i]
    const barHeight = amplitude * waveformHeight
    const y = waveformTop + (waveformHeight - barHeight) / 2

    if (i === 0) {
      ctx.moveTo(i * barWidth, y)
    } else {
      ctx.lineTo(i * barWidth, y)
    }
  }
  ctx.stroke()

  // Draw title
  ctx.fillStyle = textColor
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Wrap title if too long
  const maxTitleWidth = width * 0.8
  const titleLines = wrapText(ctx, title, maxTitleWidth, 48)
  const titleY = waveformTop + waveformHeight + 60

  titleLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, titleY + index * 60)
  })

  // Draw description (truncated)
  if (description) {
    ctx.font = '24px Arial, sans-serif'
    const maxDescWidth = width * 0.9
    const descLines = wrapText(ctx, description, maxDescWidth, 24, 3) // Max 3 lines

    const descY = titleY + (titleLines.length * 60) + 40
    descLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, descY + index * 35)
    })
  }

  // Draw metadata if available
  if (showMetadata) {
    ctx.font = '20px Arial, sans-serif'
    ctx.textAlign = 'left'

    let metaY = height - 40
    const metaX = 40

    if (metadata.artist) {
      ctx.fillText(`Artist: ${metadata.artist}`, metaX, metaY)
      metaY -= 30
    }

    if (metadata.album) {
      ctx.fillText(`Album: ${metadata.album}`, metaX, metaY)
      metaY -= 30
    }

    if (metadata.duration) {
      const minutes = Math.floor(metadata.duration / 60)
      const seconds = Math.floor(metadata.duration % 60)
      ctx.fillText(`Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`, metaX, metaY)
      metaY -= 30
    }

    if (metadata.format) {
      ctx.fillText(`Format: ${metadata.format}`, metaX, metaY)
    }
  }

  // Draw "Audio" badge in top-right corner
  ctx.fillStyle = waveformColor
  ctx.fillRect(width - 120, 20, 100, 40)
  ctx.fillStyle = textColor
  ctx.font = 'bold 20px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AUDIO', width - 70, 45)

  return canvas.toDataURL('image/jpeg', 0.9)
}

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines?: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine + ' ' + word
    const metrics = ctx.measureText(testLine)

    if (metrics.width < maxWidth) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word

      if (maxLines && lines.length >= maxLines) {
        // Add ellipsis to last line if truncated
        if (i < words.length - 1) {
          lines[lines.length - 1] += '...'
        }
        break
      }
    }
  }

  if (currentLine && (!maxLines || lines.length < maxLines)) {
    lines.push(currentLine)
  }

  return lines
}