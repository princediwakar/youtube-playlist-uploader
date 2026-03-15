'use client'

import { useState, useCallback } from 'react'
import { VideoFile } from '@/app/types/video'
import { formatFileSize, analyzeVideo } from '@/app/utils/videoHelpers'

export function useFileHandling() {
  const [videos, setVideos] = useState<VideoFile[]>([])

  const addVideos = useCallback((files: File[]) => {
    const newVideos: VideoFile[] = []

    files.forEach(file => {
      // Check if it's a video file
      if (file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)) {

        // Extract path information
        const fullPath = (file as any).webkitRelativePath || file.name
        const pathParts = fullPath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const rootFolder = pathParts[0] || 'Root'

        newVideos.push({
          file,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          size: formatFileSize(file.size),
          path: fullPath,
          relativePath: folderPath,
          folder: rootFolder,
          status: 'pending',
          progress: 0
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

      // Start analysis for each new video
      newVideos.forEach(async (video, relativeIndex) => {
        try {
          const analysis = await analyzeVideo(video.file)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === startIndex + relativeIndex ? {
                ...v,
                thumbnail: analysis.thumbnail,
                isShort: analysis.isShort,
                duration: analysis.duration,
                aspectRatio: analysis.aspectRatio
              } : v
            )
          )
        } catch (error) {
          console.error(`Failed to analyze video ${video.name}:`, error)
        }
      })

      return updatedVideos
    })

    return newVideos
  }, [])

  const replaceVideos = useCallback((files: File[]) => {
    const newVideos: VideoFile[] = []

    files.forEach(file => {
      // Check if it's a video file
      if (file.type.startsWith('video/') ||
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)) {

        // Extract path information
        const fullPath = (file as any).webkitRelativePath || file.name
        const pathParts = fullPath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const rootFolder = pathParts[0] || 'Root'

        newVideos.push({
          file,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          size: formatFileSize(file.size),
          path: fullPath,
          relativePath: folderPath,
          folder: rootFolder,
          status: 'pending',
          progress: 0
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

      // Start analysis for each video
      newVideos.forEach(async (video, relativeIndex) => {
        try {
          const analysis = await analyzeVideo(video.file)
          setVideos(currentVideos =>
            currentVideos.map((v, i) =>
              i === startIndex + relativeIndex ? {
                ...v,
                thumbnail: analysis.thumbnail,
                isShort: analysis.isShort,
                duration: analysis.duration,
                aspectRatio: analysis.aspectRatio
              } : v
            )
          )
        } catch (error) {
          console.error(`Failed to analyze video ${video.name}:`, error)
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

  const updateVideoStatus = useCallback((index: number, updates: Partial<VideoFile>) => {
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