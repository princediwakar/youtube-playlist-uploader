'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { VideoFile, UploadSettings } from '@/app/types/video'
import { generateTitle, generateFallbackDescription, generateBasicTags } from '@/app/utils/videoHelpers'

export function useVideoProcessing() {
  const { data: session } = useSession()

  // Pre-processing status
  const [preProcessingStatus, setPreProcessingStatus] = useState({
    isPreProcessing: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0
  })

  // AI Processing status
  const [aiProcessing, setAiProcessing] = useState({
    categoryAnalysis: false,
    playlistAnalysis: false,
    videoAnalysis: false,
    currentVideoAnalysis: null as string | null,
    addingNavigation: false
  })

  // Generate playlist description
  const generatePlaylistDescription = useCallback(async (videos: VideoFile[], uploadSettings: UploadSettings) => {
    const folderName = videos.length > 0 ? videos[0].folder : ''
    const fileNames = videos.map(v => v.file.name)

    // Use AI for playlist description if enabled
    if (uploadSettings.useAiAnalysis) {
      try {
        setAiProcessing(prev => ({ ...prev, playlistAnalysis: true }))

        const response = await fetch('/api/youtube/analyze-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderName,
            fileNames
          })
        })

        if (response.ok) {
          const { description } = await response.json()
          setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
          return description
        }
      } catch (error) {
        console.error('Failed to get AI playlist description:', error)
        setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
      }
    }

    // Fallback to basic description
    const cleanFolderName = folderName.replace(/^\d+[\.\-_\s]*/, '').trim()
    return `🎯 ${cleanFolderName || 'Complete Course'}

Collection of ${videos.length} educational videos covering key concepts and strategies.

📚 WHAT'S INCLUDED:
${videos.slice(0, 5).map((v, i) => `${i + 1}. ${v.name.replace(/^\d+[\.\-_\s]*/, '').replace(/\.[^/.]+$/, '')}`).join('\n')}${videos.length > 5 ? `\n...and ${videos.length - 5} more videos` : ''}

💡 PERFECT FOR: Professionals and students looking to expand their knowledge

🔥 WATCH IN ORDER for the best learning experience

#Education #Learning #Professional`
  }, [])

  // Suggest category based on video content
  const suggestCategory = useCallback(async (videos: VideoFile[]) => {
    try {
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: true }))

      const fileNames = videos.map(v => v.file.name)
      const folderName = videos.length > 0 ? videos[0].folder : ''
      const relativePaths = videos.map(v => v.relativePath)

      const response = await fetch('/api/youtube/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName,
          fileNames,
          relativePaths
        })
      })

      if (response.ok) {
        const { suggestedCategory } = await response.json()
        setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
        return suggestedCategory
      }

      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
      return null
    } catch (error) {
      console.error('Failed to get category suggestion:', error)
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
      return null
    }
  }, [])

  // Pre-process videos (generate metadata, AI analysis, etc.)
  const preProcessVideos = useCallback(async (
    videos: VideoFile[],
    uploadSettings: UploadSettings,
    onVideoProcessed?: (video: VideoFile, metadata: any) => void
  ): Promise<Array<{
    video: VideoFile
    metadata: {
      title: string
      description: string
      tags: string[]
      category: string
    }
  }>> => {
    const totalSteps = videos.length + 2 // +2 for category suggestion and playlist description
    let currentStep = 0

    setPreProcessingStatus({
      isPreProcessing: true,
      currentStep: 'Starting pre-processing...',
      progress: 0,
      totalSteps
    })

    const processedVideos: Array<{
      video: VideoFile
      metadata: {
        title: string
        description: string
        tags: string[]
        category: string
      }
    }> = []

    try {
      // Step 1: Category suggestion (once for all videos)
      if (uploadSettings.category === '27' && !uploadSettings.useExistingPlaylist) {
        setPreProcessingStatus(prev => ({
          ...prev,
          currentStep: 'Analyzing content for category suggestion...',
          progress: (currentStep / totalSteps) * 100
        }))

        const suggestedCategory = await suggestCategory(videos)
        if (suggestedCategory && suggestedCategory !== '27') {
          // Note: We don't update uploadSettings here, just use the suggested category for processed videos
          // The parent component should handle updating uploadSettings if needed
        }
        currentStep++
      }

      // Step 2: Process each video in parallel (with concurrency limit)
      const concurrencyLimit = 3
      const chunks = []
      for (let i = 0; i < videos.length; i += concurrencyLimit) {
        chunks.push(videos.slice(i, i + concurrencyLimit))
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (video) => {
          setPreProcessingStatus(prev => ({
            ...prev,
            currentStep: `Processing metadata for: ${video.name}`,
            progress: (currentStep / totalSteps) * 100
          }))

          try {
            let metadata: {
              title: string
              description: string
              tags: string[]
              category: string
            }

            if (uploadSettings.useAiAnalysis) {
              // AI analysis for this video
              const allFileNames = videos.map(v => v.file.name)
              setAiProcessing(prev => ({
                ...prev,
                videoAnalysis: true,
                currentVideoAnalysis: video.name
              }))

              const response = await fetch('/api/youtube/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  folderName: videos.length > 0 ? videos[0].folder : '',
                  allFileNames,
                  currentFileName: video.file.name,
                  relativePath: video.relativePath,
                  titleFormat: uploadSettings.titleFormat,
                  customTitlePrefix: uploadSettings.customTitlePrefix,
                  customTitleSuffix: uploadSettings.customTitleSuffix
                })
              })

              if (response.ok) {
                const aiResult = await response.json()
                metadata = {
                  title: aiResult.title,
                  description: aiResult.description,
                  tags: aiResult.tags,
                  category: aiResult.category
                }
              } else {
                throw new Error('AI analysis failed')
              }

              setAiProcessing(prev => ({
                ...prev,
                videoAnalysis: false,
                currentVideoAnalysis: null
              }))
            } else {
              // Basic metadata generation
              metadata = {
                title: generateTitle(video.file.name, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
                description: generateFallbackDescription(video.file.name, videos.length > 0 ? videos[0].folder : '', video.relativePath),
                tags: generateBasicTags(video.file.name, videos.length > 0 ? videos[0].folder : ''),
                category: uploadSettings.category
              }
            }

            // Notify parent component if callback provided
            if (onVideoProcessed) {
              onVideoProcessed(video, metadata)
            }

            return { video, metadata }
          } catch (error) {
            console.error(`Failed to process ${video.name}:`, error)
            // Return fallback metadata
            const fallbackMetadata = {
              title: generateTitle(video.file.name, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
              description: generateFallbackDescription(video.file.name, videos.length > 0 ? videos[0].folder : '', video.relativePath),
              tags: generateBasicTags(video.file.name, videos.length > 0 ? videos[0].folder : ''),
              category: uploadSettings.category
            }

            if (onVideoProcessed) {
              onVideoProcessed(video, fallbackMetadata)
            }

            return {
              video,
              metadata: fallbackMetadata
            }
          }
        })

        const chunkResults = await Promise.all(chunkPromises)
        processedVideos.push(...chunkResults)
        currentStep += chunk.length

        setPreProcessingStatus(prev => ({
          ...prev,
          progress: (currentStep / totalSteps) * 100
        }))
      }

      setPreProcessingStatus(prev => ({
        ...prev,
        currentStep: 'Pre-processing completed!',
        progress: 100
      }))

      return processedVideos
    } catch (error) {
      console.error('Pre-processing failed:', error)
      throw error
    } finally {
      setPreProcessingStatus({
        isPreProcessing: false,
        currentStep: '',
        progress: 0,
        totalSteps: 0
      })
      setAiProcessing(prev => ({
        ...prev,
        videoAnalysis: false,
        currentVideoAnalysis: null
      }))
    }
  }, [suggestCategory])

  // Update AI processing state (for external control)
  const setAiProcessingState = useCallback((updates: Partial<typeof aiProcessing>) => {
    setAiProcessing(prev => ({ ...prev, ...updates }))
  }, [])

  return {
    // State
    preProcessingStatus,
    aiProcessing,

    // Functions
    preProcessVideos,
    generatePlaylistDescription,
    suggestCategory,
    setAiProcessingState
  }
}