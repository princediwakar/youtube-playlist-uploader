'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Loader2, Lightbulb } from 'lucide-react'
import { generateTitles } from '@/app/actions/generate-titles'

export default function TitleGeneratorForm() {
  const [topic, setTopic] = useState('')
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setTitles([])

    const result = await generateTitles(topic)
    if (result.error) {
      setError(result.error)
    } else {
      setTitles(result.titles)
    }
    setLoading(false)
  }

  const copyToClipboard = async (title: string, index: number) => {
    await navigator.clipboard.writeText(title)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            What&apos;s your video about?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., how to edit videos in Final Cut Pro, top 10 travel hacks, React tutorial"
              className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-yt-blue focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {loading ? 'Generating...' : 'Generate Titles'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
      </form>

      {/* Results */}
      {titles.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yt-red" />
            <h3 className="text-lg font-semibold text-gray-900">Your AI-Generated Titles</h3>
          </div>

          <div className="space-y-3">
            {titles.map((title, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-yt-red/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-yt-red/10 flex items-center justify-center text-xs font-bold text-yt-red">
                    {index + 1}
                  </span>
                  <span className="text-sm sm:text-base text-gray-900 pt-0.5 break-words">
                    {title}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(title, index)}
                  className="flex-shrink-0 ml-3 p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-200"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(titles.join('\n'))
                setCopiedIndex(99)
                setTimeout(() => setCopiedIndex(null), 2000)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200"
            >
              {copiedIndex === 99 ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied All!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
