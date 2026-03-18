// app/api/youtube/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { YouTubeApiService } from '../../../../app/services/youtubeApi'
import { analyzeContent } from '../../../../app/services/aiService'
import path from 'path'
import {
  generateTitle,
  cleanAIGeneratedTitle
} from '../../../../app/utils/videoHelpers'
import { convertAudioToVideo, convertAudioToWaveformVideo, generateSimpleAudioThumbnail } from '../../../../app/utils/ffmpegWrapper'

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video uploads

interface UploadData {
  title: string
  description: string
  contentType: string
  privacyStatus: string
  playlistId?: string
  position?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const originalFilename = videoFile.name
    const sanitizedFilename = path.basename(originalFilename)
    const mediaType = videoFile.type.startsWith('audio/') ? 'audio' : 'video'
    const title = formData.get('title') as string
    const descriptionFromForm = formData.get('description') as string
    const tagsFromForm = formData.get('tags') as string
    const categoryFromForm = formData.get('category') as string
    const contentType = formData.get('contentType') as string || 'auto'
    const privacyStatus = formData.get('privacyStatus') as string || 'unlisted'
    const playlistId = formData.get('playlistId') as string
    const position = formData.get('position') as string
    const uploadMode = formData.get('uploadMode') as string || 'playlist'
    const relativePath = formData.get('relativePath') as string || ''
    const folderStructure = formData.get('folderStructure') as string || ''
    const allFileNames = formData.get('allFileNames') as string || '[]'
    const folderName = formData.get('folderName') as string || ''
    const thumbnailFile = formData.get('thumbnail') as File | null
    
    // Advanced settings
    const madeForKids = formData.get('madeForKids') === 'true'
    let category = categoryFromForm || '27'
    const useAiAnalysis = formData.get('useAiAnalysis') === 'true'
    const titleFormat = formData.get('titleFormat') as string || 'original'
    const customTitlePrefix = formData.get('customTitlePrefix') as string || ''
    const customTitleSuffix = formData.get('customTitleSuffix') as string || ''
    const addPlaylistNavigation = formData.get('addPlaylistNavigation') === 'true'
    
    // YouTube Shorts detection
    const isShort = formData.get('isShort') === 'true'
    const duration = parseFloat(formData.get('duration') as string || '0')
    const aspectRatio = parseFloat(formData.get('aspectRatio') as string || '1.78')

    console.log('Upload request data:', {
      fileName: originalFilename,
      sanitizedFileName: sanitizedFilename,
      title,
      relativePath,
      folderStructure,
      useAiAnalysis,
      sessionExists: !!session,
      accessTokenExists: !!session?.accessToken
    })

    if (!videoFile || !title) {
      return NextResponse.json({ error: 'Missing video file or title' }, { status: 400 })
    }

    // Create YouTube API client
    const youtubeApi = new YouTubeApiService(session.accessToken as string)

    // Title will be generated in the AI analysis section
    
    // Parse all file names for AI analysis
    let allFiles: string[] = []
    try {
      allFiles = JSON.parse(allFileNames)
    } catch {
      allFiles = [sanitizedFilename]
    }
    // Sanitize all filenames (remove path components)
    allFiles = allFiles.map(file => path.basename(file))
    
    // AI Analysis Phase (blocking during upload)
    // Use pre-processed metadata from frontend if available, otherwise use AI
    let finalTitle: string
    let description: string
    let tags: string[]
    let finalCategory = category
    
    const hasPreProcessedMetadata = title && descriptionFromForm && tagsFromForm
    
    if (hasPreProcessedMetadata) {
      // Use pre-processed metadata from frontend (no AI analysis needed)
      // This takes precedence regardless of useAiAnalysis flag - frontend already did the work
      finalTitle = title
      description = descriptionFromForm
      try {
        tags = JSON.parse(tagsFromForm)
      } catch {
        tags = []
      }
      console.log('Using pre-processed metadata from frontend:', {
        title: finalTitle,
        descriptionLength: description.length,
        tagsCount: tags.length,
        category: finalCategory
      })
    } else if (title) {
      // Title provided but description/tags missing - use title, generate basic description/tags
      finalTitle = title
      description = descriptionFromForm || `Uploaded via YouTube Playlist Uploader`
      try {
        tags = tagsFromForm ? JSON.parse(tagsFromForm) : []
      } catch {
        tags = []
      }
      console.log('Using provided title, generated basic description/tags:', {
        title: finalTitle,
        descriptionLength: description.length,
        tagsCount: tags.length
      })
    } else {
      // AI analysis needed - either no pre-processed metadata or AI explicitly requested
      console.log('🤖 Starting AI analysis for:', sanitizedFilename)
    try {
      const aiAnalysis = await analyzeContent(
        folderName,
        allFiles,
        sanitizedFilename,
        relativePath
      )

      console.log('✅ AI analysis completed:', {
        title: aiAnalysis.videoTitle,
        descriptionLength: aiAnalysis.videoDescription.length,
        tagsCount: aiAnalysis.tags.length,
        category: aiAnalysis.category
      })

      // Use AI-generated title based on format preference
      if (titleFormat === 'original') {
        finalTitle = cleanAIGeneratedTitle(aiAnalysis.videoTitle, sanitizedFilename)
      } else {
        finalTitle = generateTitle(sanitizedFilename, titleFormat, customTitlePrefix, customTitleSuffix)
      }

      description = aiAnalysis.videoDescription
      tags = aiAnalysis.tags
      finalCategory = aiAnalysis.category

    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      throw new Error(`AI analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`)
      }
    }
    
    // Optimize for YouTube Shorts
    if (isShort && duration <= 60 && aspectRatio <= 1.0) {
      tags = [...tags, 'shorts', 'short', 'vertical', 'mobile'].slice(0, 10)
      // Use Entertainment category for Shorts unless user explicitly chose a different category
      if (finalCategory === '27') {
        finalCategory = '24' // Entertainment category works well for Shorts
      }
    }
    
    console.log('Final metadata for upload:', {
      title: finalTitle,
      descriptionLength: description.length,
      tagsCount: tags.length,
      category: finalCategory,
      aiAnalysisUsed: useAiAnalysis,
      mediaType
    })

    let uploadBuffer: Buffer
    let uploadFilename = sanitizedFilename

    // Handle audio files: convert to animated waveform video
    if (mediaType === 'audio') {
      console.log('Processing audio file, generating animated waveform video...')

      const audioBuffer = Buffer.from(await videoFile.arrayBuffer())

      try {
        // Primary: Generate animated waveform video using showwaves filter
        uploadBuffer = await convertAudioToWaveformVideo(
          audioBuffer,
          videoFile.name,
          {
            width: 1280,
            height: 720,
            waveformColor: '0xff3333',     // Softer red
            backgroundColor: '0x0f0f0f',   // Near-black
            waveMode: 'cline',             // Centered line — smooth and professional
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

        // Fallback: Use the old static-image approach
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
      // Video file, use as-is
      uploadBuffer = Buffer.from(await videoFile.arrayBuffer())
    }

    // Convert File to buffer for upload
    const buffer = uploadBuffer

    try {
      console.log('Preparing YouTube upload with:', {
        title: finalTitle,
        descriptionLength: description?.length,
        tagsCount: tags?.length,
        category: finalCategory,
        privacy: privacyStatus,
        madeForKids
      })

      // Upload video to YouTube using service
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

      // Add to playlist if specified (only for playlist mode)
      if (uploadMode === 'playlist' && playlistId && videoId) {
        try {
          const positionNum = position?.trim() ? parseInt(position, 10) : undefined
          await youtubeApi.addVideoToPlaylist(
            videoId,
            playlistId,
            Number.isNaN(positionNum) ? undefined : positionNum
          )
        } catch (playlistError) {
          console.error('Error adding to playlist:', playlistError)
          // Continue even if playlist addition fails
        }
      }

      return NextResponse.json({
        success: true,
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      })

    } catch (error) {
      // Error handling will be caught by outer try-catch
      throw error
    }

  } catch (error) {
    console.error('Upload error:', error)
    
    let errorMessage = 'Upload failed'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // Handle specific YouTube API errors
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed'
        errorDetails = 'Your YouTube access token has expired. Please sign out and sign in again.'
      } else if (error.message.includes('quotaExceeded')) {
        errorMessage = 'Quota exceeded'
        errorDetails = 'YouTube API quota exceeded. Please try again later.'
      } else if (error.message.includes('forbidden')) {
        errorMessage = 'Permission denied'
        errorDetails = 'Insufficient permissions to upload videos. Please check your YouTube account permissions.'
      }
      
      // Log additional error details if available
      if ('response' in error) {
        console.error('YouTube API response:', (error as any).response?.data)
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails 
    }, { status: 500 })
  }
}

