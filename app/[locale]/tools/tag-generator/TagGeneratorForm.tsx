'use client'

import { useState } from 'react'
import { Hash, Copy, Check, Loader2 } from 'lucide-react'
import { generateTags } from '@/app/actions/generate-tags'

export default function TagGeneratorForm() {
  const [topic, setTopic] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setTags([])

    const result = await generateTags(topic)
    if (result.error) {
      setError(result.error)
    } else {
      setTags(result.tags)
    }
    setLoading(false)
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
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
              className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Hash className="w-5 h-5" />
              )}
              {loading ? 'Generating...' : 'Generate Tags'}
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
      {tags.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Your AI-Generated Tags</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <button
                key={index}
                onClick={() => copyToClipboard(tag, index)}
                className="group flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 hover:border-green-500/50 hover:bg-green-50/50 transition-all duration-200"
                title="Copy tag"
              >
                <span className="text-sm text-gray-900 group-hover:text-green-700 transition-colors">
                  {tag}
                </span>
                {copiedIndex === index ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(tags.join(', '))
                setCopiedIndex(99)
                setTimeout(() => setCopiedIndex(null), 2000)
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              {copiedIndex === 99 ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied All Tags!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All as Comma-Separated
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
