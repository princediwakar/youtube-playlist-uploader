import { MediaFile } from '@/app/types/video'

// Cross-platform basename extraction (works in browser and Node.js)
export function getBasename(filename: string): string {
  // Handle both forward and backward slashes
  const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
  return lastSlash === -1 ? filename : filename.substring(lastSlash + 1)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function extractPlaylistName(filename: string): string {
  // Remove common prefixes and numbering
  let name = filename.replace(/^\d+[\.\-_]?\s*/, '')

  // Extract meaningful part (before common separators)
  const parts = name.split(/[\-_\.]/)
  if (parts.length > 1) {
    return parts.slice(0, Math.ceil(parts.length / 2)).join(' ')
  }

  return name || 'My Video Collection'
}

export function cleanTitle(title: string): string {
  if (!title || title.trim() === '') {
    return 'Untitled Video'
  }

  // Remove file extensions and clean up numbering
  let cleaned = title
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/^\d+[\.\-_]?\s*/, '') // Remove leading numbers
    .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // If cleaned title is empty, use original without extension
  if (!cleaned) {
    cleaned = title.replace(/\.[^/.]+$/, '').trim()
  }

  // Final fallback
  return cleaned || 'Untitled Video'
}

export function generateTitle(
  filename: string,
  format: string,
  prefix: string,
  suffix: string
): string {
  let baseTitle = filename.replace(/\.[^/.]+$/, '') // Remove extension

  switch (format) {
    case 'original':
      // Use original filename as-is (minus extension)
      break
    case 'cleaned':
      // Clean up the filename
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers
        .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      break
    case 'custom':
      // Clean the base title first
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '')
        .replace(/[\-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      baseTitle = `${prefix}${baseTitle}${suffix}`
      break
  }

  // Apply YouTube constraints
  let title = baseTitle
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()

  // Ensure max length
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }

  return title || 'Untitled Video'
}

export function cleanTitleForYoutube(filename: string): string {
  return generateTitle(filename, 'original', '', '')
}

export function normalizeTitleForComparison(title: string): string {
  if (!title) return ''
  let normalized = title
  
  // 1. Decode basic HTML entities that YouTube API might return
  normalized = normalized.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
  // 2. Remove common video extensions (in case they were uploaded with 'original' format)
  normalized = normalized.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, '')
  
  // 3. Trim and lowercase
  return normalized.trim().toLowerCase()
}

export function checkForDuplicateVideos(
  videos: MediaFile[],
  existingVideos: Array<{videoId: string, title: string, position: number}>,
  titleFormat: string,
  customTitlePrefix: string,
  customTitleSuffix: string
): MediaFile[] {
  if (existingVideos.length === 0) return videos

  return videos.filter(video => {
    // Use basename for consistency with upload route
    const basename = getBasename(video.file.name)
    const videoTitle = generateTitle(basename, titleFormat, customTitlePrefix, customTitleSuffix)

    // Check for exact title match using normalized comparison
    const isDuplicate = existingVideos.some(existing => {
      const existingTitle = normalizeTitleForComparison(existing.title)
      const newTitle = normalizeTitleForComparison(videoTitle)
      return existingTitle === newTitle
    })

    if (isDuplicate) {
      console.log(`Skipping duplicate video: ${videoTitle} (filename: ${basename})`)
    }

    return !isDuplicate
  })
}

export function calculateInsertionPositions(
  videos: MediaFile[],
  existingVideos: Array<{videoId: string, title: string, position: number}>,
  titleFormat: string,
  customTitlePrefix: string,
  customTitleSuffix: string
): number[] {
  if (existingVideos.length === 0) {
    // New playlist: positions start from 0
    return videos.map((_, index) => index)
  }

  // Generate titles for all folder videos (use basename for consistency)
  const videoTitles = videos.map(video => {
    const basename = getBasename(video.file.name)
    const generated = generateTitle(basename, titleFormat, customTitlePrefix, customTitleSuffix)
    return normalizeTitleForComparison(generated)
  })

  // Map existing videos by title (normalized)
  const existingByTitle = new Map<string, {position: number, index: number}>()
  existingVideos.forEach(existing => {
    const title = normalizeTitleForComparison(existing.title)
    existingByTitle.set(title, {position: existing.position, index: -1})
  })

  // Find which folder videos already exist in playlist
  const targetPositions = new Array(videos.length).fill(-1)
  for (let i = 0; i < videos.length; i++) {
    const title = videoTitles[i]
    const existing = existingByTitle.get(title)
    if (existing) {
      targetPositions[i] = existing.position
    }
  }

  // Verify that existing videos are in monotonic order relative to folder order
  let lastPosition = -1
  let monotonic = true
  for (let i = 0; i < videos.length; i++) {
    if (targetPositions[i] !== -1) {
      if (targetPositions[i] < lastPosition) {
        // Existing video appears earlier in playlist than previous existing video (out of order)
        monotonic = false
        break
      }
      lastPosition = targetPositions[i]
    }
  }

  if (!monotonic) {
    console.log('Existing playlist videos are not in monotonic order relative to folder. Appending new videos to end.')
    return videos.map((_, index) => existingVideos.length + index)
  }

  // Fill missing positions preserving folder order
  let currentPos = 0
  const finalPositions = new Array(videos.length).fill(-1)
  for (let i = 0; i < videos.length; i++) {
    if (targetPositions[i] !== -1) {
      finalPositions[i] = targetPositions[i]
      currentPos = targetPositions[i] + 1
    } else {
      finalPositions[i] = currentPos
      currentPos++
    }
  }

  // Ensure positions are unique and increasing (should be by construction)
  console.log('Inserting videos at calculated positions to maintain folder order.')
  return finalPositions
}
export function analyzeVideo(file: File): Promise<{
    thumbnail: string
    isShort: boolean
    duration: number
    aspectRatio: number
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        // Set canvas size
        canvas.width = 160
        canvas.height = 90
        
        // Seek to 10% of video duration for a representative frame
        video.currentTime = Math.min(video.duration * 0.1, 2)
      }
      
      video.oncanplay = () => {
        // Draw video frame to canvas
        context?.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        
        // Calculate aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight
        
        // Detect if it's a Short:
        // - Duration <= 60 seconds
        // - Vertical or square aspect ratio (≤ 1.0)
        const isShort = video.duration <= 60 && aspectRatio <= 1.0
        
        resolve({
          thumbnail,
          isShort,
          duration: video.duration,
          aspectRatio
        })
        
        // Clean up
        URL.revokeObjectURL(video.src)
      }
      
      video.onerror = () => {
        // Return defaults if analysis fails
        resolve({
          thumbnail: '',
          isShort: false,
          duration: 0,
          aspectRatio: 16/9
        })
        URL.revokeObjectURL(video.src)
      }
      
      video.src = URL.createObjectURL(file)
    })
  }

