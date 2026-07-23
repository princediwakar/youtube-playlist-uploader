import { useCases } from '@/lib/seo-data'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { SchemaMarkup } from '@/components/seo/schema-markup'
import Link from 'next/link'

export function generateStaticParams() {
  return useCases.map((useCase) => ({
    slug: useCase.slug,
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const useCase = useCases.find((uc) => uc.slug === params.slug)
  if (!useCase) return {}

  return {
    title: useCase.title,
    description: useCase.description,
  }
}

export default function UseCasePage({ params }: { params: { slug: string } }) {
  const useCase = useCases.find((uc) => uc.slug === params.slug)
  
  if (!useCase) {
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <SchemaMarkup type="Article" data={{
        headline: useCase.title,
        description: useCase.description,
        author: { '@type': 'Organization', name: 'YouTube Playlist Uploader' },
      }} />

      <div className="text-center mb-16">
        <span className="text-yt-red font-semibold tracking-wide uppercase">For {useCase.niche}</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl font-playfair">{useCase.title}</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
          {useCase.description}
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-12">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">The Problem</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-700">{useCase.painPoint}</p>
        </div>
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-y border-gray-200 mt-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">The Solution</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-700">{useCase.solution}</p>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link href="/" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-yt-red hover:bg-red-700 md:text-xl transition-colors">
          Start Uploading Now
        </Link>
      </div>
    </main>
  )
}
