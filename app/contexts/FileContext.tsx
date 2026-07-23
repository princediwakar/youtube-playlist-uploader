'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import { useAppStore, isFileHandleSupported } from '@/app/store'
import type { MediaFile } from '@/app/types/media'
import { analyzeMedia, detectMediaType, formatFileSize, updateMediaFileWithAnalysis } from '@/app/utils/mediaHelpers'
import { v4 as uuidv4 } from 'uuid'

interface FileContextValue {
  videos: MediaFile[]
  setVideos: (videos: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => void
  addVideos: (files: File[]) => Promise<{ added: MediaFile[]; errors: string[] }>
  replaceVideos: (files: File[]) => Promise<{ added: MediaFile[]; errors: string[] }>
  removeVideo: (index: number) => void
  updateVideo: (index: number, updates: Partial<MediaFile>) => void
  resetVideoStatuses: () => void
  clearVideos: () => void
  hasStoredFiles: () => Promise<boolean>
  restoreSession: () => Promise<{ handles: unknown[] | null; metadata: unknown[] | null }>
  clearSession: () => Promise<void>
}

const FileContext = createContext<FileContextValue | null>(null)

export function FileProvider({ children }: { children: React.ReactNode }) {
  const videos = useAppStore((s) => s.videos)
  const setVideos = useAppStore((s) => s.setVideos)
  const addVideosStore = useAppStore((s) => s.addVideos)
  const removeVideo = useAppStore((s) => s.removeVideo)
  const updateVideo = useAppStore((s) => s.updateVideo)
  const resetVideoStatuses = useAppStore((s) => s.resetVideoStatuses)
  const clearVideos = useAppStore((s) => s.clearVideos)
  const hasStoredFiles = useAppStore((s) => s.hasStoredFiles)
  const restoreSession = useAppStore((s) => s.restoreSession)
  const clearSession = useAppStore((s) => s.clearSession)
  const saveFileMetadata = useAppStore((s) => s.saveFileMetadata)

  const pendingAnalysisRef = useRef<Map<string, boolean>>(new Map())

  const analyzeFiles = useCallback((filesToAnalyze: MediaFile[]) => {
    filesToAnalyze.forEach((mediaFile) => {
      if (pendingAnalysisRef.current.has(mediaFile.path)) return
      
      pendingAnalysisRef.current.set(mediaFile.path, true)
      
      const path = mediaFile.path
      const name = mediaFile.name
      analyzeMedia(mediaFile.file)
        .then((analysis) => {
          pendingAnalysisRef.current.delete(path)
          setVideos((prev) => {
            const index = prev.findIndex((v) => v.path === path)
            if (index === -1) return prev
            const updated = updateMediaFileWithAnalysis(prev[index], analysis)
            const next = [...prev]
            next[index] = updated
            return next
          })
        })
        .catch((error) => {
          console.error(`Failed to analyze ${name}:`, error)
          pendingAnalysisRef.current.delete(path)
        })
    })
  }, [setVideos])

  const createMediaFiles = useCallback((files: File[]): MediaFile[] => {
    const validFiles: MediaFile[] = []
    
    for (const file of files) {
      const mediaType = detectMediaType(file)
      if (mediaType === 'unknown') {
        console.warn(`Skipped non-media file: ${file.name}`)
        continue
      }

      const fullPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      const pathParts = fullPath.split('/')
      const fileName = pathParts[pathParts.length - 1]
      const folderPath = pathParts.slice(0, -1).join('/')
      const rootFolder = pathParts[0] || 'Root'

      const mediaFile: MediaFile = {
        file,
        name: fileName.replace(/\.[^/.]+$/, ''),
        size: formatFileSize(file.size),
        path: fullPath,
        relativePath: folderPath,
        folder: rootFolder,
        status: 'pending',
        progress: 0,
        mediaType,
      } as MediaFile

      validFiles.push(mediaFile)
    }

    return validFiles
  }, [])

  const saveFileMetadataForFiles = useCallback(async (mediaFiles: MediaFile[]) => {
    if (isFileHandleSupported) {
      return
    } else {
      const fileMetadata = mediaFiles.map((mf) => ({
        id: uuidv4(),
        metadata: {
          name: mf.name,
          size: mf.file.size,
          path: mf.path,
          folder: mf.folder,
        },
      }))
      await saveFileMetadata(fileMetadata)
    }
  }, [saveFileMetadata])

  const addVideos = useCallback(async (files: File[]): Promise<{ added: MediaFile[]; errors: string[] }> => {
    const mediaFiles = createMediaFiles(files)
    
    if (mediaFiles.length === 0) {
      return { added: [], errors: ['No valid media files found'] }
    }

    mediaFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }))

    addVideosStore(mediaFiles)
    analyzeFiles(mediaFiles)
    await saveFileMetadataForFiles(mediaFiles)

    return { added: mediaFiles, errors: [] }
  }, [addVideosStore, analyzeFiles, createMediaFiles, saveFileMetadataForFiles])

  const replaceVideos = useCallback(async (files: File[]): Promise<{ added: MediaFile[]; errors: string[] }> => {
    pendingAnalysisRef.current.clear()
    clearVideos()

    const mediaFiles = createMediaFiles(files)
    
    if (mediaFiles.length === 0) {
      return { added: [], errors: [] }
    }

    mediaFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }))

    setVideos(mediaFiles)
    analyzeFiles(mediaFiles)
    await saveFileMetadataForFiles(mediaFiles)

    return { added: mediaFiles, errors: [] }
  }, [clearVideos, setVideos, analyzeFiles, createMediaFiles, saveFileMetadataForFiles])

  const value: FileContextValue = {
    videos,
    setVideos,
    addVideos,
    replaceVideos,
    removeVideo,
    updateVideo,
    resetVideoStatuses,
    clearVideos,
    hasStoredFiles,
    restoreSession,
    clearSession,
  }

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  )
}

export function useFileContext(): FileContextValue {
  const ctx = useContext(FileContext)
  if (!ctx) {
    throw new Error('useFileContext must be used within a FileProvider')
  }
  return ctx
}