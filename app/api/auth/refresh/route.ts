import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // If token is still valid (with 5-minute buffer), return it as-is
  const expiresAt = (token.accessTokenExpires as number) * 1000
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return NextResponse.json({ accessToken: token.accessToken, refreshed: false })
  }

  if (!token.refreshToken) {
    return NextResponse.json({ error: 'No refresh token available. Please sign in again.' }, { status: 401 })
  }

  // Refresh the token
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshed = await response.json()

    if (!response.ok) {
      console.error('Token refresh failed:', refreshed)
      return NextResponse.json(
        { error: 'Failed to refresh access token. Please sign in again.' },
        { status: 401 }
      )
    }

    console.log('Access token refreshed successfully')
    return NextResponse.json({
      accessToken: refreshed.access_token,
      refreshed: true,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Token refresh failed. Please sign in again.' },
      { status: 500 }
    )
  }
}
