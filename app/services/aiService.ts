import OpenAI from 'openai'

export interface ContentAnalysis {
  videoTitle: string
  videoDescription: string
  playlistDescription: string
  tags: string[]
  category: string
  theme: string
  targetAudience: string
  skillLevel: string
}

// Initialize DeepSeek client using OpenAI SDK
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
})

// Rate limiter for AI API calls
class RateLimiter {
  private queue: Array<() => void> = []
  private activeCount = 0
  private readonly maxConcurrent: number
  private readonly minInterval: number
  private lastCallTime = 0

  constructor(maxConcurrent = 3, minInterval = 1000) {
    this.maxConcurrent = maxConcurrent
    this.minInterval = minInterval
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now()
        const timeSinceLastCall = now - this.lastCallTime
        
        if (this.activeCount < this.maxConcurrent && timeSinceLastCall >= this.minInterval) {
          this.activeCount++
          this.lastCallTime = Date.now()
          resolve()
        } else {
          const waitTime = Math.max(
            100,
            this.activeCount >= this.maxConcurrent ? 500 : this.minInterval - timeSinceLastCall
          )
          setTimeout(tryAcquire, waitTime)
        }
      }
      tryAcquire()
    })
  }

  release(): void {
    this.activeCount = Math.max(0, this.activeCount - 1)
    
    // Process next in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) next()
    }
  }

  async withLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

const aiRateLimiter = new RateLimiter(3, 1000)

// Audio file extensions for detection
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.opus', '.aiff', '.alac']

function isAudioFileName(filename: string): boolean {
  return AUDIO_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))
}

export async function analyzeContent(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  relativePath: string,
): Promise<ContentAnalysis> {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const isAudio = isAudioFileName(currentFileName)
    const audioFileCount = allFileNames.filter(isAudioFileName).length
    const isAllAudio = audioFileCount === allFileNames.length
    const mediaLabel = isAudio ? 'audio' : 'video'

    console.log('🎯 Analyzing content:', { folderName, currentFileName, fileCount: allFileNames.length, isAudio })

    const audioSpecificPrompt = isAudio ? `

**AUDIO-SPECIFIC GUIDANCE:**
This file is an AUDIO file (${currentFileName}). Adapt your metadata accordingly:

**For MUSIC content** (songs, albums, mixtapes, beats, instrumentals):
- Title: Include artist name and song title if detectable from filename (e.g., "Artist - Song Title")
- Description: Include 🎵 emoji, mention the genre/mood, artist info, and listening context
- Add sections: 🎧 **About This Track**, 🎤 **Artist**, 💿 **Album/Collection** if applicable
- Tags: Include genre, mood descriptors, "official audio", "music", artist name
- Category: Use "10" (Music)

**For PODCAST content** (episodes, interviews, discussions, talks):
- Title: Include episode number if present, topic, and guest name if detectable
- Description: Include 🎙️ emoji, episode summary, key topics discussed, and timestamps placeholder
- Add sections: 🎙️ **Episode Overview**, 📋 **Topics Covered**, 🔗 **Links & Resources**
- Tags: Include "podcast", topic keywords, guest name, series name
- Category: Use "22" (People & Blogs) or "27" (Education) depending on content

**For AUDIOBOOK content** (chapters, narration, spoken word):
- Title: Include book title and chapter info if detectable
- Description: Include 📖 emoji, chapter summary, book context
- Add sections: 📖 **Chapter Overview**, 📚 **About This Book**
- Tags: Include "audiobook", book title, author, genre
- Category: Use "27" (Education) or "24" (Entertainment)

**For LECTURE/EDUCATIONAL AUDIO** (recorded lectures, language lessons):
- Title: Include lesson topic and number if applicable
- Description: Include 🎓 emoji, learning objectives, key concepts
- Add sections: 🎓 **Lesson Overview**, 📝 **Key Concepts**, 💡 **Key Takeaways**
- Tags: Include subject matter, "lecture", "lesson", educational keywords
- Category: Use "27" (Education)

**For AMBIENT/SOUND content** (nature sounds, ASMR, meditation, white noise):
- Title: Be descriptive about the soundscape
- Description: Include 🌿 or 🧘 emoji, describe the atmosphere and use case
- Tags: Include mood, use case ("study", "sleep", "relaxation"), sound type
- Category: Use "10" (Music) or "24" (Entertainment)
` : ''

  const prompt = `Analyze this VIDEO COURSE content and generate comprehensive YouTube metadata.

COURSE NAME: "${folderName}"
CURRENT LESSON: "${currentFileName}"
MODULE PATH: "${relativePath}"
TOTAL LESSONS: ${allFileNames.length}

ALL LESSONS IN COURSE (use this to understand the full curriculum):
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

${relativePath ? `CURRENT MODULE: Extract the module name from the relative path (e.g., "03. Identify Model Opportunities")` : ''}

Based on the curriculum above and the current lesson, provide:

1. **Title**: Create an engaging YouTube title based ONLY on the current lesson filename (max 70 chars). Clean up numbering, keep the topic. Make it professional and clickable.

2. **Description**: Write a COMPREHENSIVE description that:
   - Opens with a compelling hook about what viewers will learn
   - Uses the course context: THIS LESSON is part of "${folderName}" course
   - Describes the specific topics covered in THIS lesson ("${currentFileName}")
   - References how this lesson connects to the overall course structure
   - Includes 4-6 specific learning outcomes or key points covered
   - Has clear sections with headers:
     • 📚 **What You'll Learn In This Lesson** (specific topics)
     • 🎯 **Course Context** (where this fits in the overall curriculum)
     • 💡 **Key Takeaways** (actionable insights)
     • 🔗 **Continue Learning** (encourage watching next lesson)
   - Add hashtags: #learning #education #[specific topic]
   - Minimum 300 words for substantive content
   - NO generic "Uploaded via" text

3. **Playlist Description**: Create an engaging playlist description for "${folderName}" that:
   - Explains the course structure (list the modules/lessons)
   - Describes learning outcomes and target audience
   - Mentions prerequisites if any
   - Professional and compelling

4. **Tags**: Generate 10-15 relevant YouTube tags including:
   - Course name keywords
   - Specific lesson topics
   - Educational/professional tags
   - YouTube category keywords

5. **Category**: "27" (Education)
6. **Theme**: Main theme from folder name
7. **Target Audience**: Professionals looking to improve monetization strategy
8. **Skill Level**: intermediate/advanced

CRITICAL REQUIREMENTS:
- The description MUST reference specific lesson topics from "${currentFileName}"
- Mention THIS lesson's specific content, not generic course descriptions
- If current lesson is "01. Introduction", describe intro topics
- If current lesson is "05. Pricing Strategies", describe pricing content
- Use the full curriculum to show progression
- NEVER use generic placeholder text like "Uploaded via YouTube Playlist Uploader"
- Descriptions should be 300-500 words with substantive content about the actual video

Respond ONLY with valid JSON:
{
  "videoTitle": "Clean title based on filename",
  "videoDescription": "300-500 word comprehensive description with specific lesson content...",
  "playlistDescription": "Playlist description...",
  "tags": ["tag1", "tag2", ...],
  "category": "27",
  "theme": "Main theme",
  "targetAudience": "Who this is for",
  "skillLevel": "intermediate"
}`

    const response = await aiRateLimiter.withLimit(async () => {
      return deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert YouTube content strategist and metadata optimizer with deep knowledge of different content types:
1. **Educational/Tutorial Content**: Courses, lectures, how-to guides, skill development
2. **Entertainment Content**: Vlogs, comedy, commentary, reviews, gaming
3. **Informational Content**: Documentaries, news, explainers, analysis
4. **Creative Content**: Art, music, DIY, crafts, cooking
5. **Professional Content**: Business, technology, software tutorials, industry insights
6. **Audio/Podcast Content**: Music tracks, podcast episodes, audiobooks, lectures, ambient sounds, ASMR
7. **Music Content**: Songs, albums, mixtapes, beats, instrumentals, covers, remixes

Your expertise includes:
- Creating viral-worthy titles that maximize click-through rates
- Writing compelling descriptions tailored to content type and target audience
- Generating optimal tags for discoverability
- Understanding YouTube's algorithm and ranking factors
- Adapting tone and structure based on content type (professional for educational, casual for entertainment, audio-optimized for music/podcasts)
- Balancing SEO optimization with viewer engagement
- Recognizing audio content (MP3, WAV, FLAC, etc.) and adapting metadata to use listening-oriented language
- Understanding music metadata conventions (artist - title, album info, genre tags)
- Optimizing podcast metadata (episode numbers, guest names, topic summaries)

Always produce professional, engaging metadata that drives watch time, retention, and subscriber growth.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from DeepSeek API')
    }

    // Clean and parse JSON response - handle markdown code blocks
    let cleanContent = content.trim()

    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    const analysis = JSON.parse(cleanContent) as ContentAnalysis

    // Validate required fields
    if (!analysis.videoTitle || !analysis.videoDescription || !analysis.tags || !analysis.category) {
      throw new Error('Invalid response format from DeepSeek API')
    }

    return analysis

  } catch (error) {
    console.error('DeepSeek API error:', error)

    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if ('response' in error) {
        console.error('Response status:', (error as any).response?.status)
        console.error('Response data:', (error as any).response?.data)
      }
    }

    throw new Error('AI analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

export async function analyzePlaylistContent(
  folderName: string,
  allFileNames: string[]
): Promise<{ description: string; theme: string }> {
  try {
    const prompt = `Create a comprehensive YouTube playlist description for this video course:

PLAYLIST NAME: "${folderName}"
TOTAL VIDEOS: ${allFileNames.length}

ALL LESSONS/VIDEOS:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Write a compelling, professional playlist description (400-600 words) that:

1. **Opening Hook (2-3 sentences):** Start with a powerful hook about why this topic matters and what viewers will gain. Create urgency around the problem this course solves.

2. **Course Overview:** Explain what this course covers and the specific skills/knowledge viewers will acquire. Reference the actual lesson names to show depth.

3. **What You'll Master (5-6 bullet points):** List specific learning outcomes using the actual video/lesson titles as reference. Be concrete about skills gained.

4. **Perfect For:** Define the ideal audience (specific roles, industries, skill levels). Be specific, not generic.

5. **Course Structure:** Briefly describe how the ${allFileNames.length} videos are organized and why this structure works for learning.

6. **Closing CTA:** Strong call to action - subscribe, notifications, start with video 1.

7. **Hashtags (5-8):** Relevant, discoverable hashtags.

IMPORTANT:
- Use the ACTUAL lesson names from the video list above
- Make it professional and compelling
- 400-600 words minimum
- No placeholder text or generic content
- Optimize for YouTube SEO

Respond ONLY with JSON:
{
  "description": "Your complete playlist description here...",
  "theme": "Main theme"
}`

    const response = await aiRateLimiter.withLimit(async () => {
      return deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert YouTube playlist strategist and educational content marketer. You create compelling, SEO-optimized playlist descriptions that drive subscriptions, watch time, and viewer engagement. Your descriptions are professional, value-driven, and perfectly targeted to the intended audience.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from DeepSeek API')
    }

    // Clean and parse JSON response - handle markdown code blocks
    let cleanContent = content.trim()

    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    const result = JSON.parse(cleanContent)
    if (!result.description) {
      throw new Error('No description in AI response')
    }
    return {
      description: result.description,
      theme: result.theme || 'Educational Content'
    }

  } catch (error) {
    console.error('DeepSeek playlist analysis error:', error)
    throw new Error('AI playlist analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

