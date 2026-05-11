'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { FileProvider, PlaylistProvider, UploadProvider, SettingsProvider } from '@/app/contexts'

export default function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <FileProvider>
        <PlaylistProvider>
          <UploadProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </UploadProvider>
        </PlaylistProvider>
      </FileProvider>
    </SessionProvider>
  )
}