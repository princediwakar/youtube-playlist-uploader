'use client'

import { useState } from 'react'
import { AlignLeft, Copy, Check, Loader2 } from 'lucide-react'
import { generateDescription } from '@/app/actions/generate-description'

export default function DescriptionGeneratorForm() {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setDescription('')

    const result = await generateDescription(topic)
    if (result.error) {
      setError(result.error)
    } else {
      setDescription(result.description)
    }
    setLoading(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
              className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <AlignLeft className="w-5 h-5" />
              )}
              {loading ? 'Generating...' : 'Generate Description'}
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
      {description && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Your AI-Generated Description</h3>
            </div>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={description}
              className="w-full min-h-[300px] p-5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:outline-none text-sm leading-relaxed resize-y"
            />
          </div>
        </div>
      )}
    </div>
  )
}
