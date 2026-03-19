// Unified media analysis utilities
// Re-exports all video and audio helpers, plus provides unified media analysis

// Re-export video helpers
export * from './videoHelpers'

// Re-export audio helpers
export * from './audioHelpers'

// Import types
import { MediaFile, VideoFile, AudioFile, isVideoFile, isAudioFile } from '@/app/types/media'
import { analyzeVideo } from './videoHelpers'
import { analyzeAudio as analyzeAudioMain, detectMediaType as detectMediaTypeFromAudio } from './audioHelpers'
import { analyzeAudioWithFallback } from './audioWorker'

// Unified media analysis function
export async function analyzeMedia(file: File): Promise<{
  duration: number
  mediaType: 'video' | 'audio'
  thumbnail?: string
  audioThumbnail?: string
  waveform?: number[]
  isShort?: boolean
  aspectRatio?: number
  artist?: string
  album?: string
  genre?: string
  audioFormat?: string
  bitrate?: number
  sampleRate?: number
  channels?: number
}> {
  const mediaType = detectMediaType(file)

  switch (mediaType) {
    case 'video':
      const videoAnalysis = await analyzeVideo(file)
      return {
        duration: videoAnalysis.duration,
        mediaType: 'video',
        thumbnail: videoAnalysis.thumbnail,
        isShort: videoAnalysis.isShort,
        aspectRatio: videoAnalysis.aspectRatio
      }

    case 'audio':
      const audioAnalysis = await analyzeAudioWithFallback(file)
      return {
        duration: audioAnalysis.duration,
        mediaType: 'audio',
        audioThumbnail: audioAnalysis.audioThumbnail,
        waveform: audioAnalysis.waveform,
        artist: audioAnalysis.artist,
        album: audioAnalysis.album,
        genre: audioAnalysis.genre,
        audioFormat: audioAnalysis.audioFormat,
        bitrate: audioAnalysis.bitrate,
        sampleRate: audioAnalysis.sampleRate,
        channels: audioAnalysis.channels
      }

    default:
      throw new Error(`Unsupported media type for file: ${file.name}`)
  }
}

// Detect media type (re-export from audioHelpers for convenience)
export const detectMediaType = detectMediaTypeFromAudio

// Type guard utilities (re-export from media types for convenience)
export { isVideoFile, isAudioFile } from '@/app/types/media'

// Helper to create appropriate media file object based on file type
export async function createMediaFileFromFile(
  file: File,
  folder: string,
  path: string,
  relativePath: string
): Promise<MediaFile> {
  const baseFile = {
    file,
    name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    size: formatFileSize(file.size),
    path,
    relativePath,
    folder,
    status: 'pending' as const,
    progress: 0,
    duration: undefined
  }

  const mediaType = detectMediaType(file)

  if (mediaType === 'audio') {
    return {
      ...baseFile,
      mediaType: 'audio',
      // Audio-specific fields will be populated by analyzeMedia
    } as AudioFile
  } else {
    // Default to video (for backward compatibility and unknown types)
    return {
      ...baseFile,
      mediaType: 'video',
      // Video-specific fields will be populated by analyzeMedia
    } as VideoFile
  }
}

// Helper to update media file with analysis results
export function updateMediaFileWithAnalysis(
  mediaFile: MediaFile,
  analysis: Awaited<ReturnType<typeof analyzeMedia>>
): MediaFile {
  const updated = {
    ...mediaFile,
    duration: analysis.duration
  }

  if (mediaFile.mediaType === 'video' && 'thumbnail' in analysis) {
    return {
      ...updated,
      thumbnail: analysis.thumbnail,
      isShort: analysis.isShort,
      aspectRatio: analysis.aspectRatio
    } as VideoFile
  } else if (mediaFile.mediaType === 'audio' && 'audioThumbnail' in analysis) {
    return {
      ...updated,
      audioThumbnail: analysis.audioThumbnail,
      waveform: analysis.waveform,
      artist: analysis.artist,
      album: analysis.album,
      genre: analysis.genre,
      audioFormat: analysis.audioFormat,
      bitrate: analysis.bitrate,
      sampleRate: analysis.sampleRate,
      channels: analysis.channels
    } as AudioFile
  }

  return updated
}

// Re-export formatFileSize from videoHelpers for backward compatibility
import { formatFileSize } from './videoHelpers'
export { formatFileSize }