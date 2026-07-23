import { alternatives } from '@/lib/seo-data'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { SchemaMarkup } from '@/components/seo/schema-markup'
import Link from 'next/link'

export function generateStaticParams() {
  return alternatives.map((alt) => ({
    slug: alt.slug,
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const alt = alternatives.find((a) => a.slug === params.slug)
  if (!alt) return {}

  return {
    title: alt.title,
    description: alt.description,
  }
}

export default function AlternativePage({ params }: { params: { slug: string } }) {
  const alt = alternatives.find((a) => a.slug === params.slug)
  
  if (!alt) {
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <SchemaMarkup type="Article" data={{
        headline: alt.title,
        description: alt.description,
        author: { '@type': 'Organization', name: 'YouTube Playlist Uploader' },
      }} />

      <div className="text-center mb-16">
        <span className="text-yt-red font-semibold tracking-wide uppercase">Comparison</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl font-playfair">{alt.title}</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
          {alt.description}
        </p>
      </div>

      <div className="mt-12 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Feature</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-yt-red">YouTube Playlist Uploader</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-500">{alt.competitor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alt.comparisonPoints.map((point, idx) => (
              <tr key={idx}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{point.feature}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 bg-red-50 font-semibold">{point.us}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{point.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-12">
        <Link href="/" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-yt-red hover:bg-red-700 md:text-xl transition-colors">
          Try the Better Alternative
        </Link>
      </div>
    </main>
  )
}
