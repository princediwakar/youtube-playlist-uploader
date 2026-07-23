'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function generateTags(topic: string): Promise<{ tags: string[]; error?: string }> {
  if (!topic || topic.trim().length < 2) {
    return { tags: [], error: 'Please enter a topic with at least 2 characters.' }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube SEO strategist. Generate 20 highly relevant, high-traffic YouTube tags/keywords for the given topic. Return them as a JSON array of strings under a "tags" key. Each tag should be a word or short phrase. Do not wrap in markdown.`,
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
      return { tags: [], error: 'No response from AI.' }
    }

    const result = JSON.parse(content)
    const tags = result.tags?.slice(0, 20) || []

    if (tags.length === 0) {
      return { tags: [], error: 'Could not generate tags. Try a different topic.' }
    }

    return { tags }
  } catch (error: unknown) {
    console.error('Error generating tags:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate tags. Please try again.'
    return { tags: [], error: message }
  }
}
