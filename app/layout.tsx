import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Providers from './providers'
import { SchemaMarkup } from '@/components/seo/schema-markup'
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://youtube-playlist-uploader.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'YouTube Bulk Uploader & Playlist Manager',
    template: '%s | YouTube Bulk Uploader & Playlist Manager',
  },
  description:
    'Upload entire folders of videos to YouTube in one click. Bulk upload, auto-generate playlists, and optimize metadata with AI — the fastest way to publish at scale.',
  keywords: ['youtube bulk uploader', 'youtube automation', 'playlist manager', 'youtube api uploader', 'bulk upload videos to youtube'],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'YouTube Bulk Uploader & Playlist Manager',
    description:
      'Upload entire folders of videos to YouTube in one click. Bulk upload, auto-generate playlists, and optimize metadata with AI.',
    url: siteUrl,
    siteName: 'YouTube Bulk Uploader & Playlist Manager',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YouTube Bulk Uploader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Bulk Uploader & Playlist Manager',
    description:
      'Upload entire folders of videos to YouTube in one click. Bulk upload, auto-generate playlists, and optimize metadata with AI.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-pearl text-charcoal font-sans antialiased selection:bg-yt-red selection:text-white">
        <Providers session={session}>
          <SchemaMarkup type="SoftwareApplication" data={{}} />
          {children}
        </Providers>
      </body>
    </html>
  )
}
