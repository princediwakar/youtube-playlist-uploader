import { NextRequest, NextResponse } from 'next/server'
import { analyzePlaylistContent } from '../../../../lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { folderName, fileNames } = await request.json()
    
    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json({ error: 'File names are required' }, { status: 400 })
    }
    
    const result = await analyzePlaylistContent(folderName || '', fileNames)
    
    return NextResponse.json({ 
      description: result.description,
      theme: result.theme,
      success: true 
    })
    
  } catch (error) {
    console.error('Playlist analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze playlist',
      description: ''
    }, { status: 500 })
  }
}