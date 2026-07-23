'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function generateDescription(topic: string): Promise<{ description: string; error?: string }> {
  if (!topic || topic.trim().length < 2) {
    return { description: '', error: 'Please enter a topic with at least 2 characters.' }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube SEO strategist. Generate a highly engaging, keyword-rich YouTube video description for the given topic. 
Include:
1. A strong hook in the first 2 lines.
2. A brief overview of what the video covers.
3. Timestamps (mocked up as examples).
4. Links section (placeholder).
5. Relevant keywords naturally woven into the text.
Do not include any intro like "Here is your description". Return only the description text.`,
        },
        {
          role: 'user',
          content: topic,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { description: '', error: 'No response from AI.' }
    }

    return { description: content }
  } catch (error: unknown) {
    console.error('Error generating description:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate description. Please try again.'
    return { description: '', error: message }
  }
}
