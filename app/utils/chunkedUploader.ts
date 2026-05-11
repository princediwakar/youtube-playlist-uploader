// app/utils/chunkedUploader.ts
import { initiateResumableUpload } from '@/app/actions/upload'

export interface ResumableUploadMetadata {
  title: string
  description: string
  tags: string[]
  categoryId: string
  privacyStatus: 'private' | 'public' | 'unlisted'
  madeForKids: boolean
  isShort?: boolean
}

export interface UploadProgress {
  bytesUploaded: number
  totalBytes: number
  percent: number
}

export interface ChunkedUploadSource {
  type: 'local' | 'googlePhotos'
  size: number
  googlePhotosMediaId?: string
  googlePhotosBaseUrl?: string
  googlePhotosFetchedAt?: number
  accessToken?: string
}

interface ResumableSession {
  uploadUrl: string
  bytesUploaded: number
  mediaId?: string
  createdAt: number
  googlePhotosFetchedAt?: number
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB
const SESSION_STORAGE_KEY_PREFIX = 'yt_upload_session_'
const GOOGLE_PHOTOS_URL_EXPIRY_MS = 60 * 60 * 1000 // 60 minutes

export class ChunkedUploader {
  private source: ChunkedUploadSource
  private file: File | null
  private metadata: ResumableUploadMetadata
  private onProgress?: (progress: UploadProgress) => void
  private signal?: AbortSignal
  private session: ResumableSession | null = null

  constructor(
    source: ChunkedUploadSource & { type: 'local' },
    metadata: ResumableUploadMetadata,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal
  )
  constructor(
    source: ChunkedUploadSource & { type: 'googlePhotos'; googlePhotosMediaId: string; googlePhotosBaseUrl: string },
    metadata: ResumableUploadMetadata,
    _file: null,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal
  )
  constructor(
    source: ChunkedUploadSource,
    metadata: ResumableUploadMetadata,
    file: File | null,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal
  ) {
    this.source = source
    this.metadata = metadata
    this.file = file
    this.onProgress = onProgress
    this.signal = signal
  }

  private getSessionKey(): string {
    if (this.source.type === 'local' && this.file) {
      return `${SESSION_STORAGE_KEY_PREFIX}local_${this.file.name}_${this.file.size}`
    }
    if (this.source.type === 'googlePhotos' && this.source.googlePhotosMediaId) {
      return `${SESSION_STORAGE_KEY_PREFIX}gp_${this.source.googlePhotosMediaId}`
    }
    return `${SESSION_STORAGE_KEY_PREFIX}anon_${Date.now()}`
  }

  private saveSession(uploadUrl: string, bytesUploaded: number, mediaId?: string, googlePhotosFetchedAt?: number): void {
    try {
      const session: ResumableSession = {
        uploadUrl,
        bytesUploaded,
        mediaId,
        createdAt: Date.now(),
        googlePhotosFetchedAt: googlePhotosFetchedAt,
      }
      sessionStorage.setItem(this.getSessionKey(), JSON.stringify(session))
    } catch {
      // sessionStorage unavailable or full — skip gracefully
    }
  }

  private loadSession(): ResumableSession | null {
    try {
      const raw = sessionStorage.getItem(this.getSessionKey())
      if (!raw) return null
      const session: ResumableSession = JSON.parse(raw)
      return session
    } catch {
      return null
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem(this.getSessionKey())
    } catch {
      // ignore
    }
  }

  private isGooglePhotosExpired(): boolean {
    if (this.source.type !== 'googlePhotos') return false
    try {
      const stored = sessionStorage.getItem(this.getSessionKey())
      if (!stored) return true
      const session: ResumableSession = JSON.parse(stored)
      if (session.googlePhotosFetchedAt) {
        const elapsed = Date.now() - session.googlePhotosFetchedAt
        return elapsed > GOOGLE_PHOTOS_URL_EXPIRY_MS
      }
      return true
    } catch {
      return true
    }
  }

  private async fetchGooglePhotosChunk(
    baseUrl: string,
    rangeStart: number,
    rangeEnd: number,
    signal: AbortSignal
  ): Promise<ArrayBuffer> {
    const accessToken = this.source.accessToken
    if (!accessToken) throw new Error('No access token for Google Photos download')
    const downloadUrl = `${baseUrl}=dv`
    const response = await fetch(downloadUrl, {
      headers: {
        Range: `bytes=${rangeStart}-${rangeEnd}`,
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    })

    if (!response.ok && response.status !== 206) {
      throw new Error(`Failed to fetch Google Photos chunk: HTTP ${response.status}`)
    }

    return response.arrayBuffer()
  }

  private uploadChunk(
    uploadUrl: string,
    chunk: Blob,
    rangeStart: number,
    rangeEnd: number,
    totalSize: number,
    signal: AbortSignal
  ): Promise<{ status: number; body: unknown }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)
      xhr.setRequestHeader('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${totalSize}`)
      
      const abortHandler = () => xhr.abort()
      if (signal) {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
        signal.addEventListener('abort', abortHandler)
      }

      xhr.onload = () => {
        const status = xhr.status
        if ((status >= 200 && status < 300) || status === 308) {
          let body: unknown = null
          if (xhr.responseText) {
            try {
              body = JSON.parse(xhr.responseText)
            } catch {
              // chunk response might have no body on 308
            }
          }
          resolve({ status, body })
        } else {
          reject(new Error(`Chunk upload failed: HTTP ${status} - ${xhr.responseText}`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during chunk upload'))
      xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))

      xhr.onloadend = () => {
        if (signal) {
          signal.removeEventListener('abort', abortHandler)
        }
      }

      xhr.send(chunk)
    })
  }

  private async uploadChunkWithRetry(
    uploadUrl: string,
    chunk: Blob,
    rangeStart: number,
    rangeEnd: number,
    totalSize: number,
    signal: AbortSignal
  ): Promise<{ status: number; body: unknown }> {
    const MAX_RETRIES = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.uploadChunk(uploadUrl, chunk, rangeStart, rangeEnd, totalSize, signal)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error

        lastError = error instanceof Error ? error : new Error(String(error))
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Chunk upload failed after retries')
  }

  async upload(): Promise<string> {
    const totalSize = this.source.size

    // Check for resumable session
    const savedSession = this.loadSession()
    let uploadUrl: string
    let bytesUploaded = 0

    if (savedSession) {
      // Resume from saved session
      uploadUrl = savedSession.uploadUrl
      bytesUploaded = savedSession.bytesUploaded

      // For Google Photos, re-fetch URL if expired
      if (this.source.type === 'googlePhotos' && this.isGooglePhotosExpired()) {
        const { refreshGooglePhotosUrl } = await import('@/app/actions/photos')
        try {
          const { baseUrl } = await refreshGooglePhotosUrl(this.source.googlePhotosMediaId!)
          this.source.googlePhotosBaseUrl = baseUrl
          const fetchedAtMs = Date.now()
          this.source.googlePhotosFetchedAt = fetchedAtMs
          this.saveSession(uploadUrl, bytesUploaded, undefined, fetchedAtMs)
        } catch (error) {
          console.error('Failed to refresh Google Photos URL:', error)
          throw new Error('Google Photos URL expired and could not be refreshed')
        }
      }
    } else {
      // Initiate new session via server action
      const { uploadUrl: uri } = await initiateResumableUpload({
        title: this.metadata.title,
        description: this.metadata.description,
        tags: this.metadata.tags,
        categoryId: this.metadata.categoryId,
        privacyStatus: this.metadata.privacyStatus,
        madeForKids: this.metadata.madeForKids,
        isShort: this.metadata.isShort,
        fileType: 'video/*',
        fileSize: totalSize,
      })
      uploadUrl = uri
      bytesUploaded = 0
    }

    const signal = this.signal || new AbortController().signal

    // Upload chunks
    while (bytesUploaded < totalSize) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

      const chunkEnd = Math.min(bytesUploaded + CHUNK_SIZE, totalSize)
      let chunk: Blob

      if (this.source.type === 'local' && this.file) {
        chunk = this.file.slice(bytesUploaded, chunkEnd)
      } else if (this.source.type === 'googlePhotos' && this.source.googlePhotosBaseUrl) {
        const arrayBuffer = await this.fetchGooglePhotosChunk(
          this.source.googlePhotosBaseUrl,
          bytesUploaded,
          chunkEnd - 1,
          signal
        )
        chunk = new Blob([arrayBuffer])
      } else {
        throw new Error('Invalid source: no file or Google Photos URL')
      }

      try {
        const { status, body } = await this.uploadChunkWithRetry(
          uploadUrl,
          chunk,
          bytesUploaded,
          chunkEnd - 1,
          totalSize,
          signal
        )

        // 200/201 = upload complete
        if (status === 200 || status === 201) {
          const result = body as { id?: string; videoId?: string }
          const videoId = result?.videoId || result?.id
          if (!videoId) throw new Error('No video ID in YouTube response')
          this.clearSession()
          if (this.onProgress) {
            this.onProgress({ bytesUploaded: totalSize, totalBytes: totalSize, percent: 100 })
          }
          return videoId
        }

        bytesUploaded = chunkEnd
        const fetchedAt = this.source.type === 'googlePhotos' && this.source.googlePhotosFetchedAt
          ? this.source.googlePhotosFetchedAt
          : undefined
        this.saveSession(uploadUrl, bytesUploaded, undefined, fetchedAt)

        if (this.onProgress) {
          this.onProgress({
            bytesUploaded,
            totalBytes: totalSize,
            percent: Math.round((bytesUploaded / totalSize) * 100),
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error
        throw error
      }
    }

    throw new Error('Upload ended without completion response from YouTube')
  }
}

export async function uploadToYouTubeResumable(
  file: File,
  metadata: ResumableUploadMetadata,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<string> {
  const uploader = new ChunkedUploader(
    { type: 'local', size: file.size },
    metadata,
    file,
    onProgress,
    signal
  )
  return uploader.upload()
}

export async function uploadBlobToYouTubeResumable(
  blob: Blob,
  fileName: string,
  metadata: ResumableUploadMetadata,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<string> {
  const file = new File([blob], fileName, { type: 'video/mp4' })
  return uploadToYouTubeResumable(file, metadata, onProgress, signal)
}