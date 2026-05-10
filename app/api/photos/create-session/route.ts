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
    if (error instanceof GooglePhotosApiError && error.code === 403) {
      return NextResponse.json(
        { error: 'Photos permission required', needsReauth: true },
        { status: 403 }
      )
    }
    throw error
  }
}
