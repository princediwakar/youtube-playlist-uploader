'use client'

import { useState, useCallback, useRef } from 'react'
import { MediaFile } from '@/app/types/media'
import { formatFileSize } from '@/app/utils/videoHelpers'
import { analyzeMedia, detectMediaType } from '@/app/utils/mediaHelpers'


export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  validFiles: File[]
  invalidFiles: File[]
}

export function validateFiles(files: File[]): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validFiles: File[] = []
  const invalidFiles: File[] = []

  // Separate media files from non-media files
  for (const file of files) {
    const mediaType = detectMediaType(file)
    if (mediaType === 'unknown') {
      invalidFiles.push(file)
      warnings.push(`Skipped non-media file: ${file.name}`)
    } else {
      validFiles.push(file)
    }
  }





  return {
    valid: errors.length === 0 && validFiles.length > 0,
    errors,
    warnings,
    validFiles,
    invalidFiles
  }
}

function createMediaFile(file: File): MediaFile {
  const fullPath = (file as any).webkitRelativePath || file.name
  const pathParts = fullPath.split('/')
  const fileName = pathParts[pathParts.length - 1]
  const folderPath = pathParts.slice(0, -1).join('/')
  const rootFolder = pathParts[0] || 'Root'
  const detectedType = detectMediaType(file)
  const mediaType = detectedType === 'unknown' ? 'video' : detectedType

  return {
    file,
    name: fileName.replace(/\.[^/.]+$/, ''),
    size: formatFileSize(file.size),
    path: fullPath,
    relativePath: folderPath,
    folder: rootFolder,
    status: 'pending',
    progress: 0,
    mediaType
  }
}

export function useFileHandling() {
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const pendingAnalysisRef = useRef<Map<string, { startIndex: number; relativeIndex: number }>>(new Map())

  const addVideos = useCallback((files: File[]): { added: MediaFile[]; errors: string[] } => {
    const validation = validateFiles(files)
    
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return { added: [], errors: validation.errors }
    }
    
    setValidationErrors([])

    const newMediaFiles = validation.validFiles
      .map(file => createMediaFile(file))
      .filter(Boolean)

    if (newMediaFiles.length === 0) return { added: [], errors: [] }

    newMediaFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }))

    const startIndex = videos.length

    newMediaFiles.forEach((mediaFile, relativeIndex) => {
      pendingAnalysisRef.current.set(mediaFile.path, { startIndex, relativeIndex })
    })

    setVideos(prevVideos => [...prevVideos, ...newMediaFiles])

    newMediaFiles.forEach((mediaFile, relativeIndex) => {
      const storedRef = pendingAnalysisRef.current.get(mediaFile.path)
      const actualStartIndex = storedRef?.startIndex ?? startIndex
      const actualIndex = storedRef?.relativeIndex ?? relativeIndex

      analyzeMedia(mediaFile.file)
        .then(analysis => {
          pendingAnalysisRef.current.delete(mediaFile.path)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === actualStartIndex + actualIndex ? {
                ...v,
                duration: analysis.duration,
                mediaType: analysis.mediaType,
                ...(analysis.mediaType === 'video' ? {
                  thumbnail: analysis.thumbnail,
                  isShort: analysis.isShort,
                  aspectRatio: analysis.aspectRatio
                } : {}),
                ...(analysis.mediaType === 'audio' ? {
                  audioThumbnail: analysis.audioThumbnail,
                  waveform: analysis.waveform,
                  artist: analysis.artist,
                  album: analysis.album,
                  genre: analysis.genre,
                  audioFormat: analysis.audioFormat,
                  bitrate: analysis.bitrate,
                  sampleRate: analysis.sampleRate,
                  channels: analysis.channels
                } : {})
              } : v
            )
          )
        })
        .catch(error => {
          console.error(`Failed to analyze ${mediaFile.name}:`, error)
          pendingAnalysisRef.current.delete(mediaFile.path)
        })
    })

    return { added: newMediaFiles, errors: [] }
  }, [videos.length])

  const replaceVideos = useCallback((files: File[]): { added: MediaFile[]; errors: string[] } => {
    pendingAnalysisRef.current.clear()

    const validation = validateFiles(files)
    
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      setVideos([])
      return { added: [], errors: validation.errors }
    }
    
    setValidationErrors([])

    const newMediaFiles = validation.validFiles
      .map(file => createMediaFile(file))
      .filter(Boolean)

    if (newMediaFiles.length === 0) {
      setVideos([])
      return { added: [], errors: [] }
    }

    newMediaFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }))

    newMediaFiles.forEach((mediaFile, relativeIndex) => {
      pendingAnalysisRef.current.set(mediaFile.path, { startIndex: 0, relativeIndex })
    })

    setVideos(newMediaFiles)

    newMediaFiles.forEach((mediaFile, relativeIndex) => {
      const storedRef = pendingAnalysisRef.current.get(mediaFile.path)
      const actualIndex = storedRef?.relativeIndex ?? relativeIndex

      analyzeMedia(mediaFile.file)
        .then(analysis => {
          pendingAnalysisRef.current.delete(mediaFile.path)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === actualIndex ? {
                ...v,
                duration: analysis.duration,
                mediaType: analysis.mediaType,
                ...(analysis.mediaType === 'video' ? {
                  thumbnail: analysis.thumbnail,
                  isShort: analysis.isShort,
                  aspectRatio: analysis.aspectRatio
                } : {}),
                ...(analysis.mediaType === 'audio' ? {
                  audioThumbnail: analysis.audioThumbnail,
                  waveform: analysis.waveform,
                  artist: analysis.artist,
                  album: analysis.album,
                  genre: analysis.genre,
                  audioFormat: analysis.audioFormat,
                  bitrate: analysis.bitrate,
                  sampleRate: analysis.sampleRate,
                  channels: analysis.channels
                } : {})
              } : v
            )
          )
        })
        .catch(error => {
          console.error(`Failed to analyze ${mediaFile.name}:`, error)
          pendingAnalysisRef.current.delete(mediaFile.path)
        })
    })

    return { added: newMediaFiles, errors: [] }
  }, [])

  const removeVideo = useCallback((index: number) => {
    setVideos(prevVideos => prevVideos.filter((_, i) => i !== index))
  }, [])

  const clearVideos = useCallback(() => {
    setVideos([])
  }, [])

  const updateVideoStatus = useCallback((index: number, updates: Partial<MediaFile>) => {
    setVideos(prevVideos =>
      prevVideos.map((video, i) =>
        i === index ? { ...video, ...updates } : video
      )
    )
  }, [])

  const resetVideoStatuses = useCallback(() => {
    setVideos(prevVideos =>
      prevVideos.map(video => ({
        ...video,
        status: 'pending',
        progress: 0,
        error: undefined,
        videoId: undefined
      }))
    )
  }, [])

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  return {
    videos,
    setVideos,
    addVideos,
    replaceVideos,
    removeVideo,
    clearVideos,
    updateVideoStatus,
    resetVideoStatuses,
    validationErrors,
    clearValidationErrors,
    validateFiles
  }
}