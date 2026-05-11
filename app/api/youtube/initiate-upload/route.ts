import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { rateLimit } from '../../../utils/rateLimit'

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, { maxRequests: 30, windowMs: 60 * 1000 })
  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { metadata, fileType, fileSize } = await request.json()

    if (!metadata?.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
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

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': fileType || 'video/*',
          'X-Upload-Content-Length': String(fileSize || 0),
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
            return NextResponse.json(
              { error: 'Quota exceeded', details: errorMessage },
              { status: 403 }
            )
          }
        }
      } catch {
        // Could not parse error body
      }
      return NextResponse.json(
        { error: 'Failed to initiate upload', details: errorMessage },
        { status: 502 }
      )
    }

    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'No upload URL returned from YouTube' },
        { status: 502 }
      )
    }

    return NextResponse.json({ uploadUrl })
  } catch (error) {
    console.error('initiate-upload error:', error)
    return NextResponse.json(
      { error: 'Initiate upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
