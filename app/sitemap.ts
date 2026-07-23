import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/index'
import { useCases, alternatives } from '@/lib/seo-data'
import { getUseCases, getAlternatives } from '@/lib/get-seo-data'
import { i18n } from '@/lib/i18n.config'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://youtube-playlist-uploader.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const blogs = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const pSeoUseCases = []
  const pSeoAlternatives = []

  for (const locale of i18n.locales) {
    const locUseCases = getUseCases(locale)
    const locAlternatives = getAlternatives(locale)

    locUseCases.forEach((uc: any) => {
      pSeoUseCases.push({
        url: `${BASE_URL}/${locale}/use-cases/${uc.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    })

    locAlternatives.forEach((alt: any) => {
      pSeoAlternatives.push({
        url: `${BASE_URL}/${locale}/alternatives/${alt.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    })
  }

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/research/youtube-upload-statistics`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    ...blogs,
    ...pSeoUseCases,
    ...pSeoAlternatives,
    { url: `${BASE_URL}/history`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]
}
