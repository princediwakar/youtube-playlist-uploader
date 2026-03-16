import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { convertAudioToWaveformVideo, convertAudioToVideo, generateSimpleAudioThumbnail } from '../../../../app/utils/ffmpegWrapper'

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for audio conversion

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const thumbnailFile = formData.get('thumbnail') as File | null
    const title = formData.get('title') as string || 'Audio Upload'
    const duration = formData.get('duration') as string
    const outputFormat = formData.get('outputFormat') as string || 'mp4'
    const waveformMode = formData.get('waveformMode') as string || 'cline'
    const waveformColor = formData.get('waveformColor') as string || '0xff0000'

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
    }

    console.log('Audio conversion request:', {
      audioFileName: audioFile.name,
      audioFileSize: audioFile.size,
      title,
      duration,
      outputFormat,
      waveformMode
    })

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    let videoBuffer: Buffer

    try {
      // Primary: Generate animated waveform video
      videoBuffer = await convertAudioToWaveformVideo(
        audioBuffer,
        audioFile.name,
        {
          width: 1280,
          height: 720,
          waveformColor,
          backgroundColor: '0x0f0f0f',
          waveMode: waveformMode as any,
          fps: 25,
          outputFormat
        }
      )
      console.log('Animated waveform video generated successfully')
    } catch (waveformError) {
      console.warn('Waveform generation failed, falling back to static thumbnail:', waveformError)

      // Fallback: Static thumbnail approach
      let thumbnailBuffer: Buffer
      if (thumbnailFile) {
        thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer())
      } else {
        thumbnailBuffer = await generateSimpleAudioThumbnail(title, undefined, duration ? parseFloat(duration) : undefined)
      }

      videoBuffer = await convertAudioToVideo(
        audioBuffer,
        thumbnailBuffer,
        audioFile.name,
        'thumbnail.jpg',
        { duration: duration ? parseFloat(duration) : 10, title }
      )
    }

    // Return the converted video
    return new NextResponse(new Uint8Array(videoBuffer), {
      status: 200,
      headers: {
        'Content-Type': `video/${outputFormat}`,
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9.-]/g, '_')}.${outputFormat}"`,
        'Content-Length': videoBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Audio conversion route error:', error)

    let errorMessage = 'Audio conversion failed'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific FFmpeg errors
    if (errorDetails.includes('FFmpeg') || errorDetails.includes('ffmpeg')) {
      errorMessage = 'FFmpeg processing failed'
    } else if (errorDetails.includes('ENOENT') || errorDetails.includes('No such file')) {
      errorMessage = 'FFmpeg not installed or not found'
      errorDetails = 'FFmpeg binary is required for audio-to-video conversion. Please ensure FFmpeg is installed on the server.'
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}

// GET endpoint for testing/conversion status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/audio/convert',
    description: 'Convert audio files to video containers for YouTube upload',
    supportedFormats: {
      audio: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'],
      thumbnail: ['jpg', 'jpeg', 'png', 'webp'],
      output: ['mp4', 'mov', 'avi', 'webm']
    },
    requirements: [
      'FFmpeg installed on server',
      'Audio file (multipart form field: audio)',
      'Thumbnail image (multipart form field: thumbnail)',
      'Optional: duration (seconds), frameRate, outputFormat'
    ]
  })
}