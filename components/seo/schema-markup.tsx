import Script from 'next/script'

type SchemaType = 'SoftwareApplication' | 'FAQPage' | 'Article'

interface SchemaMarkupProps {
  type: SchemaType
  data: any
}

export function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  let schema = {}

  if (type === 'SoftwareApplication') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'YouTube Playlist Uploader',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
      },
      description: 'Upload entire folders of videos to YouTube in one click. Bulk upload, auto-generate playlists, and optimize metadata with AI.',
      ...data,
    }
  } else if (type === 'FAQPage') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.map((faq: any) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }
  } else if (type === 'Article') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      ...data,
    }
  }

  return (
    <Script
      id={`schema-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
