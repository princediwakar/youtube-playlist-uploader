import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import { batch1 } from '../lib/seo-data-batch-1'
import { batch2 } from '../lib/seo-data-batch-2'
import { batch3 } from '../lib/seo-data-batch-3'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const locales = ['es', 'pt', 'hi']
const outDir = path.join(process.cwd(), 'lib', 'seo-data', 'locales')

const systemPrompt = `You are an expert translator specializing in SEO content. 
Translate the provided JSON content into the requested language.
Keep the JSON structure exactly the same.
Do not translate the 'slug', 'category', 'niche', or 'keyword' fields unless specified, but do translate 'title', 'description', and 'seoContent'.
Return ONLY valid JSON without markdown blocks.`

async function translateBatch(batchName: string, data: any, targetLang: string) {
  const languageNames: { [key: string]: string } = {
    es: 'Spanish',
    pt: 'Portuguese',
    hi: 'Hindi',
  }

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Translate the following JSON array of SEO data into ${languageNames[targetLang]}:\n\n${JSON.stringify(data, null, 2)}` 
      }
    ],
    response_format: { type: 'json_object' } // requires an object, so we wrap it
  })

  const content = result.choices[0].message.content
  if (!content) throw new Error('No content returned')
  
  return JSON.parse(content)
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const batches = [
    { name: 'batch-1', data: batch1 },
    { name: 'batch-2', data: batch2 },
    { name: 'batch-3', data: batch3 },
  ]

  for (const locale of locales) {
    const localeDir = path.join(outDir, locale)
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true })
    }

    for (const batch of batches) {
      console.log(`Translating ${batch.name} to ${locale}...`)
      try {
        // We wrap the array in an object because response_format: json_object requires it
        const wrappedData = { items: batch.data }
        const translated = await translateBatch(batch.name, wrappedData, locale)
        
        fs.writeFileSync(
          path.join(localeDir, `${batch.name}.json`),
          JSON.stringify(translated.items || translated, null, 2)
        )
        console.log(`Successfully translated ${batch.name} to ${locale}`)
      } catch (error) {
        console.error(`Failed to translate ${batch.name} to ${locale}:`, error)
      }
    }
  }
}

main().catch(console.error)
