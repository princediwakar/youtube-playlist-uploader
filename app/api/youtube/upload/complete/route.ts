import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { YouTubeApiService } from '../../../../../app/services/youtubeApi'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { videoId, playlistId, position } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    const youtubeApi = new YouTubeApiService(session.accessToken as string)

    if (playlistId) {
      try {
        await youtubeApi.addVideoToPlaylist(
          videoId,
          playlistId,
          position !== undefined ? position : undefined
        )
        console.log(`Video ${videoId} added to playlist ${playlistId}`)
      } catch (error) {
        console.error('Error adding video to playlist:', error)
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    })
  } catch (error) {
    console.error('complete error:', error)
    return NextResponse.json(
      { error: 'Failed to complete upload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
