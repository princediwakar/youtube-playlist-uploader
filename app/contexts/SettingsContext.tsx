'use client'

import { createContext, useContext } from 'react'
import { useAppStore } from '@/app/store'
import type { UploadSettings } from '@/app/types/video'

interface SettingsContextValue {
  uploadSettings: UploadSettings
  setUploadSettings: (settings: UploadSettings | ((prev: UploadSettings) => UploadSettings)) => void
  showAdvancedSettings: boolean
  setShowAdvancedSettings: (show: boolean) => void
  currentPlaylistId: string | null
  setCurrentPlaylistId: (id: string | null) => void
  authError: string | null
  setAuthError: (error: string | null) => void
}

const defaultSettings: UploadSettings = {
  playlistName: '',
  privacyStatus: 'private',
  maxVideos: 10,
  contentType: 'auto',
  uploadMode: 'playlist',
  madeForKids: false,
  category: '27',
  titleFormat: 'cleaned',
  customTitlePrefix: '',
  customTitleSuffix: '',
  addPlaylistNavigation: true,
  useExistingPlaylist: false,
  selectedPlaylistId: '',
  audioCategory: '10',
  generateAudioFrames: true,
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useAppStore((s) => s.settings)
  const showAdvancedSettings = useAppStore((s) => s.showAdvancedSettings)
  const currentPlaylistId = useAppStore((s) => s.currentPlaylistId)
  const authError = useAppStore((s) => s.authError)
  const setSettings = useAppStore((s) => s.setSettings)
  const setShowAdvancedSettings = useAppStore((s) => s.setShowAdvancedSettings)
  const setCurrentPlaylistId = useAppStore((s) => s.setCurrentPlaylistId)
  const setAuthError = useAppStore((s) => s.setAuthError)

  const uploadSettings = settings || defaultSettings

  const value: SettingsContextValue = {
    uploadSettings,
    setUploadSettings: setSettings,
    showAdvancedSettings,
    setShowAdvancedSettings,
    currentPlaylistId,
    setCurrentPlaylistId,
    authError,
    setAuthError,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return ctx
}