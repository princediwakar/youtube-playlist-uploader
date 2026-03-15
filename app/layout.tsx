import './globals.css'
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import Providers from './providers'

const bricolage = Bricolage_Grotesque({ 
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const dmMono = DM_Mono({ 
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Universal YouTube Uploader',
  description: 'Upload any folder of videos to YouTube with smart playlists and descriptions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmMono.variable}`}>
      <body className="bg-yt-bg text-yt-text-primary font-sans antialiased selection:bg-youtube-neon selection:text-white">
        <Providers session={undefined}>
          {children}
        </Providers>
      </body>
    </html>
  )
}