'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MediaFile, UploadSettings } from '@/app/types/video'
import { generateTitle, getBasename } from '@/app/utils/videoHelpers'

export function useVideoProcessing() {
  const { data: session } = useSession()

  // Ref for aborting requests
  const abortControllerRef = useRef<AbortController | null>(null)
  const isProcessingRef = useRef(false)

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

  // Cancel any ongoing processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    isProcessingRef.current = false
    setAiProcessing(prev => ({
      ...prev,
      playlistAnalysis: false,
      videoAnalysis: false,
      currentVideoAnalysis: null
    }))
    setPreProcessingStatus({
      isPreProcessing: false,
      currentStep: '',
      progress: 0,
      totalSteps: 0
    })
  }, [])

  // Generate playlist description
  const generatePlaylistDescription = useCallback(async (videos: MediaFile[], uploadSettings: UploadSettings) => {
    const folderName = videos.length > 0 ? videos[0].folder : ''
    const fileNames = videos.map(v => getBasename(v.file.name))

    // Use AI for playlist description if enabled
    if (uploadSettings.useAiAnalysis) {
      try {
        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        setAiProcessing(prev => ({ ...prev, playlistAnalysis: true }))

        const response = await fetch('/api/youtube/analyze-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderName,
            fileNames
          }),
          signal
        })

        if (signal.aborted) return ''

        if (response.ok) {
          const { description } = await response.json()
          setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
          return description
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Playlist description request cancelled')
          return ''
        }
        console.error('Failed to get AI playlist description:', error)
        setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
      }
    }

    // Fallback to basic description
    return ''
  }, [])

  // Suggest category based on video content
  const suggestCategory = useCallback(async (videos: MediaFile[], signal?: AbortSignal) => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (signal?.aborted) return null
      abortControllerRef.current = new AbortController()
      const combinedSignal = signal 
        ? AbortSignal.any([signal, abortControllerRef.current.signal])
        : abortControllerRef.current.signal

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
        }),
        signal: combinedSignal
      })

      if (combinedSignal.aborted) return null

      if (response.ok) {
        const { suggestedCategory } = await response.json()
        setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
        return suggestedCategory
      }

      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
      return null
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Category suggestion request cancelled')
        return null
      }
      console.error('Failed to get category suggestion:', error)
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
      return null
    }
  }, [])

  // Pre-process videos (generate metadata, AI analysis, etc.)
  const preProcessVideos = useCallback(async (
    videos: MediaFile[],
    uploadSettings: UploadSettings,
    onVideoProcessed?: (video: MediaFile, metadata: any) => void,
    signal?: AbortSignal
  ): Promise<Array<{
    video: MediaFile
    metadata: {
      title: string
      description: string
      tags: string[]
      category: string
    }
  }>> => {
    // Check if already aborted
    if (signal?.aborted) {
      return []
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const combinedSignal = signal 
      ? AbortSignal.any([signal, abortControllerRef.current.signal])
      : abortControllerRef.current.signal
    
    isProcessingRef.current = true

    const totalSteps = videos.length + 2 // +2 for category suggestion and playlist description
    let currentStep = 0

    setPreProcessingStatus({
      isPreProcessing: true,
      currentStep: 'Starting pre-processing...',
      progress: 0,
      totalSteps
    })

    const processedVideos: Array<{
      video: MediaFile
      metadata: {
        title: string
        description: string
        tags: string[]
        category: string
      }
    }> = []

    try {
      // Step 1: Category suggestion (once for all videos)
      if (uploadSettings.category === '27' && !uploadSettings.useExistingPlaylist && !combinedSignal.aborted) {
        setPreProcessingStatus(prev => ({
          ...prev,
          currentStep: 'Analyzing content for category suggestion...',
          progress: (currentStep / totalSteps) * 100
        }))

        const suggestedCategory = await suggestCategory(videos, combinedSignal)
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
        if (combinedSignal.aborted) break

        const chunkPromises = chunk.map(async (video) => {
          if (combinedSignal.aborted) return null
          
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

            // Common data for both AI and non-AI
            const allFileNames = videos.map(v => getBasename(v.file.name))
            const folderName = videos.length > 0 ? videos[0].folder : ''

            if (uploadSettings.useAiAnalysis) {
              // AI analysis for this video
              setAiProcessing(prev => ({
                ...prev,
                videoAnalysis: true,
                currentVideoAnalysis: video.name
              }))

              const response = await fetch('/api/youtube/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  folderName,
                  allFileNames,
                  currentFileName: getBasename(video.file.name),
                  relativePath: video.relativePath,
                  titleFormat: uploadSettings.titleFormat,
                  customTitlePrefix: uploadSettings.customTitlePrefix,
                  customTitleSuffix: uploadSettings.customTitleSuffix
                }),
                signal: combinedSignal
              })

              if (combinedSignal.aborted) return null

              if (response.ok) {
                const aiResult = await response.json()
                metadata = {
                  title: aiResult.title,
                  description: aiResult.description,
                  tags: aiResult.tags,
                  category: video.mediaType === 'audio' ? uploadSettings.audioCategory : aiResult.category
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
              // AI analysis disabled - provide empty description, empty tags, and user-selected category
              const tags = []
              let finalCategory = video.mediaType === 'audio' ? uploadSettings.audioCategory : uploadSettings.category

              metadata = {
                title: generateTitle(getBasename(video.file.name), uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
                description: '',
                tags,
                category: finalCategory
              }
            }

            // Notify parent component if callback provided
            if (onVideoProcessed) {
              onVideoProcessed(video, metadata)
            }

            return { video, metadata }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return null
            }
            console.error(`Failed to process ${video.name}:`, error)
            // Return fallback metadata
            const fallbackMetadata = {
              title: generateTitle(getBasename(video.file.name), uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
              description: '',
              tags: [],
              category: video.mediaType === 'audio' ? uploadSettings.audioCategory : uploadSettings.category
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
        processedVideos.push(...chunkResults.filter(Boolean))
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Pre-processing cancelled')
        return []
      }
      console.error('Pre-processing failed:', error)
      throw error
    } finally {
      isProcessingRef.current = false
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
    setAiProcessingState,
    cancelProcessing
  }
}