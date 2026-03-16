'use client'

import { useState, useCallback } from 'react'
import { MediaFile } from '@/app/types/video'
import { formatFileSize } from '@/app/utils/videoHelpers'
import { analyzeMedia } from '@/app/utils/mediaHelpers'

export function useFileHandling() {
  const [videos, setVideos] = useState<MediaFile[]>([])

  const addVideos = useCallback((files: File[]) => {
    const newVideos: MediaFile[] = []

    files.forEach(file => {
      // Check if it's a video or audio file
      const isVideo = file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)
      const isAudio = file.type.startsWith('audio/') ||
          file.name.match(/\.(mp3|wav|m4a|flac|ogg|aac|wma|opus|aiff|alac)$/i)

      if (isVideo || isAudio) {

        // Extract path information
        const fullPath = (file as any).webkitRelativePath || file.name
        const pathParts = fullPath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const rootFolder = pathParts[0] || 'Root'

        // Determine media type
        const isVideo = file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)

        newVideos.push({
          file,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          size: formatFileSize(file.size),
          path: fullPath,
          relativePath: folderPath,
          folder: rootFolder,
          status: 'pending',
          progress: 0,
          mediaType: isVideo ? 'video' : 'audio' // Will be updated properly after analysis
        })
      }
    })

    if (newVideos.length === 0) return []

    // Sort videos by path for logical order
    newVideos.sort((a, b) => a.path.localeCompare(b.path))

    // Add new videos to state and analyze them
    setVideos(prevVideos => {
      const updatedVideos = [...prevVideos, ...newVideos]
      const startIndex = prevVideos.length

      // Start analysis for each new media file
      newVideos.forEach(async (video, relativeIndex) => {
        try {
          const analysis = await analyzeMedia(video.file)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === startIndex + relativeIndex ? {
                ...v,
                duration: analysis.duration,
                // Video-specific properties
                ...(video.mediaType === 'video' ? {
                  thumbnail: analysis.thumbnail,
                  isShort: analysis.isShort,
                  aspectRatio: analysis.aspectRatio
                } : {}),
                // Audio-specific properties
                ...(video.mediaType === 'audio' ? {
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
        } catch (error) {
          console.error(`Failed to analyze ${video.mediaType} ${video.name}:`, error)
        }
      })

      return updatedVideos
    })

    return newVideos
  }, [])

  const replaceVideos = useCallback((files: File[]) => {
    const newVideos: MediaFile[] = []

    files.forEach(file => {
      // Check if it's a video or audio file
      const isVideo = file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)
      const isAudio = file.type.startsWith('audio/') ||
          file.name.match(/\.(mp3|wav|m4a|flac|ogg|aac|wma|opus|aiff|alac)$/i)

      if (isVideo || isAudio) {

        // Extract path information
        const fullPath = (file as any).webkitRelativePath || file.name
        const pathParts = fullPath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const rootFolder = pathParts[0] || 'Root'

        // Determine media type
        const isVideo = file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)

        newVideos.push({
          file,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          size: formatFileSize(file.size),
          path: fullPath,
          relativePath: folderPath,
          folder: rootFolder,
          status: 'pending',
          progress: 0,
          mediaType: isVideo ? 'video' : 'audio' // Will be updated properly after analysis
        })
      }
    })

    if (newVideos.length === 0) {
      setVideos([])
      return []
    }

    // Sort videos by path for logical order
    newVideos.sort((a, b) => a.path.localeCompare(b.path))

    // Replace all videos and analyze them
    setVideos(() => {
      const startIndex = 0

      // Start analysis for each media file
      newVideos.forEach(async (video, relativeIndex) => {
        try {
          const analysis = await analyzeMedia(video.file)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === startIndex + relativeIndex ? {
                ...v,
                duration: analysis.duration,
                // Video-specific properties
                ...(video.mediaType === 'video' ? {
                  thumbnail: analysis.thumbnail,
                  isShort: analysis.isShort,
                  aspectRatio: analysis.aspectRatio
                } : {}),
                // Audio-specific properties
                ...(video.mediaType === 'audio' ? {
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
        } catch (error) {
          console.error(`Failed to analyze ${video.mediaType} ${video.name}:`, error)
        }
      })

      return newVideos
    })

    return newVideos
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

  return {
    videos,
    setVideos,
    addVideos,
    replaceVideos,
    removeVideo,
    clearVideos,
    updateVideoStatus,
    resetVideoStatuses
  }
}