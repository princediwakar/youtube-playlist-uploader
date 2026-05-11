'use server'

import { auth } from '@/lib/auth'
import { YouTubeApiService } from '@/app/services/youtubeApi'
import { google } from 'googleapis'

export interface PlaylistItem {
  id: string
  snippet: {
    title: string
    description?: string
    publishedAt: string
    thumbnails?: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
  contentDetails: {
    itemCount: number
  }
}

export interface CreatePlaylistResult {
  success: true
  playlistId: string
  url: string
}

export interface GetPlaylistsResult {
  success: true
  playlists: PlaylistItem[]
  isMockData?: boolean
}

export interface GetPlaylistVideosResult {
  success: true
  videos: Array<{ videoId: string; title: string; position: number }>
}

export async function createPlaylist(
  title: string,
  description: string,
  privacyStatus: 'private' | 'public' | 'unlisted' = 'private'
): Promise<CreatePlaylistResult> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const youtubeApi = new YouTubeApiService(session.accessToken as string)
  const playlistId = await youtubeApi.createPlaylist(title, description, privacyStatus)

  return {
    success: true,
    playlistId,
    url: `https://www.youtube.com/playlist?list=${playlistId}`
  }
}

export async function getPlaylists(): Promise<GetPlaylistsResult> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const youtubeApi = new YouTubeApiService(session.accessToken as string)
  const playlists = await youtubeApi.getPlaylists(25)

  return {
    success: true,
    playlists
  }
}

export async function getPlaylistVideos(playlistId: string): Promise<GetPlaylistVideosResult> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: session.accessToken as string
  })

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

  const videos: Array<{ videoId: string; title: string; position: number }> = []
  let nextPageToken: string | undefined = undefined
  let pageCount = 0
  const MAX_PAGES = 200

  do {
    pageCount++
    if (pageCount > MAX_PAGES) {
      console.warn('Reached max page limit, stopping pagination')
      break
    }

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
  } while (nextPageToken)

  return {
    success: true,
    videos
  }
}

export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string,
  position?: number
): Promise<{ success: true; videoId: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const youtubeApi = new YouTubeApiService(session.accessToken as string)
  await youtubeApi.addVideoToPlaylist(videoId, playlistId, position)

  return { success: true, videoId }
}

export async function updatePlaylist(
  playlistId: string,
  title: string,
  description: string,
  privacyStatus: 'private' | 'public' | 'unlisted'
): Promise<{ success: true; playlist: { id: string; snippet: { title: string; description: string } } }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const youtubeApi = new YouTubeApiService(session.accessToken as string)
  const updatedPlaylist = await youtubeApi.updatePlaylist(playlistId, title, description, privacyStatus)

  return {
    success: true,
    playlist: updatedPlaylist
  }
}

export async function deletePlaylist(playlistId: string): Promise<{ success: true; message: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const youtubeApi = new YouTubeApiService(session.accessToken as string)
  await youtubeApi.deletePlaylist(playlistId)

  return {
    success: true,
    message: 'Playlist deleted successfully'
  }
}

export async function completeUpload(
  videoId: string,
  playlistId?: string,
  position?: number
): Promise<{ success: true; videoId: string; url: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  if (playlistId) {
    const youtubeApi = new YouTubeApiService(session.accessToken as string)
    await youtubeApi.addVideoToPlaylist(videoId, playlistId, position)
  }

  return {
    success: true,
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`
  }
}