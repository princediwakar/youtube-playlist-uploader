import { useCases } from '@/lib/seo-data'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Batch Upload Use Cases for YouTube',
  description: 'See how different industries use our tool to batch upload and optimize their video archives on YouTube.',
}

export default function UseCasesHub() {
  // Group use cases by category
  const categories = useCases.reduce((acc, useCase) => {
    if (!acc[useCase.category]) {
      acc[useCase.category] = []
    }
    acc[useCase.category].push(useCase)
    return acc
  }, {} as Record<string, typeof useCases>)

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-white">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 font-playfair sm:text-5xl">
          Upload Anything to YouTube
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Discover how creators and businesses automate their YouTube workflow.
        </p>
      </div>

      <div className="space-y-16">
        {Object.entries(categories).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <Link 
                  key={item.slug} 
                  href={`/use-cases/${item.slug}`}
                  className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-yt-red hover:shadow-md transition-all group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yt-red mb-2">
                    {item.niche}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
