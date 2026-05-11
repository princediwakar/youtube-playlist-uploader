'use server'

import { auth } from '@/lib/auth'

interface InitiateUploadParams {
  title: string
  description?: string
  tags?: string[]
  categoryId?: string
  privacyStatus?: 'private' | 'public' | 'unlisted'
  madeForKids?: boolean
  isShort?: boolean
  fileType?: string
  fileSize?: number
}

export async function initiateResumableUpload(
  metadata: InitiateUploadParams
): Promise<{ uploadUrl: string }> {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  if (!metadata.title) {
    throw new Error('title is required')
  }

  const isShort = metadata.isShort === true

  let tags = metadata.tags || []
  let categoryId = metadata.categoryId || '27'

  if (isShort) {
    tags = [...tags, 'shorts', 'short', 'vertical', 'mobile'].slice(0, 10)
    if (categoryId === '27') {
      categoryId = '24'
    }
  }

  const requestBody = {
    snippet: {
      title: metadata.title,
      description: metadata.description || '',
      tags,
      categoryId,
    },
    status: {
      privacyStatus: metadata.privacyStatus || 'unlisted',
      selfDeclaredMadeForKids: metadata.madeForKids || false,
    },
  }

  const headersList = await import('next/headers').then(m => m.headers())
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': metadata.fileType || 'video/*',
        'X-Upload-Content-Length': String(metadata.fileSize || 0),
        ...(origin ? { 'Origin': origin } : {}),
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!initResponse.ok) {
    let errorMessage = `YouTube API error: HTTP ${initResponse.status}`
    try {
      const errorBody = await initResponse.json()
      const apiError = errorBody?.error
      if (apiError?.message) {
        errorMessage = apiError.message
        if (apiError.errors?.[0]?.reason === 'quotaExceeded') {
          throw new Error('Quota exceeded')
        }
      }
    } catch (err) {
      // Re-throw if it's our quota error
      if (err instanceof Error && err.message === 'Quota exceeded') {
        throw err
      }
      // Otherwise continue with generic error
    }
    throw new Error(`Failed to initiate upload: ${errorMessage}`)
  }

  const uploadUrl = initResponse.headers.get('Location')
  if (!uploadUrl) {
    throw new Error('No upload URL returned from YouTube')
  }

  return { uploadUrl }
}