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

    const prompt = `Analyze this ${mediaLabel} content collection and generate YouTube metadata:

FOLDER/COURSE NAME: "${folderName}"
CURRENT ${mediaLabel.toUpperCase()} FILE: "${currentFileName}"
RELATIVE PATH: "${relativePath}"
MEDIA TYPE: ${isAudio ? 'AUDIO' : 'VIDEO'}${isAllAudio ? ' (entire collection is audio)' : ''}

ALL FILES IN COLLECTION:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Based on this analysis, please provide:

1. **Title**: Create an engaging, clickable YouTube title based ONLY on the current filename (max 70 chars optimal, 100 chars max). Use power words like "Ultimate", "Complete", "Essential", "Step-by-Step". Spark curiosity, include primary keyword, and make it professional.
2. **Description**: Create a compelling YouTube description tailored to the content type. First, analyze the content type (educational, tutorial, entertainment, informational, creative, professional, music, podcast, audiobook) based on folder names and filenames.

**For EDUCATIONAL/TUTORIAL content** (courses, lectures, how-to guides):
- Start with a bold title: 🎯 **[Title]**
- Include learning objectives: 📚 **What You'll Learn:** with 3-5 bullet points
- Add context about the course/series
- Include practical applications or key takeaways
- Call to action for engagement (comments, questions)
- Relevant hashtags

**For ENTERTAINMENT content** (vlogs, comedy, gaming, reviews):
- Engaging hook that captures the content's energy
- Brief overview of what happens
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
${audioSpecificPrompt}
**General guidelines for all descriptions:**
- Use appropriate emojis for visual appeal (🎯, 📚, 💡, 🚀, 🎵, 🎙️, etc.)
- Include clear sections with headers
- Add value proposition: why should viewers watch/listen?
- Mention if part of a series/playlist
- Include 5-8 relevant hashtags at the end
- Keep professional tone for educational/professional content, casual for entertainment
- Optimize for YouTube SEO with relevant keywords

3. **Playlist Description**: Create an engaging playlist description for the entire collection that explains the structure, outcomes, and target audience.
4. **Tags**: Generate 8-12 relevant YouTube tags including 2-3 broad tags, 5-7 niche tags, and 2-3 long-tail keyword tags.${isAudio ? ' Include audio/music/podcast-relevant tags.' : ''}
5. **Category**: Select most appropriate YouTube category ID from: 27(Education), 28(Science&Tech), 26(Howto&Style), 22(People&Blogs), 24(Entertainment), 19(Travel), 17(Sports), 15(Pets), 10(Music), 2(Autos&Vehicles), 20(Gaming)${isAudio ? '. For music content, use 10. For podcasts, use 22 or 27.' : ''}
6. **Theme**: Identify the main theme/topic (be specific)
7. **Target Audience**: Describe who this content is for (demographics, interests, skill level)
8. **Skill Level**: beginner/intermediate/advanced

IMPORTANT GUIDELINES:
- **Content Type Analysis**: First analyze the content type based on folder names, filenames, and context. Adapt tone, structure, and formatting accordingly.
- **Educational/Professional**: Use formal tone, structured sections, learning objectives, practical applications.
- **Entertainment/Casual**: Use engaging, conversational tone, highlight fun moments, build personal connection.
- **Creative/Informational**: Focus on process, techniques, insights, and community engagement.${isAudio ? '\n- **Audio Content**: Recognize this is audio, not video. Use listening-oriented language ("listen", "hear", "tune in") instead of viewing language ("watch", "see").' : ''}
- **Titles**: Use ONLY the filename content, remove file extensions, clean up numbering/formatting but do NOT include folder names or paths. Create titles that make viewers want to click.
- **Titles SEO**: Include primary keyword naturally, keep under 70 characters for optimal visibility. Use power words appropriate to content type.
- **Descriptions**: Be specific to actual content, not generic. Highlight unique value proposition for the target audience.
- **Value Focus**: What will viewers learn/experience/gain? Why should they watch this specific ${mediaLabel}?
- **SEO Optimization**: Use relevant keywords throughout title, description, and tags for YouTube discoverability.
- **Series Context**: Consider position in series and reference adjacent items if helpful for navigation.
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

