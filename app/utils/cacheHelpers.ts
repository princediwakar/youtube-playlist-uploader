export interface CachedPlaylist {
  id: string
  title: string
  itemCount: number
  lastFetched: number
  videos?: Array<{
    id: string
    title: string
    position: number
  }>
}

const CACHE_PREFIX = 'youtube_uploader_'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export function getCachedPlaylists(): CachedPlaylist[] {
  if (typeof window === 'undefined') return []

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}playlists`)
    if (!cached) return []

    const data = JSON.parse(cached)
    if (!Array.isArray(data)) return []

    // Filter out expired entries
    const now = Date.now()
    const valid = data.filter((item: CachedPlaylist) => now - item.lastFetched < CACHE_TTL)

    // Remove expired entries from cache
    if (valid.length !== data.length) {
      localStorage.setItem(`${CACHE_PREFIX}playlists`, JSON.stringify(valid))
    }

    return valid
  } catch (error) {
    console.error('Error reading playlist cache:', error)
    return []
  }
}

export function cachePlaylists(playlists: Omit<CachedPlaylist, 'lastFetched'>[]): void {
  if (typeof window === 'undefined') return

  try {
    const cachedPlaylists: CachedPlaylist[] = playlists.map(playlist => ({
      ...playlist,
      lastFetched: Date.now()
    }))

    localStorage.setItem(`${CACHE_PREFIX}playlists`, JSON.stringify(cachedPlaylists))
  } catch (error) {
    console.error('Error caching playlists:', error)
  }
}

export function getCachedPlaylistVideos(playlistId: string): CachedPlaylist['videos'] {
  if (typeof window === 'undefined') return undefined

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}playlist_${playlistId}`)
    if (!cached) return undefined

    const data = JSON.parse(cached)
    if (Date.now() - data.lastFetched > CACHE_TTL) {
      // Cache expired
      localStorage.removeItem(`${CACHE_PREFIX}playlist_${playlistId}`)
      return undefined
    }

    return data.videos
  } catch (error) {
    console.error('Error reading playlist videos cache:', error)
    return undefined
  }
}

export function cachePlaylistVideos(playlistId: string, videos: CachedPlaylist['videos']): void {
  if (typeof window === 'undefined') return

  try {
    const data = {
      videos,
      lastFetched: Date.now()
    }

    localStorage.setItem(`${CACHE_PREFIX}playlist_${playlistId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error caching playlist videos:', error)
  }
}

export function clearPlaylistCache(playlistId?: string): void {
  if (typeof window === 'undefined') return

  try {
    if (playlistId) {
      localStorage.removeItem(`${CACHE_PREFIX}playlist_${playlistId}`)
    } else {
      // Clear all playlist-related cache
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  } catch (error) {
    console.error('Error clearing playlist cache:', error)
  }
}