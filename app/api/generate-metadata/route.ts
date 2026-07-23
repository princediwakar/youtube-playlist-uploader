import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize the OpenAI client pointing to DeepSeek's API
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { filename, prompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube strategist. Generate a detailed description (including a summary and placeholders for social links), and an array of 10-15 highly relevant SEO tags for YouTube.
          
          You MUST respond in pure JSON format with exactly two keys: "description", and "tags" (which is an array of strings). Do not wrap the JSON in markdown blocks.`
        },
        {
          role: 'user',
          content: `Video Filename: ${filename || 'Unknown'}\nContext: ${prompt || 'Generate optimized metadata for this video.'}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || '{}');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating AI metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate metadata' },
      { status: 500 }
    );
  }
}
