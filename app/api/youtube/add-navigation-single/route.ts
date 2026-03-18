import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { google } from 'googleapis'

interface SingleVideoInfo {
  videoId: string
  title: string
  playlistId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { videoId, title, playlistId } = await request.json() as SingleVideoInfo
    
    if (!videoId || !title) {
      return NextResponse.json({ error: 'videoId and title are required' }, { status: 400 })
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: session.accessToken as string
    })

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    // Get current video details to build navigation context
    const videoResponse = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId]
    })

    if (!videoResponse.data.items?.[0]) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const videoData = videoResponse.data.items[0]
    const videoTitle = videoData.snippet?.title || title || 'Untitled'
    const originalDescription = videoData.snippet?.description || ''

    // Generate a simple navigation section for single video
    let navigationLinks = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    navigationLinks += '🎬 VIDEO INFO\n'
    navigationLinks += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
    navigationLinks += `📍 ${videoTitle}\n\n`

    // Add playlist link if available
    if (playlistId) {
      navigationLinks += `📋 View Playlist:\n`
      navigationLinks += `   https://www.youtube.com/playlist?list=${playlistId}\n\n`
    }

    navigationLinks += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'

    // Add navigation links to description
    const updatedDescription = addNavigationToDescription(originalDescription, navigationLinks)

    // Update video description
    await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          ...videoData.snippet,
          description: updatedDescription
        }
      }
    })

    console.log(`Added navigation links to video: ${title}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Navigation link error:', error)
    return NextResponse.json({ 
      error: 'Failed to add navigation links' 
    }, { status: 500 })
  }
}

function addNavigationToDescription(originalDescription: string, navigationLinks: string): string {
  // Remove any existing navigation section
  const existingNavStart = originalDescription.indexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (existingNavStart !== -1) {
    const existingNavEnd = originalDescription.lastIndexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (existingNavEnd > existingNavStart) {
      originalDescription = originalDescription.slice(0, existingNavStart).trim()
    }
  }
  
  // Add navigation links at the end
  return originalDescription + navigationLinks
}
