import { auth } from '@/lib/auth'
import AppShell from '@/app/components/AppShell'

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'YouTube Bulk Uploader & Playlist Manager',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description:
      'Upload entire folders of videos to YouTube in one click. Bulk upload, auto-generate playlists, and optimize metadata with AI.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://youtube-playlist-uploader.vercel.app',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'YouTube Bulk Uploader',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'YouTube Bulk Uploader & Playlist Manager',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://youtube-playlist-uploader.vercel.app',
  }
]

export default async function HomePage() {
  const session = await auth()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppShell session={session} />
    </>
  )
}
