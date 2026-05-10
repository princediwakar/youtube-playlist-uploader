export interface PickedMediaItem {
  id: string
  createTime: string
  type: 'PHOTO' | 'VIDEO' | 'TYPE_UNSPECIFIED'
  mediaFile: {
    baseUrl: string
    mimeType: string
    filename: string
    mediaFileMetadata?: {
      width?: number
      height?: number
    }
  }
}

interface PickingSession {
  id: string
  pickerUri: string
  mediaItemsSet: boolean
  pollingConfig?: {
    pollInterval: string
    timeoutIn: string
  }
}

export class GooglePhotosApiError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.name = 'GooglePhotosApiError'
    this.code = code
  }
}

export class GooglePhotosService {
  private accessToken: string
  private baseUrl = 'https://photospicker.googleapis.com/v1'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async createSession(): Promise<{ sessionId: string; pickerUri: string }> {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(err => {
        console.error('Failed to parse error response:', err)
        return {}
      })
      throw new GooglePhotosApiError(
        errorBody?.error?.message || `Picker API error: HTTP ${response.status}`,
        response.status
      )
    }

    const session: PickingSession = await response.json()
    return { sessionId: session.id, pickerUri: session.pickerUri }
  }

  async getSession(sessionId: string): Promise<{ mediaItemsSet: boolean; pollInterval?: string }> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(err => {
        console.error('Failed to parse error response:', err)
        return {}
      })
      throw new GooglePhotosApiError(
        errorBody?.error?.message || `Picker API error: HTTP ${response.status}`,
        response.status
      )
    }

    const session: PickingSession = await response.json()
    return {
      mediaItemsSet: session.mediaItemsSet,
      pollInterval: session.pollingConfig?.pollInterval,
    }
  }

  async listPickedMediaItems(sessionId: string, pageToken?: string): Promise<{
    mediaItems: PickedMediaItem[]
    nextPageToken?: string
  }> {
    const params = new URLSearchParams()
    params.set('sessionId', sessionId)
    if (pageToken) params.set('pageToken', pageToken)

    const response = await fetch(`${this.baseUrl}/mediaItems?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(err => {
        console.error('Failed to parse error response:', err)
        return {}
      })
      throw new GooglePhotosApiError(
        errorBody?.error?.message || `Picker API error: HTTP ${response.status}`,
        response.status
      )
    }

    return response.json()
  }

  async downloadMedia(baseUrl: string): Promise<Buffer> {
    const downloadUrl = `${baseUrl}=dv`

    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new GooglePhotosApiError(
        `Failed to download media: HTTP ${response.status}`,
        response.status
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}
