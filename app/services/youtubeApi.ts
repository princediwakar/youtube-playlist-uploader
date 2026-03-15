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

  constructor(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials({ access_token: accessToken })
    this.youtube = google.youtube({ version: 'v3', auth: oauth2Client })
  }

  async uploadVideo(
    fileBuffer: Buffer,
    filename: string,
    metadata: VideoMetadata
  ): Promise<UploadResponse> {
    // Extract basename and sanitize filename (remove path separators)
    const basename = path.basename(filename).replace(/[\/\\]/g, '_');
    const tempFilePath = `/tmp/${Date.now()}-${basename}`;
    console.log('Writing temporary video file:', { filename, basename, tempFilePath });
    const fs = await import('fs');
    const { v4: uuidv4 } = await import('uuid');

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

  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<any[]> {
    const response = await this.youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId,
      maxResults
    })

    return response.data.items || []
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
}

// Utility function to create service from session
export function createYouTubeApi(accessToken: string): YouTubeApiService {
  return new YouTubeApiService(accessToken)
}