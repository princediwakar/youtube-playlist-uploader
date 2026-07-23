import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload'
]

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Call Google's tokeninfo endpoint to verify what scopes this token actually has
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${session.accessToken}`)
    
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: 'Failed to verify token scopes' }, { status: 401 })
    }

    const tokenInfo = await tokenInfoRes.json()
    const grantedScopes = (tokenInfo.scope || '').split(' ')

    const missingScopes = REQUIRED_SCOPES.filter(scope => !grantedScopes.includes(scope))

    return NextResponse.json({
      hasRequiredScopes: missingScopes.length === 0,
      missingScopes,
      grantedScopes
    })
  } catch (error) {
    console.error('check-scopes error:', error)
    return NextResponse.json(
      { error: 'Failed to check scopes', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
