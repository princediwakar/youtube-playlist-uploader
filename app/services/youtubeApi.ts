import { google } from 'googleapis'
import path from 'path'

export interface VideoMetadata {
  title: string
  description: string
  tags: string[]
  categoryId: string
  privacyStatus: 'private' | 'public' | 'unlisted'
  madeForKids: boolean
  isShort?: boolean
}

export interface UploadResponse {
  videoId: string
  url: string
}

export interface PlaylistItem {
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

export class YouTubeApiService {
  private youtube: ReturnType<typeof google.youtube>
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
    this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client })
  }

  async uploadVideo(
    fileBuffer: Buffer,
    filename: string,
    metadata: VideoMetadata
  ): Promise<UploadResponse> {
    const basename = path.basename(filename).replace(/[\/\\]/g, '_');
    const tempFilePath = `/tmp/${Date.now()}-${basename}`;
    console.log('Writing temporary video file:', { filename, basename, tempFilePath });
    const fs = await import('fs');

    try {
      fs.writeFileSync(tempFilePath, fileBuffer)

      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: metadata.categoryId
          },
          status: {
            privacyStatus: metadata.privacyStatus,
            selfDeclaredMadeForKids: metadata.madeForKids
          }
        },
        media: {
          body: fs.createReadStream(tempFilePath)
        }
      })

      const videoId = response.data.id
      if (!videoId) {
        throw new Error('No video ID returned from YouTube API')
      }

      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      }
    } finally {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
    }
  }

  async uploadVideoStream(
    fileStream: ReadableStream<Uint8Array>,
    fileSize: number,
    fileType: string,
    metadata: VideoMetadata
  ): Promise<UploadResponse> {
    const accessToken = (await this.oauth2Client.getAccessToken()).token
    if (!accessToken) {
      throw new Error('No access token available')
    }

    // Step 1: Initiate resumable upload session
    const requestBody = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId,
      },
      status: {
        privacyStatus: metadata.privacyStatus,
        selfDeclaredMadeForKids: metadata.madeForKids,
      },
    }

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': fileType || 'video/*',
          'X-Upload-Content-Length': String(fileSize),
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!initResponse.ok) {
      let errorMessage = `Failed to initiate upload: HTTP ${initResponse.status}`
      try {
        const errorBody = await initResponse.json()
        const apiError = errorBody?.error
        if (apiError?.message) errorMessage = apiError.message
      } catch { /* ignore parse errors */ }
      throw Object.assign(new Error(errorMessage), { code: initResponse.status })
    }

    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL returned from YouTube')
    }

    // Step 2: Stream chunks to the resumable URL
    const CHUNK_SIZE = 16 * 1024 * 1024
    const reader = fileStream.getReader()
    let bytesUploaded = 0
    const chunks: Uint8Array[] = []
    let currentChunkSize = 0

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (value && value.length > 0) {
          chunks.push(value)
          currentChunkSize += value.length
        }

        // Upload when chunk is full or stream is done
        if (currentChunkSize >= CHUNK_SIZE || (done && currentChunkSize > 0)) {
          const chunkBuffer = Buffer.concat(chunks.map(c => Buffer.from(c)))
          const rangeStart = bytesUploaded
          const rangeEnd = bytesUploaded + chunkBuffer.length - 1

          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${fileSize}`,
              'Content-Length': String(chunkBuffer.length),
            },
            body: chunkBuffer,
          })

          if (uploadResponse.ok) {
            const result = await uploadResponse.json()
            const videoId = result.id
            if (!videoId) throw new Error('No video ID in YouTube response')
            return { videoId, url: `https://www.youtube.com/watch?v=${videoId}` }
          }

          if (uploadResponse.status !== 308) {
            const errorBody = await uploadResponse.text().catch(() => '')
            throw new Error(`YouTube upload chunk failed: HTTP ${uploadResponse.status} - ${errorBody}`)
          }

          bytesUploaded += chunkBuffer.length
          chunks.length = 0
          currentChunkSize = 0
        }

        if (done) break
      }

      throw new Error('Upload ended without completion response from YouTube')
    } finally {
      try { reader.releaseLock() } catch { /* already released */ }
    }
  }

  async addVideoToPlaylist(videoId: string, playlistId: string, position?: number): Promise<void> {
    await this.youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId
          },
          position: position !== undefined ? position : undefined
        }
      }
    })
  }

  async createPlaylist(
    title: string,
    description: string,
    privacyStatus: 'private' | 'public' | 'unlisted' = 'private'
  ): Promise<string> {
    const response = await this.youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description
        },
        status: {
          privacyStatus
        }
      }
    })

    return response.data.id!
  }

  async getPlaylists(maxResults: number = 50): Promise<PlaylistItem[]> {
    const response = await this.youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults
    })

    return response.data.items as PlaylistItem[] || []
  }

  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<Array<{ videoId: string; title: string; position: number }>> {
    const response = await this.youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId,
      maxResults
    })

    return (response.data.items || []).map(item => ({
      videoId: item.contentDetails?.videoId || '',
      title: item.snippet?.title || '',
      position: item.snippet?.position || 0
    }))
  }

  async updateVideoMetadata(videoId: string, metadata: Partial<VideoMetadata>): Promise<void> {
    await this.youtube.videos.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: videoId,
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId
        },
        status: {
          privacyStatus: metadata.privacyStatus,
          selfDeclaredMadeForKids: metadata.madeForKids
        }
      }
    })
  }

  async deleteVideo(videoId: string): Promise<void> {
    await this.youtube.videos.delete({
      id: videoId
    })
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.youtube.playlists.delete({
      id: playlistId
    })
  }

  async updatePlaylist(
    playlistId: string,
    title: string,
    description: string,
    privacyStatus: 'private' | 'public' | 'unlisted' = 'private'
  ): Promise<{ id: string; snippet: { title: string; description: string } }> {
    const response = await this.youtube.playlists.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: playlistId,
        snippet: {
          title,
          description
        },
        status: {
          privacyStatus
        }
      }
    })

    return {
      id: response.data.id!,
      snippet: {
        title: response.data.snippet?.title || title,
        description: response.data.snippet?.description || description
      }
    }
  }

  async removeVideoFromPlaylist(playlistItemId: string): Promise<void> {
    await this.youtube.playlistItems.delete({
      id: playlistItemId
    })
  }
}

// Utility function to create service from session
export function createYouTubeApi(accessToken: string): YouTubeApiService {
  return new YouTubeApiService(accessToken)
}