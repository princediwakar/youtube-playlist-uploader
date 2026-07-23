'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function generateIdeas(topic: string): Promise<{ ideas: { title: string, hook: string }[]; error?: string }> {
  if (!topic || topic.trim().length < 2) {
    return { ideas: [], error: 'Please enter a topic with at least 2 characters.' }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube content strategist. Generate exactly 10 highly engaging, viral-potential YouTube video ideas for the given niche or topic. 
Return the result as a JSON array under an "ideas" key. 
Each item in the array must be an object with two string properties: "title" (the suggested video title) and "hook" (a 1-2 sentence description of the video concept and why people would watch it).
Do not wrap in markdown.`,
        },
        {
          role: 'user',
          content: topic,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { ideas: [], error: 'No response from AI.' }
    }

    const result = JSON.parse(content)
    const ideas = result.ideas?.slice(0, 10) || []

    if (ideas.length === 0) {
      return { ideas: [], error: 'Could not generate ideas. Try a different topic.' }
    }

    return { ideas }
  } catch (error: unknown) {
    console.error('Error generating ideas:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate ideas. Please try again.'
    return { ideas: [], error: message }
  }
}
