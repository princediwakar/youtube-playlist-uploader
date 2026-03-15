export interface UploadData {
  title: string
  description: string
  contentType: string
  privacyStatus: string
  playlistId?: string
  position?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface UploadResponse {
  success: boolean
  videoId: string
  url: string
}

export interface PlaylistResponse {
  id: string
  snippet: {
    title: string
    description?: string
    publishedAt: string
  }
  contentDetails: {
    itemCount: number
  }
}