import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Providers from './providers'

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

export const metadata: Metadata = {
  title: 'Universal YouTube Uploader',
  description: 'Upload any folder of videos to YouTube with smart playlists and descriptions',
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
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
          {children}
        </Providers>
      </body>
    </html>
  )
}
