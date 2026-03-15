import { VideoFile } from '@/app/types/video'

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

export function cleanAIGeneratedTitle(aiTitle: string, originalFileName: string): string {
  if (!aiTitle || aiTitle.trim() === '') {
    return generateTitle(originalFileName, 'original', '', '')
  }

  // Remove any folder paths that might have been included by AI
  let cleaned = aiTitle
    .replace(/^.*[\/\\]/, '') // Remove everything before the last slash/backslash
    .replace(/\.[^/.]+$/, '') // Remove file extensions
    .trim()

  // If the AI title contains a forward slash, it might be a path - extract only the filename part
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    cleaned = parts[parts.length - 1].trim()
  }

  // Apply YouTube title constraints
  cleaned = cleaned
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()

  // Ensure max length
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 97) + '...'
  }

  return cleaned || generateTitle(originalFileName, 'original', '', '')
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

export function generateIntelligentContent(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  relativePath: string
): { description: string; tags: string[]; suggestedCategory: string } {
  // Extract key information
  const currentIndex = allFileNames.findIndex(name => name === currentFileName)
  const totalVideos = allFileNames.length
  const videoNumber = currentIndex + 1

  // Analyze content theme
  const allText = `${folderName} ${allFileNames.join(' ')} ${relativePath}`.toLowerCase()
  const cleanCurrentName = currentFileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  const cleanFolderName = folderName.replace(/^\d+[\.\-_\s]*/, '').trim()

  // Extract meaningful keywords from file names
  const keywords = extractKeywords(allFileNames)

  // Advanced content analysis
  let contentTheme = ''
  let specificDescription = ''
  let specificTags: string[] = []
  let primaryTopic = 'education'

  // Growth Loop Analysis
  if (allText.includes('growth') && allText.includes('loop')) {
    contentTheme = 'Growth Loop Strategy'
    if (cleanCurrentName.toLowerCase().includes('fewer') || cleanCurrentName.toLowerCase().includes('better')) {
      specificDescription = 'Learn why focusing on fewer, better growth loops is more effective than trying to optimize everything at once. Discover the framework for identifying and prioritizing the growth loops that will have the biggest impact on your business.'
    } else if (cleanCurrentName.toLowerCase().includes('building') || cleanCurrentName.toLowerCase().includes('first')) {
      specificDescription = 'Master the fundamentals of building your first growth loop from scratch. Learn the essential components, common pitfalls, and proven strategies that successful companies use to create sustainable growth mechanisms.'
    } else {
      specificDescription = 'Understand the strategic approach to building sustainable growth loops that compound over time. Learn how to identify opportunities, design effective loops, and measure what matters.'
    }
    specificTags = ['growthhacking', 'businessstrategy', 'userretention', 'acquisition', 'scalablegrowth']
    primaryTopic = 'business'
  }
  // Retention Analysis
  else if (allText.includes('retention') || allText.includes('engagement')) {
    contentTheme = 'User Retention & Engagement'
    if (cleanCurrentName.toLowerCase().includes('top') || cleanCurrentName.toLowerCase().includes('%')) {
      specificDescription = 'Discover what separates the top-performing companies when it comes to user retention. Learn the specific metrics, strategies, and frameworks that drive exceptional retention rates.'
    } else {
      specificDescription = 'Learn data-driven strategies to increase user retention and build products that users can\'t stop using. Understand the psychology behind user engagement and retention.'
    }
    specificTags = ['userretention', 'productmetrics', 'engagement', 'churnreduction', 'productgrowth']
    primaryTopic = 'business'
  }
  // Programming/Tech Analysis
  else if (allText.includes('programming') || allText.includes('coding') || allText.includes('development')) {
    contentTheme = 'Programming & Development'
    specificDescription = 'Build your programming skills with practical, hands-on examples and real-world applications. Learn best practices, common patterns, and advanced techniques.'
    specificTags = ['programming', 'coding', 'development', 'softwareengineering', 'bestpractices']
    primaryTopic = 'tech'
  }
  // Business/Marketing Analysis
  else if (allText.includes('business') || allText.includes('marketing')) {
    contentTheme = 'Business Strategy'
    specificDescription = 'Learn proven business strategies and marketing tactics used by successful companies. Get actionable insights you can apply immediately.'
    specificTags = ['businessstrategy', 'marketing', 'entrepreneurship', 'startup', 'strategy']
    primaryTopic = 'business'
  }
  // Default educational content
  else {
    contentTheme = 'Educational Content'
    specificDescription = 'Comprehensive educational content designed to build your knowledge and skills step by step.'
    specificTags = ['education', 'learning', 'tutorial', 'guide', 'training']
    primaryTopic = 'education'
  }

  // Build description
  let description = `${cleanCurrentName}\n\n`

  // Add series context if multiple videos
  if (totalVideos > 1) {
    description += `📹 Part ${videoNumber} of ${totalVideos} • ${contentTheme}\n\n`
  }

  // Add section context
  if (relativePath && relativePath !== '') {
    const pathParts = relativePath.split('/').filter(p => p.length > 0)
    if (pathParts.length > 0) {
      const cleanPath = pathParts.map(part => part.replace(/^\d+[\.\-_\s]*/, '').trim()).join(' → ')
      description += `📂 MODULE: ${cleanPath}\n\n`
    }
  }

  // Add specific description
  description += `${specificDescription}\n\n`

  // Add specific learning outcomes based on content
  if (contentTheme.includes('Growth Loop')) {
    description += `🎯 YOU'LL LEARN:\n`
    description += `• How to identify high-impact growth opportunities\n`
    description += `• Framework for building sustainable growth loops\n`
    description += `• Common mistakes and how to avoid them\n`
    description += `• Metrics and measurement strategies\n\n`
  } else if (contentTheme.includes('Retention')) {
    description += `📊 YOU'LL LEARN:\n`
    description += `• Key retention metrics that matter most\n`
    description += `• Psychology of user engagement\n`
    description += `• Proven retention improvement strategies\n`
    description += `• How to measure and optimize retention\n\n`
  } else {
    description += `💡 KEY TAKEAWAYS:\n`
    description += `• Practical strategies you can implement today\n`
    description += `• Real-world examples and case studies\n`
    description += `• Step-by-step frameworks and methodologies\n\n`
  }

  // Add course context if it's part of a series
  if (cleanFolderName && totalVideos > 1) {
    description += `📚 COURSE: ${cleanFolderName}\n\n`
  }

  // Generate relevant hashtags based on content
  const relevantHashtags: string[] = []
  if (contentTheme.includes('Growth')) {
    relevantHashtags.push('#GrowthHacking', '#BusinessGrowth', '#StartupStrategy')
  } else if (contentTheme.includes('Retention')) {
    relevantHashtags.push('#UserRetention', '#ProductStrategy', '#Engagement')
  } else if (contentTheme.includes('Programming')) {
    relevantHashtags.push('#Programming', '#Coding', '#SoftwareDevelopment')
  } else {
    relevantHashtags.push('#Education', '#Learning', '#Professional')
  }

  description += relevantHashtags.join(' ')

  // Generate comprehensive tags (remove duplicates)
  const baseTags = specificTags.slice(0, 6) // Use specific tags as base
  const keywordTags = keywords.slice(0, 3)
  const allTags = [...new Set([...baseTags, ...keywordTags, primaryTopic])].slice(0, 10)

  // Detect the most appropriate YouTube category
  const suggestedCategory = detectCategoryFromContent(folderName, allFileNames, relativePath)

  return {
    description,
    tags: allTags,
    suggestedCategory
  }
}

export function extractKeywords(fileNames: string[]): string[] {
  const allText = fileNames.join(' ').toLowerCase()
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'video', 'mp4', 'mov', 'avi']

  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .filter(word => !/^\d+$/.test(word)) // Remove pure numbers

  // Count frequency and return most common
  const frequency: { [key: string]: number } = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word)
}

export function generateBasicUploadDescription(fileName: string, folderName: string, relativePath: string, position?: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  const videoNumber = position ? parseInt(position) + 1 : null

  let description = `${cleanName}\n\n`

  if (videoNumber && folderName) {
    description += `📹 Part ${videoNumber} of series: ${folderName}\n\n`
  } else if (folderName) {
    description += `📚 Part of: ${folderName}\n\n`
  }

  if (relativePath && relativePath !== '') {
    const pathParts = relativePath.split('/').filter(p => p.length > 0)
    if (pathParts.length > 0) {
      const cleanPath = pathParts.map(part => part.replace(/^\d+[\.\-_\s]*/, '').trim()).join(' → ')
      description += `📂 MODULE: ${cleanPath}\n\n`
    }
  }

  description += `🎯 High-quality educational content designed for learning and professional development.\n\n`
  description += `💡 Like and subscribe for more educational content!\n`
  description += `💬 Share your thoughts and questions in the comments below.\n\n`
  description += `✨ This video will be enhanced with AI-powered descriptions and insights shortly...\n\n`
  description += `#education #learning #content #tutorial #guide`

  return description
}

export function generateFallbackDescription(fileName: string, folderName: string, relativePath: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')

  let description = `🎯 ${cleanName}\n\n`
  description += `📚 Quality educational content designed to provide valuable insights and learning opportunities.\n\n`

  if (folderName) {
    description += `📂 COLLECTION: ${folderName}\n\n`
  }

  description += `💡 Like and subscribe for more educational content!\n`
  description += `💬 Share your thoughts and questions in the comments below.\n\n`
  description += `#education #learning #content #tutorial #guide`

  return description
}

export function generateShortsDescription(fileName: string, originalDescription: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')

  // Create a short, engaging description optimized for Shorts
  let description = `🔥 ${cleanName}\n\n`
  description += `📱 Quick tip in 60 seconds or less!\n\n`
  description += `💡 Follow for more bite-sized content!\n`
  description += `👍 Like if this helped you!\n`
  description += `💬 What do you think? Comment below!\n\n`
  description += `#Shorts #QuickTip #Viral #Mobile #Short`

  return description
}

export function generateBasicTags(fileName: string, folderName: string): string[] {
  const text = `${fileName} ${folderName}`.toLowerCase()
  const baseTags = ['education', 'learning', 'tutorial', 'guide', 'content']

  const specificTags = []
  if (text.includes('business')) specificTags.push('business', 'professional')
  if (text.includes('tech')) specificTags.push('technology', 'programming')
  if (text.includes('course')) specificTags.push('course', 'training')
  if (text.includes('beginner')) specificTags.push('beginner', 'basics')
  if (text.includes('advanced')) specificTags.push('advanced', 'expert')

  return [...baseTags, ...specificTags].slice(0, 10)
}

export function extractVideoNumber(title: string): string | null {
  const match = title.match(/^\d+/)
  return match ? match[0] : null
}

export function detectCategoryFromContent(
  folderName: string,
  allFileNames: string[],
  relativePath: string
): string {
  // Combine all text for analysis
  const allText = `${folderName} ${allFileNames.join(' ')} ${relativePath}`.toLowerCase()

  // Category scoring system
  const categoryScores: { [key: string]: number } = {
    '27': 0, // Education
    '28': 0, // Science & Technology
    '26': 0, // Howto & Style
    '22': 0, // People & Blogs
    '24': 0, // Entertainment
    '25': 0, // News & Politics
    '19': 0, // Travel & Events
    '17': 0, // Sports
    '15': 0, // Pets & Animals
    '10': 0, // Music
  }

  // Education indicators (Category 27)
  const educationKeywords = [
    'course', 'lesson', 'tutorial', 'learn', 'education', 'training', 'class',
    'lecture', 'study', 'teach', 'instruction', 'academy', 'school', 'university',
    'guide', 'howto', 'beginner', 'advanced', 'basics', 'fundamentals'
  ]
  educationKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['27'] += 2
  })

  // Science & Technology indicators (Category 28)
  const techKeywords = [
    'programming', 'coding', 'software', 'development', 'tech', 'technology',
    'computer', 'algorithm', 'data', 'science', 'engineering', 'ai', 'ml',
    'javascript', 'python', 'react', 'node', 'web', 'app', 'api', 'database'
  ]
  techKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['28'] += 3
  })

  // Howto & Style indicators (Category 26)
  const howtoKeywords = [
    'how to', 'howto', 'diy', 'tutorial', 'tips', 'tricks', 'style', 'fashion',
    'beauty', 'makeup', 'hair', 'design', 'creative', 'craft', 'art'
  ]
  howtoKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['26'] += 2
  })

  // Business/Professional indicators (People & Blogs - Category 22)
  const businessKeywords = [
    'business', 'entrepreneur', 'marketing', 'strategy', 'professional',
    'career', 'leadership', 'management', 'finance', 'sales', 'startup',
    'growth', 'success', 'productivity', 'networking'
  ]
  businessKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['22'] += 2
  })

  // Entertainment indicators (Category 24)
  const entertainmentKeywords = [
    'entertainment', 'funny', 'comedy', 'fun', 'viral', 'meme', 'reaction',
    'review', 'movie', 'show', 'series', 'celebrity', 'gossip'
  ]
  entertainmentKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['24'] += 2
  })

  // Health & Fitness (falls under Howto & Style - Category 26)
  const healthKeywords = [
    'health', 'fitness', 'workout', 'exercise', 'nutrition', 'diet',
    'wellness', 'yoga', 'meditation', 'mental health', 'lifestyle'
  ]
  healthKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['26'] += 1
  })

  // Music indicators (Category 10)
  const musicKeywords = [
    'music', 'song', 'audio', 'sound', 'beat', 'melody', 'instrument',
    'guitar', 'piano', 'vocals', 'recording', 'studio', 'band', 'album'
  ]
  musicKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['10'] += 3
  })

  // Travel indicators (Category 19)
  const travelKeywords = [
    'travel', 'trip', 'vacation', 'journey', 'destination', 'adventure',
    'explore', 'culture', 'country', 'city', 'tourism', 'hotel', 'flight'
  ]
  travelKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['19'] += 3
  })

  // Sports indicators (Category 17)
  const sportsKeywords = [
    'sport', 'sports', 'game', 'match', 'competition', 'team', 'player',
    'football', 'basketball', 'soccer', 'tennis', 'baseball', 'hockey'
  ]
  sportsKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['17'] += 3
  })

  // Special case: If it contains retention/engagement/analytics, likely business content
  if (allText.includes('retention') || allText.includes('engagement') || allText.includes('analytics')) {
    categoryScores['22'] += 3 // People & Blogs for business content
  }

  // If no clear category detected, default to Education
  const maxScore = Math.max(...Object.values(categoryScores))
  if (maxScore === 0) {
    return '27' // Default to Education
  }

  // Return the category with the highest score
  const bestCategory = Object.entries(categoryScores)
    .find(([, score]) => score === maxScore)?.[0] || '27'

  return bestCategory
}

export function checkForDuplicateVideos(
  videos: VideoFile[],
  existingVideos: Array<{videoId: string, title: string, position: number}>,
  titleFormat: string,
  customTitlePrefix: string,
  customTitleSuffix: string,
  useAiAnalysis?: boolean
): VideoFile[] {
  if (existingVideos.length === 0) return videos

  return videos.filter(video => {
    // Use basename for consistency with upload route
    const basename = getBasename(video.file.name)
    const videoTitle = generateTitle(basename, titleFormat, customTitlePrefix, customTitleSuffix)

    // Check for exact title match
    const isDuplicate = existingVideos.some(existing => {
      const existingTitle = existing.title.trim()
      const newTitle = videoTitle.trim()
      return existingTitle.toLowerCase() === newTitle.toLowerCase()
    })

    if (isDuplicate) {
      console.log(`Skipping duplicate video: ${videoTitle} (filename: ${basename})`)
    }

    return !isDuplicate
  })
}

export function calculateInsertionPositions(
  videos: VideoFile[],
  existingVideos: Array<{videoId: string, title: string, position: number}>,
  titleFormat: string,
  customTitlePrefix: string,
  customTitleSuffix: string,
  useAiAnalysis?: boolean
): number[] {
  if (existingVideos.length === 0) {
    // New playlist: positions start from 0
    return videos.map((_, index) => index)
  }

  // Generate titles for all folder videos (use basename for consistency)
  const videoTitles = videos.map(video => {
    const basename = getBasename(video.file.name)
    return generateTitle(basename, titleFormat, customTitlePrefix, customTitleSuffix)
      .trim()
      .toLowerCase()
  })

  // Map existing videos by title (lowercase)
  const existingByTitle = new Map<string, {position: number, index: number}>()
  existingVideos.forEach(existing => {
    const title = existing.title.trim().toLowerCase()
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
  let lastIndex = -1
  let monotonic = true
  for (let i = 0; i < videos.length; i++) {
    if (targetPositions[i] !== -1) {
      if (targetPositions[i] < lastPosition) {
        // Existing video appears earlier in playlist than previous existing video (out of order)
        monotonic = false
        break
      }
      lastPosition = targetPositions[i]
      lastIndex = i
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
