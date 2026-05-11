'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PlaylistItem, YouTubePlaylistVideo } from '@/app/types/video'
import { getPlaylists, getPlaylistVideos } from '@/app/actions/playlist'

// Cache constants — module scope so useCallback deps are stable across renders
const PLAYLIST_CACHE_KEY = 'youtube_playlists_cache'
const PLAYLIST_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const PLAYLIST_VIDEOS_CACHE_KEY = 'youtube_playlist_videos_cache'
const PLAYLIST_VIDEOS_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

export function usePlaylistManager() {
  const { data: session } = useSession()

  // State
  const [availablePlaylists, setAvailablePlaylists] = useState<PlaylistItem[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [existingPlaylistVideos, setExistingPlaylistVideos] = useState<Array<{
    videoId: string
    title: string
    position: number
  }>>([])
  const [loadingExistingVideos, setLoadingExistingVideos] = useState(false)

  // Cache utility functions
  const getCachedPlaylists = useCallback((): { playlists: PlaylistItem[], timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(PLAYLIST_CACHE_KEY)
      if (!cached) return null

      const parsed = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - parsed.timestamp < PLAYLIST_CACHE_DURATION) {
        console.log('Using cached playlists (age:', Math.round((now - parsed.timestamp) / 1000 / 60), 'minutes)')
        return parsed
      } else {
        console.log('Playlist cache expired, will fetch fresh data')
        localStorage.removeItem(PLAYLIST_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.error('Error reading playlist cache:', error)
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      return null
    }
  }, [])

  const setCachedPlaylists = useCallback((playlists: PlaylistItem[]) => {
    try {
      const cacheData = {
        playlists,
        timestamp: Date.now()
      }
      localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(cacheData))
      console.log('Playlists cached successfully')
    } catch (error) {
      console.error('Error caching playlists:', error)
    }
  }, [])

  const clearPlaylistCache = useCallback(() => {
    try {
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      console.log('Playlist cache cleared')
    } catch (error) {
      console.error('Error clearing playlist cache:', error)
    }
  }, [])

  // Playlist videos cache utility functions
  const getCachedPlaylistVideos = useCallback((playlistId: string): { videos: YouTubePlaylistVideo[], timestamp: number } | null => {
    try {
      const cacheKey = `${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const parsed = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - parsed.timestamp < PLAYLIST_VIDEOS_CACHE_DURATION) {
        console.log('Using cached playlist videos for', playlistId, '(age:', Math.round((now - parsed.timestamp) / 1000 / 60), 'minutes)')
        return parsed
      } else {
        console.log('Playlist videos cache expired for', playlistId, ', will fetch fresh data')
        localStorage.removeItem(cacheKey)
        return null
      }
    } catch (error) {
      console.error('Error reading playlist videos cache:', error)
      localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
      return null
    }
  }, [])

  const setCachedPlaylistVideos = useCallback((playlistId: string, videos: YouTubePlaylistVideo[]) => {
    try {
      const cacheKey = `${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`
      const cacheData = {
        videos,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log('Playlist videos cached successfully for', playlistId)
    } catch (error) {
      console.error('Error caching playlist videos:', error)
    }
  }, [])

  const clearPlaylistVideosCache = useCallback((playlistId?: string) => {
    try {
      if (playlistId) {
        // Clear specific playlist cache
        localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
        console.log('Playlist videos cache cleared for', playlistId)
      } else {
        // Clear all playlist videos cache
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(PLAYLIST_VIDEOS_CACHE_KEY)) {
            localStorage.removeItem(key)
          }
        })
        console.log('All playlist videos cache cleared')
      }
    } catch (error) {
      console.error('Error clearing playlist videos cache:', error)
    }
  }, [])

  // Fetch user playlists
  const fetchUserPlaylists = useCallback(async (forceRefresh = false) => {
    if (!session?.accessToken) return

    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = getCachedPlaylists()
      if (cached) {
        setAvailablePlaylists(cached.playlists)
        return
      }
    }

    try {
      setLoadingPlaylists(true)
      console.log('Fetching user playlists...')

      const result = await getPlaylists()

      console.log('Playlist response:', {
        success: result.success,
        playlistsCount: result.playlists?.length
      })

      const playlists = result.playlists || []
      setAvailablePlaylists(playlists)

      // Cache the playlists
      setCachedPlaylists(playlists)

    } catch (error) {
      console.error('Error fetching playlists:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlists'
      
      if (errorMessage.includes('quota') || errorMessage.includes('quotaExceeded')) {
        alert('YouTube API quota exceeded. Please try again tomorrow or request a quota increase from Google Cloud Console.')
      } else if (errorMessage.includes('expired') || errorMessage.includes('unauthorized')) {
        alert('Authentication expired. Please sign out and sign in again.')
      } else {
        alert(`Failed to fetch playlists: ${errorMessage}`)
      }
    } finally {
      setLoadingPlaylists(false)
    }
  }, [session?.accessToken, getCachedPlaylists, setCachedPlaylists])

  // Fetch existing playlist videos
  const fetchExistingPlaylistVideos = useCallback(async (playlistId: string, forceRefresh = false): Promise<YouTubePlaylistVideo[]> => {
    if (!session?.accessToken) return []

    // Check cache first (unless force refresh is requested)
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

      // Cache the playlist videos
      setCachedPlaylistVideos(playlistId, videos)
      return videos
    } catch (error) {
      console.error('Error fetching existing playlist videos:', error)
      setExistingPlaylistVideos([])
      return []
    } finally {
      setLoadingExistingVideos(false)
    }
  }, [session?.accessToken, getCachedPlaylistVideos, setCachedPlaylistVideos])

  return {
    // State
    availablePlaylists,
    loadingPlaylists,
    existingPlaylistVideos,
    loadingExistingVideos,

    // Setters
    setAvailablePlaylists,
    setExistingPlaylistVideos,

    // Functions
    fetchUserPlaylists,
    fetchExistingPlaylistVideos,
    clearPlaylistCache,
    clearPlaylistVideosCache
  }
}