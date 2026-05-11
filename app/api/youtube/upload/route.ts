// app/api/youtube/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { YouTubeApiService } from '../../../../app/services/youtubeApi'
import { GooglePhotosService } from '../../../../app/services/googlePhotosApi'
import path from 'path'
import { rateLimit } from '../../../utils/rateLimit'

import { convertAudioToVideo, convertAudioToWaveformVideo, generateSimpleAudioThumbnail } from '../../../../app/utils/ffmpegWrapper'

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video uploads

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, { maxRequests: 30, windowMs: 60 * 1000 })
  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const originalFilename = videoFile.name
    const sanitizedFilename = path.basename(originalFilename)
    const googlePhotosMediaId = formData.get('googlePhotosMediaId') as string || null
    const googlePhotosBaseUrl = formData.get('googlePhotosBaseUrl') as string || null
    const mediaType = videoFile.type.startsWith('audio/') ? 'audio' : 'video'
    const title = formData.get('title') as string
    const descriptionFromForm = formData.get('description') as string
    const tagsFromForm = formData.get('tags') as string
    const categoryFromForm = formData.get('category') as string
    const privacyStatus = formData.get('privacyStatus') as string || 'unlisted'
    const playlistId = formData.get('playlistId') as string
    const position = formData.get('position') as string
    const uploadMode = formData.get('uploadMode') as string || 'playlist'
    const folderStructure = formData.get('folderStructure') as string || ''
    const thumbnailFile = formData.get('thumbnail') as File | null

    // Advanced settings
    const madeForKids = formData.get('madeForKids') === 'true'
    let category = categoryFromForm || '27'
    // YouTube Shorts detection
    const isShort = formData.get('isShort') === 'true'
    const duration = parseFloat(formData.get('duration') as string || '0')
    const aspectRatio = parseFloat(formData.get('aspectRatio') as string || '1.78')

    console.log('Upload request data:', {
      fileName: originalFilename,
      sanitizedFileName: sanitizedFilename,
      title,
      folderStructure,
      sessionExists: !!session,
      accessTokenExists: !!session?.accessToken
    })

    if (!videoFile || !title) {
      return NextResponse.json({ error: 'Missing video file or title' }, { status: 400 })
    }

    // Create YouTube API client
    const youtubeApi = new YouTubeApiService(session.accessToken as string)

    // Use provided metadata from frontend, or generate title from filename
    const finalTitle = title
    const description = descriptionFromForm || ''
    let tags: string[] = []
    try {
      tags = tagsFromForm ? JSON.parse(tagsFromForm) : []
    } catch {
      tags = []
    }
    let finalCategory = category

    // Optimize for YouTube Shorts
    if (isShort && duration <= 60 && aspectRatio <= 1.0) {
      tags = [...tags, 'shorts', 'short', 'vertical', 'mobile'].slice(0, 10)
      if (finalCategory === '27') {
        finalCategory = '24'
      }
    }

    console.log('Final metadata for upload:', {
      title: finalTitle,
      descriptionLength: description.length,
      tagsCount: tags.length,
      category: finalCategory,
      mediaType
    })

    // Google Photos import: download from Google, stream to YouTube
    if (googlePhotosMediaId && googlePhotosBaseUrl) {
      console.log('Downloading video from Google Photos:', googlePhotosMediaId)
      const photosService = new GooglePhotosService(session.accessToken as string)

      try {
        const videoBuffer = await photosService.downloadMedia(googlePhotosBaseUrl)
        const videoStream = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(videoBuffer))
            controller.close()
          },
        })

        const uploadMetadata = {
          title: finalTitle,
          description: description,
          tags: tags,
          categoryId: finalCategory,
          privacyStatus: privacyStatus as 'private' | 'public' | 'unlisted',
          madeForKids,
          isShort: isShort && duration <= 60 && aspectRatio <= 1.0,
        }

        const uploadResponse = await youtubeApi.uploadVideoStream(
          videoStream,
          videoBuffer.length,
          'video/*',
          uploadMetadata
        )

        const videoId = uploadResponse.videoId

        if (uploadMode === 'playlist' && playlistId && videoId) {
          try {
            const positionNum = position?.trim() ? parseInt(position, 10) : undefined
            await youtubeApi.addVideoToPlaylist(
              videoId,
              playlistId,
              Number.isNaN(positionNum) ? undefined : positionNum
            )
            console.log(`Video ${videoId} added to playlist ${playlistId}`)
          } catch (playlistError) {
            console.error('Error adding video to playlist:', playlistError)
          }
        }

        return NextResponse.json({
          success: true,
          videoId: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        })
      } catch (error) {
        throw error
      }
    }

    let uploadBuffer: Buffer
    let uploadFilename = sanitizedFilename

    // Handle audio files: convert to animated waveform video
    if (mediaType === 'audio') {
      console.log('Processing audio file, generating animated waveform video...')

      const audioBuffer = Buffer.from(await videoFile.arrayBuffer())

      try {
        uploadBuffer = await convertAudioToWaveformVideo(
          audioBuffer,
          videoFile.name,
          {
            width: 1280,
            height: 720,
            waveformColor: '0xff3333',
            backgroundColor: '0x0f0f0f',
            waveMode: 'cline',
            fps: 25,
            showMetadata: true,
            metadata: {
              title: finalTitle
            },
            textColor: '0xffffff',
            fontSize: 36
          }
        )
        uploadFilename = uploadFilename.replace(/\.[^/.]+$/, '') + '.mp4'
        console.log('Animated waveform video generated successfully:', uploadFilename)
      } catch (waveformError) {
        console.warn('Waveform video generation failed, falling back to static thumbnail:', waveformError)

        let thumbnailBuffer: Buffer
        if (thumbnailFile) {
          thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer())
        } else {
          thumbnailBuffer = await generateSimpleAudioThumbnail(
            finalTitle,
            undefined,
            duration || undefined,
            1280,
            720
          )
        }

        try {
          uploadBuffer = await convertAudioToVideo(
            audioBuffer,
            thumbnailBuffer,
            videoFile.name,
            thumbnailFile ? thumbnailFile.name : 'thumbnail.ppm',
            {
              duration: duration || 10,
              title: finalTitle
            }
          )
          uploadFilename = uploadFilename.replace(/\.[^/.]+$/, '') + '.mp4'
          console.log('Fallback static video generated:', uploadFilename)
        } catch (conversionError) {
          console.error('Audio to video conversion failed:', conversionError)
          throw new Error(`Failed to convert audio to video: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`)
        }
      }
    } else {
      // Video files are now uploaded client-side via /api/youtube/initiate-upload
      return NextResponse.json({
        error: 'Video files should use the client-side resumable upload flow',
        details: 'POST to /api/youtube/initiate-upload to get a resumable URL, then PUT chunks directly to YouTube.'
      }, { status: 400 })
    }

    // Audio path — upload converted buffer
    const buffer = uploadBuffer

    try {
      console.log('Preparing YouTube upload for audio:', {
        title: finalTitle,
        descriptionLength: description?.length,
        tagsCount: tags?.length,
        category: finalCategory,
        privacy: privacyStatus,
        madeForKids
      })

      const uploadResponse = await youtubeApi.uploadVideo(
        buffer,
        uploadFilename,
        {
          title: finalTitle,
          description: description,
          tags: tags,
          categoryId: finalCategory,
          privacyStatus: privacyStatus as 'private' | 'public' | 'unlisted',
          madeForKids,
          isShort: isShort && duration <= 60 && aspectRatio <= 1.0
        }
      )

      const videoId = uploadResponse.videoId

      if (uploadMode === 'playlist' && playlistId && videoId) {
        try {
          const positionNum = position?.trim() ? parseInt(position, 10) : undefined
          await youtubeApi.addVideoToPlaylist(
            videoId,
            playlistId,
            Number.isNaN(positionNum) ? undefined : positionNum
          )
          console.log(`Video ${videoId} added to playlist ${playlistId}`)
        } catch (playlistError) {
          console.error('Error adding video to playlist:', playlistError)
        }
      }

      return NextResponse.json({
        success: true,
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      })

    } catch (error) {
      throw error
    }

  } catch (error) {
    const err = error as Error & { code?: number; response?: { status?: number; data?: unknown } }
    console.error('Upload error:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      responseStatus: err.response?.status,
    })

    let errorMessage = 'Upload failed'
    let errorDetails = 'Unknown error'

    if (error instanceof Error) {
      errorDetails = error.message

      const isAuthError = error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')
      let isQuotaError = error.message.includes('quotaExceeded') || error.message.includes('quota')
      const isForbiddenError = error.message.includes('forbidden')

      const err = error as { code?: number; errors?: Array<{ reason?: string; message?: string }> }
      if (!isQuotaError && err.code === 403) {
        if (err.errors && Array.isArray(err.errors)) {
          const firstErr = err.errors[0]
          if (firstErr.reason === 'quotaExceeded' || firstErr.message?.includes('quota')) {
            isQuotaError = true
          }
        }
      }

      if ('response' in error) {
        const responseData = (error as {
          response?: { data?: { error?: { code?: number; message?: string; errors?: Array<{ reason?: string; message?: string }> } } }
        }).response?.data
        console.error('YouTube API response:', responseData)

        if (responseData?.error && !isQuotaError) {
          const apiError = responseData.error
          if (apiError.code === 403 && apiError.message?.includes('quota')) {
            isQuotaError = true
          }
          if (apiError.errors && Array.isArray(apiError.errors)) {
            const firstError = apiError.errors[0]
            if (firstError.reason === 'quotaExceeded' || firstError.message?.includes('quota')) {
              isQuotaError = true
            }
          }
        }
      }

      if (isAuthError) {
        errorMessage = 'Authentication failed'
        errorDetails = 'Your YouTube access token has expired. Please sign out and sign in again.'
      } else if (isQuotaError) {
        errorMessage = 'Quota exceeded'
        errorDetails = 'YouTube API quota exceeded. Please try again later.'
      } else if (isForbiddenError) {
        errorMessage = 'Permission denied'
        errorDetails = 'Insufficient permissions to upload videos. Please check your YouTube account permissions.'
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}
