import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import type { Metadata } from 'next'
import Providers from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400'], // Light 300 for headlines, Regular 400 for body
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400'], // Regular 400 for accent/display
})

export const metadata: Metadata = {
  title: 'Universal YouTube Uploader',
  description: 'Upload any folder of videos to YouTube with smart playlists and descriptions',
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-pearl text-charcoal font-sans antialiased selection:bg-yt-red selection:text-white">
        <Providers session={undefined}>
          {children}
        </Providers>
      </body>
    </html>
  )
}