import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import IdeaGeneratorForm from './IdeaGeneratorForm'

export const metadata: Metadata = {
  title: 'Free YouTube Video Idea Generator — 10 Viral Concepts',
  description: 'Never run out of content ideas. Generate 10 viral video concepts for your niche instantly. Free AI idea generator tool — no sign-up required.',
  keywords: ['youtube idea generator', 'free youtube video ideas', 'ai youtube video ideas', 'youtube content ideas'],
  alternates: {
    canonical: '/tools/idea-generator',
  },
  openGraph: {
    title: 'Free YouTube Video Idea Generator — 10 Viral Concepts',
    description: 'Never run out of content ideas. Generate 10 viral video concepts for your niche instantly. Free tool — no sign-up required.',
  },
}

export default function IdeaGeneratorPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600">
              <Lightbulb size={14} />
              <span>Free Tool — No Sign-Up Required</span>
            </div>
            <h1 className="heading-lg">
              YouTube Idea Generator
            </h1>
            <p className="body-lg max-w-xl mx-auto">
              Enter your niche or a broad topic and get 10 highly engaging, viral-potential video concepts instantly.
            </p>
          </div>

          {/* Form */}
          <IdeaGeneratorForm />

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-slate/10 text-center space-y-4">
            <h2 className="heading-md">
              Need to upload <span className="text-purple-600">50 videos at once?</span>
            </h2>
            <p className="body-md max-w-lg mx-auto">
              Once you have the ideas, our bulk uploader handles the heavy lifting. Auto-generate titles, descriptions, and tags for every video in your batch.
            </p>
            <Link
              href="/"
              className="group relative inline-flex px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 items-center gap-2"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
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
            Just need ideas? Try the tool above. Ready to scale your workflow?{' '}
            <Link href="/" className="text-purple-600 hover:underline font-medium">Try our bulk uploader</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
