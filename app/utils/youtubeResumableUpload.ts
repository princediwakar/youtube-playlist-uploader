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

const CHUNK_SIZE = 16 * 1024 * 1024 // 16 MB
const MAX_CHUNK_RETRIES = 3

async function uploadChunk(
  uploadUrl: string,
  chunk: Blob,
  rangeStart: number,
  rangeEnd: number,
  totalSize: number,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
      'Content-Length': String(chunk.size),
    },
    body: chunk,
    signal,
  })
}

async function uploadChunkWithRetry(
  uploadUrl: string,
  chunk: Blob,
  rangeStart: number,
  rangeEnd: number,
  totalSize: number,
  signal?: AbortSignal
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_CHUNK_RETRIES; attempt++) {
    try {
      const response = await uploadChunk(uploadUrl, chunk, rangeStart, rangeEnd, totalSize, signal)

      // 200 or 201 = upload completed
      if (response.ok) {
        return response
      }

      // 308 = Resume Incomplete — chunk accepted, continue uploading (expected intermediate response)
      if (response.status === 308) {
        return response
      }

      // 5xx errors are retryable
      if (response.status >= 500) {
        lastError = new Error(`YouTube upload server error: HTTP ${response.status}`)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // 408/429 are retryable
      if (response.status === 408 || response.status === 429) {
        lastError = new Error(`YouTube upload temporary error: HTTP ${response.status}`)
        const delay = Math.pow(2, attempt) * 2000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      const errorBody = await response.text().catch(() => '')
      throw new Error(`YouTube upload failed: HTTP ${response.status} - ${errorBody}`)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error
      if (error instanceof Error && !error.message.startsWith('YouTube upload')) {
        lastError = error
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }

  throw lastError || new Error('Chunk upload failed after retries')
}

export async function uploadToYouTubeResumable(
  file: File,
  metadata: ResumableUploadMetadata,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<string> {
  // Step 1: Initiate resumable upload session via server proxy (avoids CORS issues)
  let uploadUrl: string
  try {
    const initResponse = await fetch('/api/youtube/initiate-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata,
        fileType: file.type || 'video/*',
        fileSize: file.size,
      }),
      signal,
    })

    if (!initResponse.ok) {
      let errorMessage = `Failed to initiate upload: HTTP ${initResponse.status}`
      try {
        const error = await initResponse.json()
        errorMessage = error.details || error.error || errorMessage
        if (error.error === 'Quota exceeded') {
          throw new Error(`quotaExceeded: ${errorMessage}`)
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('quotaExceeded')) throw e
      }
      throw new Error(errorMessage)
    }

    const data = await initResponse.json()
    uploadUrl = data.uploadUrl
    if (!uploadUrl) {
      throw new Error('No upload URL returned from server')
    }
  } catch (error) {
    throw new Error(`Failed to initiate upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Step 2: Upload file in chunks
  const totalSize = file.size
  let bytesUploaded = 0

  while (bytesUploaded < totalSize) {
    const chunkEnd = Math.min(bytesUploaded + CHUNK_SIZE, totalSize)
    const chunk = file.slice(bytesUploaded, chunkEnd)

    let response: Response
    try {
      response = await uploadChunkWithRetry(
        uploadUrl,
        chunk,
        bytesUploaded,
        chunkEnd - 1,
        totalSize,
        signal
      )
    } catch (error) {
      throw new Error(`Chunk upload failed at byte ${bytesUploaded}/${totalSize}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // 200 or 201 = upload complete
    if (response.status === 200 || response.status === 201) {
      const result = await response.json()
      const videoId = result.id
      if (!videoId) {
        throw new Error('No video ID in YouTube response')
      }
      if (onProgress) {
        onProgress({ bytesUploaded: totalSize, totalBytes: totalSize, percent: 100 })
      }
      return videoId
    }

    bytesUploaded = chunkEnd

    if (onProgress) {
      onProgress({
        bytesUploaded,
        totalBytes: totalSize,
        percent: Math.round((bytesUploaded / totalSize) * 100),
      })
    }
  }

  throw new Error('Upload ended without completion response from YouTube')
}
