// app/api/youtube/upload-chunk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const uploadUrl = request.headers.get('x-upload-url')
    const contentRange = request.headers.get('content-range')

    if (!uploadUrl || !contentRange) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
    }

    const parsed = new URL(uploadUrl)
    if (!parsed.hostname.endsWith('.googleapis.com')) {
      return NextResponse.json({ error: 'Invalid upload URL' }, { status: 400 })
    }

    const body = await request.arrayBuffer()

    // *** DIAGNOSTIC — remove after fixing ***
    console.log('[upload-chunk] content-range:', contentRange)
    console.log('[upload-chunk] body byteLength received by proxy:', body.byteLength)
    // *** END DIAGNOSTIC ***

    const ytResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
        'Content-Type': request.headers.get('content-type') || 'video/*',
        'Content-Length': String(body.byteLength),
      },
      body,
    })

    // *** DIAGNOSTIC — remove after fixing ***
    console.log('[upload-chunk] YouTube status:', ytResponse.status)
    console.log('[upload-chunk] YouTube Range back:', ytResponse.headers.get('Range'))
    const ytBody = await ytResponse.text()
    console.log('[upload-chunk] YouTube body back:', ytBody.slice(0, 500))
    // *** END DIAGNOSTIC ***

    const headers = new Headers()
    const rangeHeader = ytResponse.headers.get('Range')
    if (rangeHeader) headers.set('Range', rangeHeader)

    if (ytResponse.status === 308) {
      return new NextResponse(null, { status: 308, headers })
    }
    if (ytResponse.status === 200 || ytResponse.status === 201) {
      headers.set('Content-Type', 'application/json')
      return new NextResponse(ytBody, { status: ytResponse.status, headers })
    }

    return new NextResponse(ytBody, {
      status: ytResponse.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[upload-chunk] error:', error)
    return NextResponse.json({ error: 'Chunk upload failed', details: String(error) }, { status: 500 })
  }
}