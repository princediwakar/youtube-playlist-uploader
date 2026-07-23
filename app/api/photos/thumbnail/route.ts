import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const baseUrl = searchParams.get('baseUrl')
  
  if (!baseUrl) {
    return new NextResponse('Missing baseUrl', { status: 400 })
  }

  // Add the sizing parameters to get a thumbnail
  const thumbnailUrl = `${baseUrl}=w300-h300`

  try {
    const response = await fetch(thumbnailUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      console.error('Google Photos upstream error:', response.status, response.statusText)
      return new NextResponse(`Upstream failed: ${response.statusText}`, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Failed to fetch thumbnail:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
