import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { analyzeContent } from '../../../../lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {
      folderName,
      allFileNames,
      currentFileName,
      relativePath,
      titleFormat,
      customTitlePrefix,
      customTitleSuffix
    } = await request.json()

    console.log('🤖 Starting AI analysis for:', currentFileName)

    try {
      const aiAnalysis = await analyzeContent(
        folderName,
        allFileNames,
        currentFileName,
        relativePath
      )
      
      console.log('✅ AI analysis completed:', {
        title: aiAnalysis.videoTitle,
        descriptionLength: aiAnalysis.videoDescription.length,
        tagsCount: aiAnalysis.tags.length,
        category: aiAnalysis.category
      })
      
      // Generate final title based on format preference
      let finalTitle: string
      if (titleFormat === 'original') {
        finalTitle = cleanAIGeneratedTitle(aiAnalysis.videoTitle, currentFileName)
      } else {
        finalTitle = generateTitle(currentFileName, titleFormat, customTitlePrefix, customTitleSuffix)
      }

      return NextResponse.json({
        success: true,
        title: finalTitle,
        description: aiAnalysis.videoDescription,
        tags: aiAnalysis.tags,
        category: aiAnalysis.category
      })
      
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      return NextResponse.json({
        error: 'AI analysis failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Analyze video error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

function cleanAIGeneratedTitle(aiTitle: string, originalFileName: string): string {
  if (!aiTitle || aiTitle.trim() === '') {
    return generateTitle(originalFileName, 'original', '', '')
  }
  
  let cleaned = aiTitle
    .replace(/^.*[\/\\]/, '') // Remove everything before the last slash/backslash
    .replace(/\.[^/.]+$/, '') // Remove file extensions
    .trim()
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    cleaned = parts[parts.length - 1].trim()
  }
  
  cleaned = cleaned
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 97) + '...'
  }
  
  return cleaned || generateTitle(originalFileName, 'original', '', '')
}

function generateTitle(filename: string, format: string, prefix: string, suffix: string): string {
  let baseTitle = filename.replace(/\.[^/.]+$/, '') // Remove extension
  
  switch (format) {
    case 'original':
      break
    case 'cleaned':
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers
        .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
      break
    case 'custom':
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '')
        .replace(/[\-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      baseTitle = `${prefix}${baseTitle}${suffix}`
      break
  }
  
  let title = baseTitle
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }
  
  return title || 'Untitled Video'
}



