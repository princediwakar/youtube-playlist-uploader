import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { YouTubeApiService } from '../../../../app/services/youtubeApi'
import { analyzeContent } from '../../../../app/services/aiService'
import {
  generateTitle,
  generateFallbackDescription,
  generateBasicTags,
  detectCategoryFromContent,
  cleanAIGeneratedTitle,
  generateShortsDescription
} from '../../../../app/utils/videoHelpers'

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
    const title = formData.get('title') as string
    const contentType = formData.get('contentType') as string || 'auto'
    const privacyStatus = formData.get('privacyStatus') as string || 'unlisted'
    const playlistId = formData.get('playlistId') as string
    const position = formData.get('position') as string
    const uploadMode = formData.get('uploadMode') as string || 'playlist'
    const relativePath = formData.get('relativePath') as string || ''
    const folderStructure = formData.get('folderStructure') as string || ''
    const allFileNames = formData.get('allFileNames') as string || '[]'
    const folderName = formData.get('folderName') as string || ''
    
    // Advanced settings
    const madeForKids = formData.get('madeForKids') === 'true'
    const category = formData.get('category') as string || '27'
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
      fileName: videoFile?.name,
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
      allFiles = [videoFile.name]
    }
    
    // AI Analysis Phase (blocking during upload)
    let finalTitle: string
    let description: string
    let tags: string[]
    let finalCategory = category
    
    if (useAiAnalysis) {
      console.log('🤖 Starting AI analysis for:', videoFile.name)
      try {
        const aiAnalysis = await analyzeContent(
          folderName,
          allFiles,
          videoFile.name,
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
          finalTitle = cleanAIGeneratedTitle(aiAnalysis.videoTitle, videoFile.name)
        } else {
          finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
        }
        
        description = aiAnalysis.videoDescription
        tags = aiAnalysis.tags
        finalCategory = aiAnalysis.category
        
      } catch (aiError) {
        console.error('AI analysis failed, using fallback:', aiError)
        // Fallback to basic metadata if AI fails
        finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
        description = generateFallbackDescription(videoFile.name, folderName, relativePath)
        tags = generateBasicTags(videoFile.name, folderName)
        finalCategory = detectCategoryFromContent(folderName, allFiles, relativePath)
      }
    } else {
      // No AI analysis - use basic metadata
      finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
      description = generateFallbackDescription(videoFile.name, folderName, relativePath)
      tags = generateBasicTags(videoFile.name, folderName)
      
      // Quick category detection (non-AI) if still default
      if (category === '27') {
        finalCategory = detectCategoryFromContent(folderName, allFiles, relativePath)
      }
    }
    
    // Optimize for YouTube Shorts
    if (isShort && duration <= 60 && aspectRatio <= 1.0) {
      description = generateShortsDescription(videoFile.name, description)
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
      aiAnalysisUsed: useAiAnalysis
    })

    // Convert File to buffer for upload
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

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
        videoFile.name,
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
          await youtubeApi.addVideoToPlaylist(
            videoId,
            playlistId,
            position ? parseInt(position) : undefined
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

