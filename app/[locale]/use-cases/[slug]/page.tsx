import { getUseCases } from '@/lib/get-seo-data'
import { i18n } from '@/lib/i18n.config'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { SchemaMarkup } from '@/components/seo/schema-markup'
import Link from 'next/link'

export function generateStaticParams() {
  const allParams: { locale: string; slug: string }[] = []
  
  for (const locale of i18n.locales) {
    const useCases = getUseCases(locale)
    useCases.forEach((useCase) => {
      allParams.push({ locale, slug: useCase.slug })
    })
  }
  
  return allParams
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const useCases = getUseCases(locale)
  const useCase = useCases.find((uc: any) => uc.slug === slug)
  if (!useCase) return {}

  return {
    title: useCase.title,
    description: useCase.description,
  }
}

export default async function UseCasePage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const { locale, slug } = await params;
  const useCases = getUseCases(locale)
  const useCase = useCases.find((uc: any) => uc.slug === slug)
  
  if (!useCase) {
    notFound()
  }

  return (
    <main className="bg-white">
      <SchemaMarkup type="Article" data={{
        headline: useCase.title,
        description: useCase.description,
        author: { '@type': 'Organization', name: 'YouTube Playlist Uploader' },
      }} />

      {/* Hero Section - Conversion Focused */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl font-playfair mb-6">
          The Fastest Way to <span className="text-yt-red">{useCase.keyword}</span> in 2026
        </h1>
        <p className="mt-4 max-w-3xl text-xl text-gray-500 mx-auto mb-10">
          Stop manually clicking and waiting. Drag your {useCase.niche} files here and let our AI optimize and publish them directly to your YouTube channel.
        </p>

        {/* Placeholder for Hero GIF */}
        <div className="max-w-4xl mx-auto mb-12 rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-100 aspect-video flex items-center justify-center">
           <span className="text-gray-400 font-medium">[ Hero GIF: App processing 50 {useCase.niche} files ]</span>
        </div>

        <Link href="/" className="inline-flex items-center justify-center px-10 py-5 border border-transparent text-2xl font-bold rounded-xl text-white bg-yt-red hover:bg-red-700 shadow-lg transition-transform hover:scale-105">
          Drop your files here to start
          <span className="block text-sm font-normal text-red-200 ml-3">(No Credit Card Required)</span>
        </Link>
      </section>

      {/* SEO Content Section - Keeping Google Happy */}
      <section className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 font-playfair">
            Why Batch Uploading {useCase.niche} is Essential
          </h2>
          <div className="prose prose-lg text-gray-600">
            {useCase.seoContent?.map((paragraph: string, idx: number) => (
              <p key={idx} className="mb-6">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
