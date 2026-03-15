'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PlaylistItem } from '@/app/types/video'

export function usePlaylistManager() {
  const { data: session } = useSession()

  // Cache constants
  const PLAYLIST_CACHE_KEY = 'youtube_playlists_cache'
  const PLAYLIST_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
  const PLAYLIST_VIDEOS_CACHE_KEY = 'youtube_playlist_videos_cache'
  const PLAYLIST_VIDEOS_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

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
  }, [PLAYLIST_CACHE_KEY, PLAYLIST_CACHE_DURATION])

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
  }, [PLAYLIST_CACHE_KEY])

  const clearPlaylistCache = useCallback(() => {
    try {
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      console.log('Playlist cache cleared')
    } catch (error) {
      console.error('Error clearing playlist cache:', error)
    }
  }, [PLAYLIST_CACHE_KEY])

  // Playlist videos cache utility functions
  const getCachedPlaylistVideos = useCallback((playlistId: string): { videos: any[], timestamp: number } | null => {
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
  }, [PLAYLIST_VIDEOS_CACHE_KEY, PLAYLIST_VIDEOS_CACHE_DURATION])

  const setCachedPlaylistVideos = useCallback((playlistId: string, videos: any[]) => {
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
  }, [PLAYLIST_VIDEOS_CACHE_KEY])

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
  }, [PLAYLIST_VIDEOS_CACHE_KEY])

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

      const response = await fetch('/api/youtube/playlist', {
        method: 'GET'
      })

      console.log('Playlist response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Playlist data received:', {
          success: data.success,
          playlistsCount: data.playlists?.length,
          playlists: data.playlists?.map((p: any) => ({ id: p.id, title: p.snippet?.title })),
          isMockData: data.isMockData
        })

        const playlists = data.playlists || []
        setAvailablePlaylists(playlists)

        // Cache the playlists (only if not mock data)
        if (!data.isMockData) {
          setCachedPlaylists(playlists)
        }

        // Show notification if using mock data
        if (data.isMockData) {
          alert('⚠️ Using mock playlist data due to YouTube API quota exceeded. This is for development purposes only.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch playlists:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })

        // Show user-friendly error message for quota issues
        if (response.status === 429 || (errorData.error && errorData.error.includes('quota'))) {
          alert('YouTube API quota exceeded. Please try again tomorrow or request a quota increase from Google Cloud Console.')
        } else if (response.status === 401) {
          alert('Authentication expired. Please sign out and sign in again.')
        } else {
          alert(`Failed to fetch playlists: ${errorData.details || errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }, [session?.accessToken, getCachedPlaylists, setCachedPlaylists])

  // Fetch existing playlist videos
  const fetchExistingPlaylistVideos = useCallback(async (playlistId: string, forceRefresh = false): Promise<any[]> => {
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
      const response = await fetch(`/api/youtube/playlist-videos?playlistId=${playlistId}`, {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        const videos = data.videos || []
        setExistingPlaylistVideos(videos)

        // Cache the playlist videos
        setCachedPlaylistVideos(playlistId, videos)
        return videos
      } else {
        console.error('Failed to fetch existing playlist videos')
        setExistingPlaylistVideos([])
        return []
      }
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