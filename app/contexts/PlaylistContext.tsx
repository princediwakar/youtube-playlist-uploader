'use client'

import { createContext, useContext, useCallback } from 'react'
import { useAppStore } from '@/app/store'
import type { PlaylistItem, YouTubePlaylistVideo } from '@/app/types/video'
import { getPlaylists, getPlaylistVideos } from '@/app/actions/playlist'

const PLAYLIST_CACHE_KEY = 'youtube_playlists_cache'
const PLAYLIST_CACHE_DURATION = 30 * 60 * 1000
const PLAYLIST_VIDEOS_CACHE_KEY = 'youtube_playlist_videos_cache'
const PLAYLIST_VIDEOS_CACHE_DURATION = 15 * 60 * 1000

interface PlaylistContextValue {
  availablePlaylists: PlaylistItem[]
  loadingPlaylists: boolean
  existingPlaylistVideos: YouTubePlaylistVideo[]
  loadingExistingVideos: boolean
  setAvailablePlaylists: (playlists: PlaylistItem[]) => void
  setExistingPlaylistVideos: (videos: YouTubePlaylistVideo[]) => void
  fetchUserPlaylists: (accessToken: string, forceRefresh?: boolean) => Promise<void>
  fetchExistingPlaylistVideos: (accessToken: string, playlistId: string, forceRefresh?: boolean) => Promise<YouTubePlaylistVideo[]>
  clearPlaylistCache: () => void
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null)

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const availablePlaylists = useAppStore((s) => s.availablePlaylists)
  const loadingPlaylists = useAppStore((s) => s.loadingPlaylists)
  const existingPlaylistVideos = useAppStore((s) => s.existingPlaylistVideos)
  const loadingExistingVideos = useAppStore((s) => s.loadingExistingVideos)
  const setAvailablePlaylists = useAppStore((s) => s.setAvailablePlaylists)
  const setExistingPlaylistVideos = useAppStore((s) => s.setExistingPlaylistVideos)
  const setLoadingPlaylists = useAppStore((s) => s.setLoadingPlaylists)
  const setLoadingExistingVideos = useAppStore((s) => s.setLoadingExistingVideos)

  const getCachedPlaylists = useCallback((): { playlists: PlaylistItem[], timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(PLAYLIST_CACHE_KEY)
      if (!cached) return null
      const parsed = JSON.parse(cached)
      const now = Date.now()
      if (now - parsed.timestamp < PLAYLIST_CACHE_DURATION) {
        return parsed
      }
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      return null
    } catch {
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      return null
    }
  }, [])

  const setCachedPlaylists = useCallback((playlists: PlaylistItem[]) => {
    try {
      localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify({ playlists, timestamp: Date.now() }))
    } catch (error) {
      console.error('Error caching playlists:', error)
    }
  }, [])

  const getCachedPlaylistVideos = useCallback((playlistId: string): { videos: YouTubePlaylistVideo[], timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
      if (!cached) return null
      const parsed = JSON.parse(cached)
      const now = Date.now()
      if (now - parsed.timestamp < PLAYLIST_VIDEOS_CACHE_DURATION) {
        return parsed
      }
      localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
      return null
    } catch {
      localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
      return null
    }
  }, [])

  const setCachedPlaylistVideos = useCallback((playlistId: string, videos: YouTubePlaylistVideo[]) => {
    try {
      localStorage.setItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`, JSON.stringify({ videos, timestamp: Date.now() }))
    } catch (error) {
      console.error('Error caching playlist videos:', error)
    }
  }, [])

  const fetchUserPlaylists = useCallback(async (accessToken: string, forceRefresh = false) => {
    if (!accessToken) return

    if (!forceRefresh) {
      const cached = getCachedPlaylists()
      if (cached) {
        setAvailablePlaylists(cached.playlists)
        return
      }
    }

    try {
      setLoadingPlaylists(true)
      const result = await getPlaylists()
      const playlists = result.playlists || []
      setAvailablePlaylists(playlists)
      setCachedPlaylists(playlists)
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }, [getCachedPlaylists, setAvailablePlaylists, setCachedPlaylists, setLoadingPlaylists])

  const fetchExistingPlaylistVideos = useCallback(async (accessToken: string, playlistId: string, forceRefresh = false): Promise<YouTubePlaylistVideo[]> => {
    if (!accessToken) return []

    if (!forceRefresh) {
      const cached = getCachedPlaylistVideos(playlistId)
      if (cached) {
        setExistingPlaylistVideos(cached.videos)
        return cached.videos
      }
    }

    try {
      setLoadingExistingVideos(true)
      const result = await getPlaylistVideos(playlistId)
      const videos = result.videos || []
      setExistingPlaylistVideos(videos)
      setCachedPlaylistVideos(playlistId, videos)
      return videos
    } catch (error) {
      console.error('Error fetching playlist videos:', error)
      setExistingPlaylistVideos([])
      return []
    } finally {
      setLoadingExistingVideos(false)
    }
  }, [getCachedPlaylistVideos, setExistingPlaylistVideos, setCachedPlaylistVideos, setLoadingExistingVideos])

  const clearPlaylistCache = useCallback(() => {
    try {
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
    } catch (error) {
      console.error('Error clearing playlist cache:', error)
    }
  }, [])

  const value: PlaylistContextValue = {
    availablePlaylists,
    loadingPlaylists,
    existingPlaylistVideos,
    loadingExistingVideos,
    setAvailablePlaylists,
    setExistingPlaylistVideos,
    fetchUserPlaylists,
    fetchExistingPlaylistVideos,
    clearPlaylistCache,
  }

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylistContext(): PlaylistContextValue {
  const ctx = useContext(PlaylistContext)
  if (!ctx) {
    throw new Error('usePlaylistContext must be used within a PlaylistProvider')
  }
  return ctx
}