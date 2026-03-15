import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { YouTubeApiService } from '@/app/services/youtubeApi'

export async function POST(request: NextRequest) {
  try {
    console.log('Playlist creation started')
    const session = await getServerSession(authOptions)
    
    console.log('Session check:', {
      sessionExists: !!session,
      accessTokenExists: !!session?.accessToken,
      accessTokenLength: session?.accessToken?.length,
      sessionError: session?.error
    })
    
    if (!session?.accessToken) {
      console.log('No access token available')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (session?.error) {
      console.log('Session has error:', session.error)
      return NextResponse.json({ error: 'Authentication expired', details: session.error }, { status: 401 })
    }

    const { title, description, privacyStatus } = await request.json()
    console.log('Request data:', { title, description, privacyStatus })

    if (!title) {
      return NextResponse.json({ error: 'Playlist title is required' }, { status: 400 })
    }

    console.log('Creating YouTube API client...')
    const youtubeApi = new YouTubeApiService(session.accessToken as string)

    console.log('Attempting to create playlist...')
    // Create playlist
    const playlistId = await youtubeApi.createPlaylist(
      title,
      description || `Playlist created with Universal YouTube Uploader\n\n🎯 Organized collection of videos for optimal learning experience.\n\n#Playlist #Education #Learning`,
      (privacyStatus || 'unlisted') as 'private' | 'public' | 'unlisted'
    )

    return NextResponse.json({
      success: true,
      playlistId: playlistId,
      url: `https://www.youtube.com/playlist?list=${playlistId}`
    })

  } catch (error) {
    console.error('Playlist creation error:', error)
    
    let errorMessage = 'Failed to create playlist'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      console.error('Error message:', error.message)
      
      // Handle specific YouTube API errors
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed'
        errorDetails = 'Your YouTube access token has expired. Please sign out and sign in again.'
      } else if (error.message.includes('quotaExceeded')) {
        errorMessage = 'Quota exceeded'
        errorDetails = 'YouTube API quota exceeded. Please try again later.'
      } else if (error.message.includes('forbidden')) {
        errorMessage = 'Permission denied'
        errorDetails = 'Insufficient permissions to create playlists. Please check your YouTube account permissions.'
      }
      
      // Log additional error details if available
      if ('response' in error) {
        console.error('YouTube API response:', (error as any).response?.data)
        console.error('Response status:', (error as any).response?.status)
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails 
    }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const youtubeApi = new YouTubeApiService(session.accessToken as string)

    // Get user's playlists
    const playlists = await youtubeApi.getPlaylists(25)

    console.log('Playlist API response:', {
      totalResults: playlists.length,
      resultsPerPage: 25,
      itemsCount: playlists.length,
      items: playlists.map(p => ({ id: p.id, title: p.snippet?.title }))
    })

    return NextResponse.json({
      success: true,
      playlists: playlists
    })

  } catch (error) {
    console.error('Get playlists error:', error)
    
    let errorMessage = 'Failed to get playlists'
    let errorDetails = 'Unknown error'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorDetails = error.message
      console.error('Error message:', error.message)
      
      // Handle specific YouTube API errors
      if (error.message.includes('quotaExceeded') || error.message.includes('quota')) {
        errorMessage = 'YouTube API quota exceeded'
        errorDetails = 'You have exceeded your daily YouTube API quota. Please try again tomorrow or request a quota increase.'
        statusCode = 429 // Too Many Requests
        
        // In development mode, return mock data when quota is exceeded
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Returning mock playlist data due to quota exceeded')
          return NextResponse.json({
            success: true,
            playlists: [
              {
                id: 'mock-playlist-1',
                snippet: {
                  title: 'Mock Playlist 1',
                  description: 'This is a mock playlist for development',
                  publishedAt: new Date().toISOString(),
                  thumbnails: {
                    default: { url: 'https://via.placeholder.com/120x90' }
                  }
                },
                contentDetails: {
                  itemCount: 5
                }
              },
              {
                id: 'mock-playlist-2',
                snippet: {
                  title: 'Mock Playlist 2',
                  description: 'Another mock playlist for development',
                  publishedAt: new Date().toISOString(),
                  thumbnails: {
                    default: { url: 'https://via.placeholder.com/120x90' }
                  }
                },
                contentDetails: {
                  itemCount: 3
                }
              }
            ],
            isMockData: true
          })
        }
      } else if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed'
        errorDetails = 'Your YouTube access token has expired. Please sign out and sign in again.'
        statusCode = 401
      } else if (error.message.includes('forbidden')) {
        errorMessage = 'Permission denied'
        errorDetails = 'Insufficient permissions to access playlists. Please check your YouTube account permissions.'
        statusCode = 403
      }
      
      // Log additional error details if available
      if ('response' in error) {
        const response = (error as any).response
        console.error('YouTube API response:', response?.data)
        console.error('Response status:', response?.status)
        
        // Check for quota errors in response data
        if (response?.data?.error?.errors) {
          const apiErrors = response.data.error.errors
          for (const apiError of apiErrors) {
            if (apiError.reason === 'quotaExceeded') {
              errorMessage = 'YouTube API quota exceeded'
              errorDetails = 'You have exceeded your daily YouTube API quota. Please try again tomorrow or request a quota increase.'
              statusCode = 429
              
              // In development mode, return mock data when quota is exceeded
              if (process.env.NODE_ENV === 'development') {
                console.log('Development mode: Returning mock playlist data due to quota exceeded')
                return NextResponse.json({
                  success: true,
                  playlists: [
                    {
                      id: 'mock-playlist-1',
                      snippet: {
                        title: 'Mock Playlist 1',
                        description: 'This is a mock playlist for development',
                        publishedAt: new Date().toISOString(),
                        thumbnails: {
                          default: { url: 'https://via.placeholder.com/120x90' }
                        }
                      },
                      contentDetails: {
                        itemCount: 5
                      }
                    },
                    {
                      id: 'mock-playlist-2',
                      snippet: {
                        title: 'Mock Playlist 2',
                        description: 'Another mock playlist for development',
                        publishedAt: new Date().toISOString(),
                        thumbnails: {
                          default: { url: 'https://via.placeholder.com/120x90' }
                        }
                      },
                      contentDetails: {
                        itemCount: 3
                      }
                    }
                  ],
                  isMockData: true
                })
              }
              break
            }
          }
        }
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails 
    }, { status: statusCode })
  }
}