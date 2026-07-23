'use client'

import { useState } from 'react'
import { Lightbulb, Copy, Check, Loader2, PlayCircle } from 'lucide-react'
import { generateIdeas } from '@/app/actions/generate-ideas'

type Idea = {
  title: string
  hook: string
}

export default function IdeaGeneratorForm() {
  const [topic, setTopic] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setIdeas([])

    const result = await generateIdeas(topic)
    if (result.error) {
      setError(result.error)
    } else {
      setIdeas(result.ideas)
    }
    setLoading(false)
  }

  const copyToClipboard = async (idea: Idea, index: number) => {
    const textToCopy = `${idea.title}\n\nConcept: ${idea.hook}`
    await navigator.clipboard.writeText(textToCopy)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = async () => {
    const textToCopy = ideas.map((idea, index) => `${index + 1}. ${idea.title}\n   Concept: ${idea.hook}`).join('\n\n')
    await navigator.clipboard.writeText(textToCopy)
    setCopiedIndex(99)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            What&apos;s your channel niche or topic?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., productivity for students, vegan cooking, tech reviews"
              className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-0 focus:outline-none text-sm placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lightbulb className="w-5 h-5" />
              )}
              {loading ? 'Generating...' : 'Generate Ideas'}
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
      {ideas.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Your Viral Video Concepts</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="group relative flex flex-col p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-purple-500/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-600">
                      {index + 1}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 leading-tight pt-1">
                      {idea.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(idea, index)}
                    className="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-200"
                    title="Copy idea"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-gray-600 mt-auto pt-4 border-t border-gray-200/50">
                  <PlayCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                  <p className="leading-relaxed">{idea.hook}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              {copiedIndex === 99 ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied All Ideas!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All Ideas
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
