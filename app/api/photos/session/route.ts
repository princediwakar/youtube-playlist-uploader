import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { GooglePhotosService, GooglePhotosApiError, PickedMediaItem } from '../../../../app/services/googlePhotosApi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const photosService = new GooglePhotosService(session.accessToken as string)

  try {
    const sessionData = await photosService.getSession(sessionId)

    if (!sessionData.mediaItemsSet) {
      return NextResponse.json({
        ready: false,
        pollInterval: sessionData.pollInterval,
      })
    }

    const allItems: PickedMediaItem[] = []
    let pageToken: string | undefined
    do {
      const page = await photosService.listPickedMediaItems(sessionId, pageToken)
      allItems.push(...page.mediaItems)
      pageToken = page.nextPageToken
    } while (pageToken)

    return NextResponse.json({ ready: true, mediaItems: allItems })
  } catch (error: unknown) {
    if (error instanceof GooglePhotosApiError) {
      if (error.code === 403 || error.code === 401) {
        return NextResponse.json(
          { error: 'Photos permission required', needsReauth: true },
          { status: 403 }
        )
      }
    }
    throw error
  }
}
