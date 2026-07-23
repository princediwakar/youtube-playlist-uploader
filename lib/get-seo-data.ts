import fs from 'fs'
import path from 'path'
import { useCases as englishUseCases, alternatives as englishAlternatives } from './seo-data'

export function getUseCases(locale: string) {
  if (locale === 'en') return englishUseCases

  try {
    const localeDir = path.join(process.cwd(), 'lib', 'seo-data', 'locales', locale)
    
    // If translations don't exist yet, fallback to English to prevent crashing
    if (!fs.existsSync(localeDir)) {
      console.warn(`Translations for locale ${locale} not found. Falling back to English.`)
      return englishUseCases
    }

    const batch1 = JSON.parse(fs.readFileSync(path.join(localeDir, 'batch-1.json'), 'utf-8'))
    const batch2 = JSON.parse(fs.readFileSync(path.join(localeDir, 'batch-2.json'), 'utf-8'))
    const batch3 = JSON.parse(fs.readFileSync(path.join(localeDir, 'batch-3.json'), 'utf-8'))

    return [...batch1, ...batch2, ...batch3]
  } catch (error) {
    console.error(`Error loading translated use cases for locale ${locale}:`, error)
    return englishUseCases
  }
}

export function getAlternatives(locale: string) {
  // TODO: Add translation for alternatives later. For now, fallback to English.
  return englishAlternatives
}
