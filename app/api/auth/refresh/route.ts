import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { rateLimit } from '../../../utils/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const rateLimitResult = rateLimit(request, { maxRequests: 10, windowMs: 60 * 1000 })
  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Token refresh happens automatically in auth.js v5 via the jwt callback
  // If session exists, the token is valid or being refreshed
  return NextResponse.json({ refreshed: true })
}
