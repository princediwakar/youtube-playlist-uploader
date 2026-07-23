import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { getPostBySlug, blogPosts } from '@/content/blog/index'
import { markdownToHtml } from '@/app/lib/markdown'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: `${post.title} | YouTube Bulk Uploader`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const htmlContent = markdownToHtml(post.content)

  return (
    <div className="min-h-screen bg-pearl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-slate hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Blog
          </Link>
        </div>

        <article>
          <header className="mb-10">
            <div className="flex items-center gap-3 text-sm text-slate/70 mb-4">
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} />
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag size={14} />
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                {post.readingTime}
              </span>
            </div>

            <h1 className="heading-xl mb-4">{post.title}</h1>
            <p className="body-lg text-slate/70">{post.description}</p>
          </header>

          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        <div className="mt-16 pt-8 border-t border-slate/20">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-slate hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to all articles
          </Link>
        </div>
      </div>
    </div>
  )
}
