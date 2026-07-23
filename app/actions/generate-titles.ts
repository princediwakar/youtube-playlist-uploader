'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function generateTitles(topic: string): Promise<{ titles: string[]; error?: string }> {
  if (!topic || topic.trim().length < 2) {
    return { titles: [], error: 'Please enter a topic with at least 2 characters.' }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube title strategist. Generate exactly 5 highly clickable, SEO-optimized YouTube video titles for the given topic. Each title must be under 100 characters. Return them as a JSON array of strings under a "titles" key. Do not wrap in markdown.`,
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
      return { titles: [], error: 'No response from AI.' }
    }

    const result = JSON.parse(content)
    const titles = result.titles?.slice(0, 5) || []

    if (titles.length === 0) {
      return { titles: [], error: 'Could not generate titles. Try a different topic.' }
    }

    return { titles }
  } catch (error: unknown) {
    console.error('Error generating titles:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate titles. Please try again.'
    return { titles: [], error: message }
  }
}
