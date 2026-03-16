// Discriminated union type for media files
export type MediaType = 'video' | 'audio'

// Base interface with common properties
export interface BaseMediaFile {
  file: File
  name: string
  size: string
  path: string
  relativePath: string
  folder: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  videoId?: string  // YouTube video ID after upload (for both audio and video)
  error?: string
  duration?: number
  mediaType: MediaType  // Discriminator property for type safety
}

// Video-specific interface extending base
export interface VideoFile extends BaseMediaFile {
  mediaType: 'video'
  thumbnail?: string
  isShort?: boolean
  aspectRatio?: number
}

// Audio-specific interface extending base
export interface AudioFile extends BaseMediaFile {
  mediaType: 'audio'
  waveform?: number[]  // Array of amplitude values for visualization (not Base64)
  audioThumbnail?: string  // Generated "video frame" for audio
  artist?: string
  album?: string
  genre?: string
  audioFormat?: string  // mp3, wav, m4a, etc.
  bitrate?: number
  sampleRate?: number
  channels?: number
}

// Discriminated union type
export type MediaFile = VideoFile | AudioFile

// Type guard functions for runtime type checking
export function isVideoFile(file: MediaFile): file is VideoFile {
  return file.mediaType === 'video'
}

export function isAudioFile(file: MediaFile): file is AudioFile {
  return file.mediaType === 'audio'
}

// Helper function to create a MediaFile from a File object
export async function createMediaFile(
  file: File,
  folder: string,
  path: string,
  relativePath: string
): Promise<MediaFile> {
  const baseFile: BaseMediaFile = {
    file,
    name: file.name,
    size: formatFileSize(file.size),
    path,
    relativePath,
    folder,
    status: 'pending',
    progress: 0,
    mediaType: 'video', // Default for backward compatibility, will be updated after analysis
    duration: undefined,
  }

  // Default to video for backward compatibility
  // This will be updated by detectMediaType() in mediaHelpers.ts
  return {
    ...baseFile,
    mediaType: 'video',
  } as VideoFile
}

// Helper function to format file size (copied from existing utils)
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}