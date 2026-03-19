import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('playlistId')

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
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

    const videos: Array<{videoId: string, title: string, position: number}> = []
    let nextPageToken: string | undefined = undefined
    let pageCount = 0
    const MAX_PAGES = 200 // Safety limit to prevent infinite loops

    do {
      pageCount++
      if (pageCount > MAX_PAGES) {
        console.warn('Reached max page limit, stopping pagination')
        break
      }

      try {
        const response = await youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken
        })

        const items = response.data.items?.map(item => ({
          videoId: item.contentDetails?.videoId,
          title: item.snippet?.title,
          position: item.snippet?.position
        })) || []

        videos.push(...items)
        nextPageToken = response.data.nextPageToken
      } catch (pageError) {
        console.error('Error fetching page', pageCount, ':', pageError)
        break // Stop pagination on error but return what we have
      }
    } while (nextPageToken)

    return NextResponse.json({
      success: true,
      videos: videos
    })

  } catch (error) {
    console.error('Get playlist videos error:', error)

    let errorMessage = 'Failed to get playlist videos'

    if (error instanceof Error) {
      // Handle specific YouTube API errors
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed'
      } else if (error.message.includes('quotaExceeded')) {
        errorMessage = 'Quota exceeded'
      } else if (error.message.includes('forbidden')) {
        errorMessage = 'Permission denied'
      } else if (error.message.includes('notFound')) {
        errorMessage = 'Playlist not found'
      }
    }

    return NextResponse.json({
      error: errorMessage
    }, { status: 500 })
  }
}
