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

export async function analyzeContent(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  relativePath: string
): Promise<ContentAnalysis> {
  try {
    console.log('🔑 DeepSeek API Key available:', !!process.env.DEEPSEEK_API_KEY)
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }
    console.log('🎯 Analyzing content:', { folderName, currentFileName, fileCount: allFileNames.length })
    const prompt = `Analyze this video content collection and generate YouTube metadata:

FOLDER/COURSE NAME: "${folderName}"
CURRENT VIDEO FILE: "${currentFileName}"
RELATIVE PATH: "${relativePath}"

ALL FILES IN COLLECTION:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Based on this analysis, please provide:

1. **Video Title**: Create an engaging, clickable YouTube title based ONLY on the current video filename (max 70 chars optimal, 100 chars max). Use power words like "Ultimate", "Complete", "Essential", "Step-by-Step". Spark curiosity, include primary keyword, and make it professional.
2. **Video Description**: Create a compelling YouTube description tailored to the content type. First, analyze the content type (educational, tutorial, entertainment, informational, creative, professional) based on folder names and filenames.

**For EDUCATIONAL/TUTORIAL content** (courses, lectures, how-to guides):
- Start with a bold title: 🎯 **[Video Title]**
- Include learning objectives: 📚 **What You'll Learn:** with 3-5 bullet points
- Add context about the course/series
- Include practical applications or key takeaways
- Call to action for engagement (comments, questions)
- Relevant hashtags

**For ENTERTAINMENT content** (vlogs, comedy, gaming, reviews):
- Engaging hook that captures the video's energy
- Brief overview of what happens in the video
- Highlights or memorable moments
- Personal connection or behind-the-scenes notes
- Strong call to action (subscribe, notifications)
- Fun, relevant hashtags

**For INFORMATIONAL/CREATIVE content** (documentaries, art, music, DIY):
- Context about the topic or creative process
- Key insights or techniques covered
- Background information or sources
- Engagement prompts for the community
- Appropriate hashtags for discovery

**General guidelines for all descriptions:**
- Use appropriate emojis for visual appeal (🎯, 📚, 💡, 🚀, etc.)
- Include clear sections with headers
- Add value proposition: why should viewers watch?
- Mention if part of a series/playlist
- Include 5-8 relevant hashtags at the end
- Keep professional tone for educational/professional content, casual for entertainment
- Optimize for YouTube SEO with relevant keywords

3. **Playlist Description**: Create an engaging playlist description for the entire collection that explains the course structure, learning outcomes, and target audience.
4. **Tags**: Generate 8-12 relevant YouTube tags including 2-3 broad tags, 5-7 niche tags, and 2-3 long-tail keyword tags.
5. **Category**: Select most appropriate YouTube category ID from: 27(Education), 28(Science&Tech), 26(Howto&Style), 22(People&Blogs), 24(Entertainment), 19(Travel), 17(Sports), 15(Pets), 10(Music), 2(Autos&Vehicles), 20(Gaming)
6. **Theme**: Identify the main theme/topic (be specific)
7. **Target Audience**: Describe who this content is for (demographics, interests, skill level)
8. **Skill Level**: beginner/intermediate/advanced

IMPORTANT GUIDELINES:
- **Content Type Analysis**: First analyze the content type based on folder names, filenames, and context. Adapt tone, structure, and formatting accordingly.
- **Educational/Professional**: Use formal tone, structured sections, learning objectives, practical applications.
- **Entertainment/Casual**: Use engaging, conversational tone, highlight fun moments, build personal connection.
- **Creative/Informational**: Focus on process, techniques, insights, and community engagement.
- **Titles**: Use ONLY the filename content, remove file extensions, clean up numbering/formatting but do NOT include folder names or paths. Create titles that make viewers want to click.
- **Titles SEO**: Include primary keyword naturally, keep under 70 characters for optimal visibility. Use power words appropriate to content type.
- **Descriptions**: Be specific to actual content, not generic. Highlight unique value proposition for the target audience.
- **Value Focus**: What will viewers learn/experience/gain? Why should they watch this specific video?
- **SEO Optimization**: Use relevant keywords throughout title, description, and tags for YouTube discoverability.
- **Series Context**: Consider video position in series and reference adjacent videos if helpful for navigation.
- **Formatting**: Use proper paragraph breaks, appropriate emojis, and clear section headers for readability.
- **Tags Strategy**: Mix broad (2-3), niche (5-7), and long-tail (2-3) keywords for maximum discoverability across search intent levels.

Respond ONLY with valid JSON in this exact format:
{
  "videoTitle": "Your title here",
  "videoDescription": "Your description here...",
  "playlistDescription": "Your playlist description here...",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "27",
  "theme": "Main theme",
  "targetAudience": "Target audience",
  "skillLevel": "beginner/intermediate/advanced"
}`

    const response = await deepseek.chat.completions.create({
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

Your expertise includes:
- Creating viral-worthy titles that maximize click-through rates
- Writing compelling descriptions tailored to content type and target audience
- Generating optimal tags for discoverability
- Understanding YouTube's algorithm and ranking factors
- Adapting tone and structure based on content type (professional for educational, casual for entertainment, etc.)
- Balancing SEO optimization with viewer engagement

Always produce professional, engaging metadata that drives watch time, retention, and subscriber growth.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
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
    console.error('DeepSeek API error - falling back to basic analysis:', error)

    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if ('response' in error) {
        console.error('Response status:', (error as any).response?.status)
        console.error('Response data:', (error as any).response?.data)
      }
    }

    console.log('Generating fallback analysis for:', {
      folderName,
      currentFileName,
      fileCount: allFileNames.length
    })

    // Fallback to basic analysis if AI fails
    const fallback = generateFallbackAnalysis(folderName, allFileNames, currentFileName, relativePath)
    console.log('Fallback analysis generated:', {
      title: fallback.videoTitle,
      descriptionLength: fallback.videoDescription.length,
      descriptionPreview: fallback.videoDescription.substring(0, 100) + '...'
    })

    return fallback
  }
}

export async function analyzePlaylistContent(
  folderName: string,
  allFileNames: string[]
): Promise<{ description: string; theme: string }> {
  try {
    const prompt = `Analyze this video course/playlist and generate an engaging description:

COURSE/PLAYLIST NAME: "${folderName}"

VIDEO FILES:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Create a compelling playlist description that:
1. **Hook & Overview:** Start with an engaging hook that grabs attention and explains what the course covers.
2. **Value Proposition:** Highlight the unique value and benefits of completing this playlist.
3. **Learning Outcomes:** List 4-6 key things viewers will learn or achieve.
4. **Target Audience:** Describe who this course is perfect for (beginners, professionals, enthusiasts).
5. **Course Structure:** Briefly mention the number of videos and how they're organized.
6. **Call to Action:** Encourage viewers to subscribe, turn on notifications, and watch the first video.
7. **Hashtags:** Include 5-7 relevant hashtags at the end for discoverability.

Make the description professional, engaging, and optimized for YouTube SEO. Use emojis sparingly for visual appeal.

Respond with JSON:
{
  "description": "Your playlist description here...",
  "theme": "Main theme/topic"
}`

    const response = await deepseek.chat.completions.create({
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
      max_tokens: 1000
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
    return {
      description: result.description || `${folderName} - Educational content collection`,
      theme: result.theme || 'Educational Content'
    }

  } catch (error) {
    console.error('DeepSeek playlist analysis error:', error)

    return {
      description: `${folderName} - Collection of ${allFileNames.length} educational videos covering key concepts and strategies.`,
      theme: 'Educational Content'
    }
  }
}

function generateFallbackAnalysis(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  _relativePath: string
): ContentAnalysis {
  // Extract just the filename, removing any folder paths, extensions, and leading numbers
  let cleanFileName = currentFileName
    .replace(/^.*[\/\\]/, '') // Remove any folder path
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers and separators
    .trim()

  // If after cleaning we have nothing, use a default
  if (!cleanFileName) {
    cleanFileName = currentFileName.replace(/\.[^/.]+$/, '').trim() || 'Video Content'
  }

  // Further clean the filename: replace underscores/dashes with spaces, capitalize words
  cleanFileName = cleanFileName
    .replace(/[_-]+/g, ' ') // Replace underscores and dashes with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Remove common filler words
  const fillerWords = ['video', 'part', 'episode', 'lesson', 'chapter', 'section', 'tutorial']
  cleanFileName = cleanFileName
    .split(' ')
    .filter(word => !fillerWords.includes(word.toLowerCase()))
    .join(' ')
    .trim()

  // If we removed too much, restore the original cleaned name
  if (!cleanFileName || cleanFileName.split(' ').length < 2) {
    // Revert to the cleaned name before filler removal
    cleanFileName = currentFileName
      .replace(/^.*[\/\\]/, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/^\d+[\.\-_\s]*/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const videoNumber = allFileNames.findIndex(name => name === currentFileName) + 1
  const totalVideos = allFileNames.length

  // Generate tags based on folder name and cleaned filename
  const baseTags = ['education', 'learning', 'tutorial', 'guide', 'howto']
  const folderTags = folderName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3)

  const filenameTags = cleanFileName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !fillerWords.includes(word))
    .slice(0, 4)

  const allTags = Array.from(new Set([...baseTags, ...folderTags, ...filenameTags])).slice(0, 10)

  // Determine category based on folder name keywords
  let category = '27' // Default Education
  const folderLower = folderName.toLowerCase()
  if (folderLower.includes('tech') || folderLower.includes('science') || folderLower.includes('coding') || folderLower.includes('programming')) {
    category = '28' // Science & Technology
  } else if (folderLower.includes('howto') || folderLower.includes('diy') || folderLower.includes('cooking') || folderLower.includes('craft')) {
    category = '26' // Howto & Style
  } else if (folderLower.includes('travel') || folderLower.includes('adventure') || folderLower.includes('tour')) {
    category = '19' // Travel
  } else if (folderLower.includes('gaming') || folderLower.includes('game') || folderLower.includes('playthrough')) {
    category = '20' // Gaming
  }

  // Create engaging description
  const videoDescription = `🎯 **${cleanFileName}**\n\nWelcome to Part ${videoNumber} of ${totalVideos} in the "${folderName}" series!\n\n📚 **What You'll Learn:**\n• Key concepts and practical strategies\n• Step-by-step guidance and best practices\n• Real-world applications and examples\n\n💡 **Video Highlights:**\n• Clear explanations and demonstrations\n• Actionable insights you can apply immediately\n• Professional tips and techniques\n\n🔔 **Like & Subscribe** for more valuable content!\n📥 **Download resources** in the description below\n\n#${folderName.replace(/[^a-z0-9]/gi, '')} #learning #education #tutorial #howto`

  const playlistDescription = `**${folderName}** - Complete Course Series\n\n📊 ${totalVideos} comprehensive videos covering essential topics, strategies, and practical applications.\n\n🎯 **Course Overview:**\n• Master key concepts and techniques\n• Build practical skills through step-by-step guidance\n• Gain confidence with real-world examples\n\n📈 **Perfect For:**\n• Students seeking to expand their knowledge\n• Professionals looking to enhance their skills\n• Anyone interested in ${folderName.toLowerCase()}\n\n🔔 **Subscribe** to stay updated with new content!`

  return {
    videoTitle: cleanFileName,
    videoDescription,
    playlistDescription,
    tags: allTags,
    category,
    theme: folderName || 'Educational Content',
    targetAudience: 'Students, Professionals, and Lifelong Learners',
    skillLevel: 'intermediate'
  }
}