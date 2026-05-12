// app/api/youtube/query-progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const uploadUrl = request.headers.get('x-upload-url')
    const totalSize = request.headers.get('x-total-size')

    if (!uploadUrl || !totalSize) {
      return NextResponse.json({ error: 'Missing x-upload-url or x-total-size' }, { status: 400 })
    }

    // SSRF guard
    const parsed = new URL(uploadUrl)
    if (!parsed.hostname.endsWith('.googleapis.com')) {
      return NextResponse.json({ error: 'Invalid upload URL' }, { status: 400 })
    }

    // *** DIAGNOSTIC — remove after fixing ***
    console.log('[query-progress] totalSize:', totalSize)
    // *** END DIAGNOSTIC ***

    const ytResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${totalSize}`,
        'Content-Length': '0',
      },
    })

    // *** DIAGNOSTIC — remove after fixing ***
    console.log('[query-progress] YouTube status:', ytResponse.status)
    console.log('[query-progress] YouTube Range back:', ytResponse.headers.get('Range'))
    // *** END DIAGNOSTIC ***

    const headers = new Headers()
    const rangeHeader = ytResponse.headers.get('Range')
    if (rangeHeader) headers.set('Range', rangeHeader)

    // 308 = in progress, 200/201 = already complete, 4xx = session dead
    if (ytResponse.status === 308) {
      return new NextResponse(null, { status: 308, headers })
    }
    if (ytResponse.status === 200 || ytResponse.status === 201) {
      const body = await ytResponse.text()
      headers.set('Content-Type', 'application/json')
      return new NextResponse(body, { status: ytResponse.status, headers })
    }
    // 404, 410, 400, 403 — session gone
    return new NextResponse(null, { status: ytResponse.status })
  } catch (error) {
    console.error('query-progress error:', error)
    return NextResponse.json({ error: 'Progress query failed' }, { status: 500 })
  }
}