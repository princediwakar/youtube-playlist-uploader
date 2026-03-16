import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute for audio analysis

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional but recommended)
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
    }

    console.log('Audio analysis request:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type
    })

    // Create temporary file path
    const tempDir = '/tmp'
    const audioTempPath = path.join(tempDir, `audio-analysis-${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

    try {
      // Write audio to temp file
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      await writeFile(audioTempPath, audioBuffer)

      // Use FFprobe to analyze audio file
      const metadata = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(audioTempPath, (err, metadata) => {
          if (err) {
            reject(err)
          } else {
            resolve(metadata)
          }
        })
      })

      // Extract relevant audio information
      const audioStream = metadata.streams.find((stream: any) => stream.codec_type === 'audio')
      const format = metadata.format

      if (!audioStream) {
        throw new Error('No audio stream found in file')
      }

      const analysisResult = {
        duration: format.duration || audioStream.duration || 0,
        format: format.format_name || 'unknown',
        bitrate: format.bit_rate ? Math.round(parseInt(format.bit_rate) / 1000) : 0, // kbps
        sampleRate: audioStream.sample_rate ? parseInt(audioStream.sample_rate) : 0,
        channels: audioStream.channels || 1,
        codec: audioStream.codec_name || 'unknown',
        size: audioFile.size,
        fileName: audioFile.name,
        // Server-side analysis doesn't generate waveform data yet
        // Client-side Web Audio API handles actual waveform extraction
        waveform: [],
        hasCoverArt: metadata.streams.some((stream: any) => stream.codec_type === 'video'),
        metadata: {
          title: format.tags?.title || null,
          artist: format.tags?.artist || null,
          album: format.tags?.album || null,
          genre: format.tags?.genre || null,
          year: format.tags?.year || null,
          track: format.tags?.track || null
        }
      }

      console.log('Audio analysis completed:', {
        duration: analysisResult.duration,
        format: analysisResult.format,
        bitrate: analysisResult.bitrate
      })

      // Clean up temp file
      await unlink(audioTempPath)

      return NextResponse.json(analysisResult)

    } catch (analysisError) {
      // Clean up temp file
      await unlink(audioTempPath).catch(() => {})
      throw analysisError
    }

  } catch (error) {
    console.error('Audio analysis route error:', error)

    let errorMessage = 'Audio analysis failed'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'

    // Handle FFprobe errors
    if (errorDetails.includes('ffprobe') || errorDetails.includes('FFprobe')) {
      errorMessage = 'Audio analysis tool failed'
    } else if (errorDetails.includes('ENOENT') || errorDetails.includes('No such file')) {
      errorMessage = 'FFprobe not available'
      errorDetails = 'FFmpeg/FFprobe is required for server-side audio analysis. Please ensure FFmpeg is installed on the server.'
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}

// GET endpoint for testing/status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/audio/analyze',
    description: 'Server-side audio analysis for browsers without Web Audio API support',
    supportedFormats: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'opus', 'aiff'],
    capabilities: [
      'Duration detection',
      'Format identification',
      'Bitrate calculation',
      'Sample rate detection',
      'Channel count',
      'Basic metadata extraction (ID3 tags, etc.)',
      'Simplified waveform generation'
    ],
    requirements: [
      'FFmpeg/FFprobe installed on server',
      'Audio file (multipart form field: audio)'
    ]
  })
}