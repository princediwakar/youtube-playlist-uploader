import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { blogPosts } from '@/content/blog/index'

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-pearl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="heading-xl mb-4">Blog</h1>
          <p className="body-lg">
            Tips, strategies, and guides for YouTube creators who want to publish
            smarter, not harder.
          </p>
        </div>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="card card-hover group"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex items-center gap-3 text-xs text-slate/70 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Tag size={12} />
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="heading-md mb-2 group-hover:text-yt-red transition-colors">
                  {post.title}
                </h2>

                <p className="body-md text-slate/70">
                  {post.description}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
