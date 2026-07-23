import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Hash, AlignLeft, Lightbulb, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free YouTube SEO Tools — Boost Your Channel',
  description: 'A suite of free AI-powered tools for YouTube creators. Generate titles, tags, descriptions, and video ideas in seconds.',
  keywords: ['youtube tools', 'youtube seo tools', 'youtube title generator', 'youtube tag generator', 'youtube description generator', 'youtube idea generator'],
  alternates: {
    canonical: '/tools',
  },
}

const tools = [
  {
    title: 'Title Generator',
    description: 'Generate 5 highly clickable, SEO-optimized YouTube video titles for any topic.',
    icon: Sparkles,
    href: '/tools/title-generator',
    color: 'bg-yt-red/10 text-yt-red',
  },
  {
    title: 'Description Generator',
    description: 'Create engaging, keyword-rich YouTube descriptions that rank higher in search.',
    icon: AlignLeft,
    href: '/tools/description-generator',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    title: 'Tag Generator',
    description: 'Find the best performing tags and keywords for your next YouTube video.',
    icon: Hash,
    href: '/tools/tag-generator',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    title: 'Idea Generator',
    description: 'Never run out of content ideas. Generate 10 viral video concepts for your niche.',
    icon: Lightbulb,
    href: '/tools/idea-generator',
    color: 'bg-purple-500/10 text-purple-600',
  },
]

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-1.5" size={16} />
            Back to Home
          </Link>
        </div>

        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Free YouTube Creator Tools
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Supercharge your channel growth with our suite of AI-powered SEO tools. 
            No sign-up required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group block bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl flex-shrink-0 ${tool.color}`}>
                  <tool.icon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-yt-red transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-gray-200 text-center space-y-6 bg-white rounded-3xl p-10 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Ready to completely automate your workflow?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our bulk uploader handles titles, descriptions, and tags for multiple videos simultaneously. 
            Upload entire folders and publish in minutes.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Try the Bulk Uploader Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
