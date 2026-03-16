import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent } from '../../../../lib/deepseek'


export async function POST(request: NextRequest) {
  try {
    const { folderName, fileNames, relativePaths } = await request.json()
    
    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json({ error: 'File names are required' }, { status: 400 })
    }
    
    // Use DeepSeek AI for category analysis
    try {
      const aiAnalysis = await analyzeContent(
        folderName || '',
        fileNames,
        fileNames[0] || '',
        relativePaths?.join(' ') || ''
      )
      
      return NextResponse.json({ 
        suggestedCategory: aiAnalysis.category,
        success: true 
      })
    } catch (aiError) {
      console.error('DeepSeek analysis failed:', aiError)
      throw aiError
    }
    
  } catch (error) {
    console.error('Category suggestion error:', error)
    return NextResponse.json({
      error: 'Failed to suggest category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}