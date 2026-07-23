import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlignLeft } from 'lucide-react'
import DescriptionGeneratorForm from './DescriptionGeneratorForm'

export const metadata: Metadata = {
  title: 'Free YouTube Description Generator — AI SEO Descriptions',
  description: 'Generate engaging, keyword-rich YouTube video descriptions for any topic. Free AI description generator tool — no sign-up required.',
  keywords: ['youtube description generator', 'free youtube description generator', 'ai youtube description generator', 'seo youtube descriptions'],
  alternates: {
    canonical: '/tools/description-generator',
  },
  openGraph: {
    title: 'Free YouTube Description Generator — AI SEO Descriptions',
    description: 'Generate engaging, keyword-rich YouTube video descriptions for any topic. Free tool — no sign-up required.',
  },
}

export default function DescriptionGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-1.5" size={16} />
            Back to Tools
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-10">
          {/* Header */}
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
              <AlignLeft size={14} />
              <span>Free Tool — No Sign-Up Required</span>
            </div>
            <h1 className="heading-lg">
              YouTube Description Generator
            </h1>
            <p className="body-lg max-w-xl mx-auto">
              Enter a topic and get an engaging, keyword-rich video description powered by AI. 
              Perfect for your next video — or your next 50.
            </p>
          </div>

          {/* Form */}
          <DescriptionGeneratorForm />

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-slate/10 text-center space-y-4">
            <h2 className="heading-md">
              Need to generate descriptions for{' '}
              <span className="text-blue-600">50 videos at once?</span>
            </h2>
            <p className="body-md max-w-lg mx-auto">
              Our bulk uploader auto-generates titles, descriptions, and tags for every video in your batch.
              Upload an entire folder and publish in minutes.
            </p>
            <Link
              href="/"
              className="group relative inline-flex px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 items-center gap-2"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <span className="relative">Try the Bulk Uploader Free</span>
              <svg className="w-5 h-5 relative transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Just need one description? Try the tool above. Ready to scale?{' '}
            <Link href="/" className="text-blue-600 hover:underline font-medium">Try our bulk uploader</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
