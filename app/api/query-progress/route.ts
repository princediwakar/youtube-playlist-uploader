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

    const parsed = new URL(uploadUrl)
    if (!parsed.hostname.endsWith('.googleapis.com')) {
      return NextResponse.json({ error: 'Invalid upload URL' }, { status: 400 })
    }

    // Per the API spec: empty PUT with Content-Range: bytes */TOTAL to query status
    const ytResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${totalSize}`,
        'Content-Length': '0',
      },
    })

    const headers = new Headers()
    const rangeHeader = ytResponse.headers.get('Range')
    if (rangeHeader) headers.set('Range', rangeHeader)

    // 308 = still in progress (Range header tells us bytes received)
    // 200/201 = already complete
    // 4xx = session gone, need to restart
    if (ytResponse.status === 308 || ytResponse.status === 200 || ytResponse.status === 201) {
      const body = ytResponse.status !== 308 ? await ytResponse.text() : null
      if (body) headers.set('Content-Type', 'application/json')
      return new NextResponse(body, { status: ytResponse.status, headers })
    }

    return new NextResponse(null, { status: ytResponse.status, headers })
  } catch (error) {
    console.error('query-progress error:', error)
    return NextResponse.json({ error: 'Progress query failed' }, { status: 500 })
  }
}