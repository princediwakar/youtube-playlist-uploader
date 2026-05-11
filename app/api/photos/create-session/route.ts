import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { GooglePhotosService, GooglePhotosApiError } from '../../../../app/services/googlePhotosApi'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const photosService = new GooglePhotosService(session.accessToken as string)

  try {
    const { sessionId, pickerUri } = await photosService.createSession()
    return NextResponse.json({ sessionId, pickerUri })
  } catch (error: unknown) {
    if (error instanceof GooglePhotosApiError) {
      console.error('Google Photos Picker session creation failed:', {
        code: error.code,
        message: error.message,
      })

      if (error.code === 403) {
        return NextResponse.json(
          { error: 'Photos permission required', needsReauth: true },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: error.message, details: `Google Picker API returned HTTP ${error.code}` },
        { status: 502 }
      )
    }

    console.error('Unexpected error creating picker session:', error)
    throw error
  }
}
