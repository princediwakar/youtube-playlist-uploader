import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

export interface AudioConversionOptions {
  duration?: number
  frameRate?: number
  videoCodec?: string
  audioCodec?: string
  outputFormat?: string
  title?: string
  artist?: string
  album?: string
}

export interface AudioAnalysisResult {
  duration: number
  format: string
  bitrate: number // kbps
  sampleRate: number
  channels: number
  codec: string
  metadata?: {
    title?: string
    artist?: string
    album?: string
    genre?: string
    year?: string
    track?: string
  }
}

/**
 * Convert audio file + thumbnail image to video file for YouTube upload
 */
export async function convertAudioToVideo(
  audioBuffer: Buffer,
  thumbnailBuffer: Buffer,
  audioFileName: string,
  thumbnailFileName: string,
  options: AudioConversionOptions = {}
): Promise<Buffer> {
  const {
    duration = 10,
    frameRate = 1,
    videoCodec = 'libx264',
    audioCodec = 'aac',
    outputFormat = 'mp4'
  } = options

  // Create temporary file paths
  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `conv-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const thumbnailTempPath = path.join(tempDir, `conv-thumb-${Date.now()}-${thumbnailFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const outputTempPath = path.join(tempDir, `conv-output-${Date.now()}.${outputFormat}`)

  try {
    // Write buffers to temp files
    await writeFile(audioTempPath, audioBuffer)
    await writeFile(thumbnailTempPath, thumbnailBuffer)

    // Convert using FFmpeg
    const videoBuffer = await new Promise<Buffer>((resolve, reject) => {
      const command = ffmpeg()
        .input(thumbnailTempPath)
        .inputOptions([
          '-loop 1',
          `-t ${duration}`,
          `-framerate ${frameRate}`
        ])
        .input(audioTempPath)
        .outputOptions([
          `-c:v ${videoCodec}`,
          `-c:a ${audioCodec}`,
          '-b:a 192k',
          '-pix_fmt yuv420p',
          '-shortest'
        ])
        .output(outputTempPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg conversion started:', commandLine)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Conversion progress: ${progress.percent}%`)
          }
        })
        .on('end', async () => {
          try {
            const buffer = await readFile(outputTempPath)
            resolve(buffer)
          } catch (readError) {
            reject(readError)
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg conversion failed: ${err.message}`))
        })

      command.run()
    })

    return videoBuffer

  } finally {
    // Clean up temp files
    await Promise.allSettled([
      unlink(audioTempPath).catch(() => {}),
      unlink(thumbnailTempPath).catch(() => {}),
      unlink(outputTempPath).catch(() => {})
    ])
  }
}

export interface WaveformVideoOptions {
  width?: number
  height?: number
  waveformColor?: string      // Hex color for the waveform (e.g., '0xff0000')
  backgroundColor?: string    // Hex color for background (e.g., '0x0f0f0f')
  waveMode?: 'point' | 'line' | 'p2p' | 'cline'  // Waveform drawing mode
  fps?: number
  videoCodec?: string
  audioCodec?: string
  outputFormat?: string
  // Metadata display options
  showMetadata?: boolean
  metadata?: {
    title?: string
    artist?: string
    album?: string
    duration?: number
    format?: string
  }
  textColor?: string          // Hex color for text (e.g., '0xffffff')
  fontSize?: number           // Base font size
  showWaveformOnly?: boolean  // If true, only show waveform without metadata
}

/**
 * Convert audio file to an animated waveform visualization video using FFmpeg's showwaves filter.
 * This generates a real animated waveform synced to the audio — not a static image.
 */
export async function convertAudioToWaveformVideo(
  audioBuffer: Buffer,
  audioFileName: string,
  options: WaveformVideoOptions = {}
): Promise<Buffer> {
  const {
    width = 1280,
    height = 720,
    waveformColor = '0xff0000',    // YouTube red
    backgroundColor = '0x0f0f0f',  // Near-black
    waveMode = 'cline',            // Centered line — smooth and professional
    fps = 25,
    videoCodec = 'libx264',
    audioCodec = 'aac',
    outputFormat = 'mp4',
    // Metadata options with defaults
    showMetadata = true,
    metadata = {},
    textColor = '0xffffff',
    fontSize = 24,
    showWaveformOnly = false
  } = options

  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `waveform-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
  const outputTempPath = path.join(tempDir, `waveform-output-${Date.now()}.${outputFormat}`)

  try {
    await writeFile(audioTempPath, audioBuffer)

    const videoBuffer = await new Promise<Buffer>((resolve, reject) => {
      // Build the filter_complex string:
      // 1. showwaves generates the waveform video from the audio
      // 2. We split the audio so we can use it for both visualization and the output audio track
      const filterComplex = [
        `[0:a]showwaves=s=${width}x${height}:mode=${waveMode}:rate=${fps}:colors=${waveformColor}:scale=sqrt[waves]`,
        `color=c=${backgroundColor}:s=${width}x${height}:r=${fps}[bg]`,
        `[bg][waves]overlay=shortest=1:format=auto[v]`
      ].join(';')

      const command = ffmpeg()
        .input(audioTempPath)
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[v]',
          '-map', '0:a',
          `-c:v`, videoCodec,
          `-c:a`, audioCodec,
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',  // Allow YouTube to start playing sooner
          '-preset', 'fast'
        ])
        .output(outputTempPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg waveform generation started:', commandLine)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Waveform generation progress: ${Math.round(progress.percent)}%`)
          }
        })
        .on('end', async () => {
          try {
            const buffer = await readFile(outputTempPath)
            resolve(buffer)
          } catch (readError) {
            reject(readError)
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg waveform generation failed: ${err.message}`))
        })

      command.run()
    })

    return videoBuffer

  } finally {
    await Promise.allSettled([
      unlink(audioTempPath).catch(() => {}),
      unlink(outputTempPath).catch(() => {})
    ])
  }
}

/**
 * Analyze audio file using FFprobe
 */
export async function analyzeAudioFile(
  audioBuffer: Buffer,
  audioFileName: string
): Promise<AudioAnalysisResult> {
  const tempDir = '/tmp'
  const audioTempPath = path.join(tempDir, `analyze-audio-${Date.now()}-${audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

  try {
    await writeFile(audioTempPath, audioBuffer)

    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(audioTempPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
    })

    const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio')
    const format = metadata.format

    if (!audioStream) {
      throw new Error('No audio stream found in audio file')
    }

    return {
      duration: format.duration || audioStream.duration || 0,
      format: format.format_name || 'unknown',
      bitrate: format.bit_rate ? Math.round(parseInt(format.bit_rate) / 1000) : 0,
      sampleRate: audioStream.sample_rate ? parseInt(audioStream.sample_rate) : 0,
      channels: audioStream.channels || 1,
      codec: audioStream.codec_name || 'unknown',
      metadata: {
        title: format.tags?.title || undefined,
        artist: format.tags?.artist || undefined,
        album: format.tags?.album || undefined,
        genre: format.tags?.genre || undefined,
        year: format.tags?.year || undefined,
        track: format.tags?.track || undefined
      }
    }

  } finally {
    await unlink(audioTempPath).catch(() => {})
  }
}

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFfmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err)
    })
  })
}

/**
 * Generate a simple thumbnail for audio files (fallback if no thumbnail provided)
 * This creates a basic waveform visualization using Node.js canvas alternatives
 */
export async function generateSimpleAudioThumbnail(
  title: string,
  artist?: string,
  duration?: number,
  width = 1280,
  height = 720
): Promise<Buffer> {
  // In a production environment, you would use a canvas library like node-canvas
  // or generate a more sophisticated thumbnail using actual waveform data

  // For now, return a placeholder image buffer (solid color with text)
  // This is a minimal implementation - in production, implement proper canvas rendering

  const placeholderSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f0f0f"/>
  <text x="50%" y="40%" text-anchor="middle" fill="#ff0000" font-size="48" font-family="Arial, sans-serif">${title}</text>
  ${artist ? `<text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="32" font-family="Arial, sans-serif">${artist}</text>` : ''}
  <text x="50%" y="70%" text-anchor="middle" fill="#888888" font-size="24" font-family="Arial, sans-serif">Audio Content</text>
  ${duration ? `<text x="50%" y="85%" text-anchor="middle" fill="#666666" font-size="20" font-family="Arial, sans-serif">Duration: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}</text>` : ''}
</svg>`

  return Buffer.from(placeholderSvg, 'utf-8')
}