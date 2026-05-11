'use server'

import { auth } from '@/lib/auth'
import { GooglePhotosService, PickedMediaItem } from '@/app/services/googlePhotosApi'

export async function createPhotosSession(): Promise<{ sessionId: string; pickerUri: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const photosService = new GooglePhotosService(session.accessToken as string)
  const { sessionId, pickerUri } = await photosService.createSession()

  return { sessionId, pickerUri }
}

export async function pollPhotosSession(sessionId: string): Promise<{
  ready: boolean
  fetchedAt?: string
  mediaItems?: PickedMediaItem[]
  pollInterval?: string
}> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const photosService = new GooglePhotosService(session.accessToken as string)

  const sessionData = await photosService.getSession(sessionId)

  if (!sessionData.mediaItemsSet) {
    return {
      ready: false,
      fetchedAt: new Date().toISOString(),
    }
  }

  const fetchedAt = new Date().toISOString()

  const allItems: PickedMediaItem[] = []
  let pageToken: string | undefined
  do {
    const page = await photosService.listPickedMediaItems(sessionId, pageToken)
    allItems.push(...page.mediaItems)
    pageToken = page.nextPageToken
  } while (pageToken)

  return {
    ready: true,
    fetchedAt,
    mediaItems: allItems,
  }
}

export async function refreshGooglePhotosUrl(mediaId: string): Promise<{ baseUrl: string; fetchedAt: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  const photosService = new GooglePhotosService(session.accessToken as string)
  const baseUrl = await photosService.getMediaUrl(mediaId)

  return {
    baseUrl,
    fetchedAt: new Date().toISOString(),
  }
}
