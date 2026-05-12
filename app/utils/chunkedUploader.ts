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

class AlreadyCompleteError extends Error {
  constructor(public readonly videoId: string) {
    super('Upload already complete')
    this.name = 'AlreadyCompleteError'
  }
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5 MB (5242880 = 256KB * 20480)
const LOCAL_STORAGE_KEY_PREFIX = 'yt_upload_session_'
const GOOGLE_PHOTOS_URL_EXPIRY_MS = 60 * 60 * 1000 // 60 minutes
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

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
      return `${LOCAL_STORAGE_KEY_PREFIX}local_${this.file.name}_${this.file.size}`
    }
    if (this.source.type === 'googlePhotos' && this.source.googlePhotosMediaId) {
      return `${LOCAL_STORAGE_KEY_PREFIX}gp_${this.source.googlePhotosMediaId}`
    }
    return `${LOCAL_STORAGE_KEY_PREFIX}anon_${Date.now()}`
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
      localStorage.setItem(this.getSessionKey(), JSON.stringify(session))
    } catch {
      // localStorage unavailable or full — skip gracefully
    }
  }

  private loadSession(): ResumableSession | null {
    try {
      const raw = localStorage.getItem(this.getSessionKey())
      if (!raw) return null
      const session: ResumableSession = JSON.parse(raw)
      if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
        this.clearSession()
        return null
      }
      return session
    } catch {
      return null
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.getSessionKey())
    } catch {
      // ignore
    }
  }

private async queryYouTubeForProgress(uploadUrl: string, totalSize: number): Promise<number | null> {
  const response = await fetch('/api/youtube/query-progress', {
    method: 'PUT',
    headers: {
      'x-upload-url': uploadUrl,
      'x-total-size': String(totalSize),
    },
  })

  if (response.status === 308) {
    const range = response.headers.get('Range')
    if (range) {
      const match = range.match(/bytes=(\d+)-(\d+)/)
      if (match) return parseInt(match[2], 10) + 1
    }
    return 0 // 308 with no Range = nothing uploaded yet
  }

  if (response.status === 200 || response.status === 201) {
    // Already complete — extract video ID from YouTube's response body
    try {
      const data = await response.json()
      const videoId = data?.id
      if (videoId) throw new AlreadyCompleteError(videoId)
    } catch (e) {
      if (e instanceof AlreadyCompleteError) throw e
    }
    // Couldn't parse video ID — clear session so caller restarts fresh
    this.clearSession()
    return null
  }

  if ([400, 401, 403, 404, 410].includes(response.status)) {
    this.clearSession()
    return null // session gone — caller starts fresh
  }

  // 5xx or unexpected — throw so exponential backoff handles it
  // NEVER return null here — that would create a duplicate video
  throw new Error(`queryProgress failed with HTTP ${response.status}`)
}

private async uploadChunk(
  uploadUrl: string,
  chunk: Blob,
  rangeStart: number,
  rangeEnd: number,
  totalSize: number,
  signal: AbortSignal
): Promise<{ status: number; body: unknown }> {
  const response = await fetch('/api/youtube/upload-chunk', {
    method: 'PUT',
    headers: {
      'x-upload-url': uploadUrl,
      'content-range': `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
      'content-type': 'video/*',
    },
    body: chunk,
    signal,
  })

  if (response.status === 200 || response.status === 201 || response.status === 308) {
    let body: unknown = null
    if (response.status !== 308) {
      const text = await response.text()
      if (text) {
        try { body = JSON.parse(text) } catch { /* ignore */ }
      }
    }
    return { status: response.status, body }
  }

  const errorText = await response.text()
  throw new Error(`Chunk upload failed: HTTP ${response.status} - ${errorText}`)
}

  private isGooglePhotosExpired(): boolean {
    if (this.source.type !== 'googlePhotos') return false
    try {
      const stored = localStorage.getItem(this.getSessionKey())
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

      try {
        const verifiedBytes = await this.queryYouTubeForProgress(uploadUrl, totalSize)
        if (verifiedBytes !== null) {
          bytesUploaded = verifiedBytes
          console.log(`Resuming upload from byte ${bytesUploaded}`)
        } else {
          console.log('Session expired or invalid, starting fresh')
          this.clearSession()
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
      } catch (e) {
        if (e instanceof AlreadyCompleteError) {
          this.clearSession()
          if (this.onProgress) {
            this.onProgress({ bytesUploaded: totalSize, totalBytes: totalSize, percent: 100 })
          }
          return e.videoId
        }
        throw e
      }

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
      this.saveSession(uploadUrl, bytesUploaded)
    }

    const signal = this.signal || new AbortController().signal

    let retryCount = 0

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
        const { status, body } = await this.uploadChunk(
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

        if (status === 308) {
          bytesUploaded = chunkEnd
          retryCount = 0 // Reset retries on success
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
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error
        if (error instanceof AlreadyCompleteError) {
          this.clearSession()
          if (this.onProgress) {
            this.onProgress({ bytesUploaded: totalSize, totalBytes: totalSize, percent: 100 })
          }
          return error.videoId
        }

        const errorMessage = error instanceof Error ? error.message : String(error)
        const isExpiredSession = errorMessage.includes('404') || errorMessage.includes('410') || errorMessage.includes('Not Found') || errorMessage.includes('Gone')
        
        if (isExpiredSession) {
          console.log('Session expired during upload, clearing and restarting')
          this.clearSession()
          throw new Error('Upload session expired. Please restart the upload.')
        }

        // Exponential Backoff: (2^retry * 1000) + random jitter
        const wait = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
        if (retryCount > 5) throw new Error('Upload failed after maximum retries')
        
        await new Promise(r => setTimeout(r, wait))
        retryCount++
        
        // Re-verify byte position with Google after error
        try {
          const verifiedBytes = await this.queryYouTubeForProgress(uploadUrl, totalSize)
          if (verifiedBytes !== null) {
            bytesUploaded = verifiedBytes
          }
        } catch (queryErr) {
          if (queryErr instanceof AlreadyCompleteError) throw queryErr
          console.warn('Failed to verify progress, continuing with current byte position:', queryErr)
        }
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