'use server'

import { auth } from '@/lib/auth'
import { google } from 'googleapis'

interface VideoInfo {
  videoId: string
  title: string
  index: number
}

export async function addNavigationLinks(
  videos: VideoInfo[],
  playlistId: string
): Promise<{ success: true }> {
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

  for (let i = 0; i < videos.length; i++) {
    const currentVideo = videos[i]

    try {
      const videoResponse = await youtube.videos.list({
        part: ['snippet'],
        id: [currentVideo.videoId]
      })

      if (!videoResponse.data.items?.[0]) {
        console.error(`Video ${currentVideo.videoId} not found`)
        continue
      }

      const currentVideoData = videoResponse.data.items[0]
      const originalDescription = currentVideoData.snippet?.description || ''

      const navigationLinks = generateNavigationLinks(videos, i, playlistId)
      const updatedDescription = addNavigationToDescription(originalDescription, navigationLinks)

      await youtube.videos.update({
        part: ['snippet'],
        requestBody: {
          id: currentVideo.videoId,
          snippet: {
            ...currentVideoData.snippet,
            description: updatedDescription
          }
        }
      })

      console.log(`Added navigation links to video: ${currentVideo.title}`)
    } catch (error) {
      console.error(`Failed to add navigation links to ${currentVideo.title}:`, error)
    }
  }

  return { success: true }
}

export async function addNavigationLinksSingle(
  videoId: string,
  title: string,
  playlistId?: string
): Promise<{ success: true }> {
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

  const videoResponse = await youtube.videos.list({
    part: ['snippet'],
    id: [videoId]
  })

  if (!videoResponse.data.items?.[0]) {
    throw new Error('Video not found')
  }

  const videoData = videoResponse.data.items[0]
  const videoTitle = videoData.snippet?.title || title || 'Untitled'
  const originalDescription = videoData.snippet?.description || ''

  let navigationLinks = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  navigationLinks += '🎬 VIDEO INFO\n'
  navigationLinks += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  navigationLinks += `📍 ${videoTitle}\n\n`

  if (playlistId) {
    navigationLinks += `📋 View Playlist:\n`
    navigationLinks += `   https://www.youtube.com/playlist?list=${playlistId}\n\n`
  }

  navigationLinks += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'

  const updatedDescription = addNavigationToDescription(originalDescription, navigationLinks)

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

  return { success: true }
}

function generateNavigationLinks(videos: VideoInfo[], currentIndex: number, playlistId: string): string {
  const currentVideo = videos[currentIndex]
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null

  let links = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  links += '🎬 PLAYLIST NAVIGATION\n'
  links += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'

  links += `📍 Current: ${currentVideo.title} (${currentIndex + 1}/${videos.length})\n\n`

  if (prevVideo) {
    links += `⬅️ Previous: ${prevVideo.title}\n`
    links += `   https://www.youtube.com/watch?v=${prevVideo.videoId}\n\n`
  }

  if (nextVideo) {
    links += `➡️ Next: ${nextVideo.title}\n`
    links += `   https://www.youtube.com/watch?v=${nextVideo.videoId}\n\n`
  }

  if (playlistId) {
    links += `📋 Complete Playlist (${videos.length} videos):\n`
    links += `   https://www.youtube.com/playlist?list=${playlistId}\n\n`
  }

  links += '🔢 QUICK JUMP TO:\n'
  videos.forEach((video, index) => {
    if (index !== currentIndex) {
      const prefix = index < currentIndex ? '✅' : '📹'
      links += `${prefix} ${index + 1}. ${video.title}: https://youtu.be/${video.videoId}\n`
    }
  })

  links += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'

  return links
}

function addNavigationToDescription(originalDescription: string, navigationLinks: string): string {
  const existingNavStart = originalDescription.indexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (existingNavStart !== -1) {
    const existingNavEnd = originalDescription.lastIndexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (existingNavEnd > existingNavStart) {
      originalDescription = originalDescription.slice(0, existingNavStart).trim()
    }
  }

  return originalDescription + navigationLinks
}