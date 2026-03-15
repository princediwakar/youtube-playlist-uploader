'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FolderOpen } from 'lucide-react'
import { VideoFile } from '@/app/types/video'

interface VideoDropzoneProps {
  onDrop: (files: File[]) => void
  disabled?: boolean
}

export function VideoDropzone({ onDrop, disabled = false }: VideoDropzoneProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles)
  }, [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv']
    },
    maxSize: 10 * 1024 * 1024 * 1024, // 10GB max file size
    multiple: true,
    disabled
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
          {isDragActive ? (
            <FolderOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          ) : (
            <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {isDragActive ? 'Drop your videos here' : 'Drag & drop your videos here'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload MP4, MOV, AVI, MKV, WEBM, FLV, or WMV files up to 10GB each.
          </p>
          <button
            type="button"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            Select Video Files
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            You can upload multiple videos at once. Each video will be analyzed before upload.
          </p>
        </div>
      </div>
    </div>
  )
}