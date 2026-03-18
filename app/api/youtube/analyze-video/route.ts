import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { analyzeContent } from '../../../../lib/deepseek'
import { generateTitle, cleanAIGeneratedTitle } from '../../../utils/videoHelpers'

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
