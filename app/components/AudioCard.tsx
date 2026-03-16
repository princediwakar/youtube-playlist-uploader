'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Scissors, Image as ImageIcon, Music, Headphones, BookOpen } from 'lucide-react'
import { AudioFile } from '@/app/types/media'
import { WaveformVisualizer } from './WaveformVisualizer'

interface AudioCardProps {
  audio: AudioFile
  onPlay?: () => void
  onPause?: () => void
  onSeek?: (time: number) => void
  onGenerateFrame?: (audio: AudioFile, template: AudioFrameTemplate) => void
  onTrim?: (start: number, end: number) => void
  className?: string
}

export type AudioFrameTemplate = 'music' | 'podcast' | 'audiobook' | 'custom'

export interface AudioFrameOptions {
  template: AudioFrameTemplate
  showTitle: boolean
  showMetadata: boolean
  backgroundColor: string
  waveformColor: string
  textColor: string
  customText?: string
}

export function AudioCard({
  audio,
  onPlay,
  onPause,
  onSeek,
  onGenerateFrame,
  onTrim,
  className = ''
}: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(audio.duration || 0)
  const [volume, setVolume] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<AudioFrameTemplate>('music')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(duration)
  const [showFramePreview, setShowFramePreview] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current && audio.file) {
      const audioUrl = URL.createObjectURL(audio.file)
      const audioElement = new Audio(audioUrl)
      audioRef.current = audioElement

      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration)
        setTrimEnd(audioElement.duration)
      })

      audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration > 0) {
          setCurrentTime(audioElement.currentTime / audioElement.duration)
        }
      })

      audioElement.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current)
          playIntervalRef.current = null
        }
      })

      return () => {
        if (audioRef.current) {
          audioRef.current.pause()
          URL.revokeObjectURL(audioUrl)
        }
      }
    }
  }, [audio.file])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      onPause?.()
    } else {
      audioRef.current.play()
      playIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime / audioRef.current.duration)
        }
      }, 100)
      onPlay?.()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (normalizedTime: number) => {
    if (!audioRef.current) return

    const newTime = normalizedTime * audioRef.current.duration
    audioRef.current.currentTime = newTime
    setCurrentTime(normalizedTime)
    onSeek?.(newTime)
  }

  const handleSkipBack = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
  }

  const handleSkipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(
      audioRef.current.duration,
      audioRef.current.currentTime + 10
    )
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleGenerateFrame = () => {
    onGenerateFrame?.(audio, selectedTemplate)
  }

  const handleTrim = () => {
    if (trimStart >= 0 && trimEnd <= duration && trimStart < trimEnd) {
      onTrim?.(trimStart, trimEnd)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTemplateIcon = (template: AudioFrameTemplate) => {
    switch (template) {
      case 'music': return <Music size={16} />
      case 'podcast': return <Headphones size={16} />
      case 'audiobook': return <BookOpen size={16} />
      default: return <ImageIcon size={16} />
    }
  }

  const getTemplateColor = (template: AudioFrameTemplate) => {
    switch (template) {
      case 'music': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'podcast': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'audiobook': return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    }
  }

  return (
    <div className={`bg-yt-bg rounded-xl border border-yt-border p-4 ${className}`}>
      {/* Header with audio info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yt-text-primary truncate">
            {audio.name.replace(/\.[^/.]+$/, '')}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-yt-text-secondary">
              {audio.size} • {formatTime(duration)}
            </span>
            {audio.audioFormat && (
              <span className="text-xs px-1.5 py-0.5 bg-yt-hover rounded">
                {audio.audioFormat}
              </span>
            )}
            {audio.bitrate && (
              <span className="text-xs px-1.5 py-0.5 bg-yt-hover rounded">
                {audio.bitrate}kbps
              </span>
            )}
          </div>
          {audio.artist && (
            <p className="text-xs text-yt-text-secondary mt-1">
              Artist: {audio.artist}
              {audio.album && ` • Album: ${audio.album}`}
              {audio.genre && ` • Genre: ${audio.genre}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFramePreview(!showFramePreview)}
            className="p-2 rounded-lg hover:bg-yt-hover transition-colors"
            title="Toggle frame preview"
          >
            <ImageIcon size={16} className="text-yt-text-secondary" />
          </button>
        </div>
      </div>

      {/* Main waveform visualization */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-xs text-yt-text-secondary">
            {formatTime(currentTime * duration)} / {formatTime(duration)}
          </span>
          <div className="flex items-center gap-1">
            <Volume2 size={14} className="text-yt-text-secondary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-yt-hover rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yt-text-primary"
            />
          </div>
        </div>

        <WaveformVisualizer
          waveform={audio.waveform || []}
          width="100%"
          height={100}
          color="#ff0000"
          backgroundColor="#0f0f0f"
          interactive={true}
          currentTime={currentTime}
          onSeek={handleSeek}
          className="rounded-lg overflow-hidden"
        />
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-full hover:bg-yt-hover transition-colors"
          title="Skip back 10 seconds"
        >
          <SkipBack size={18} className="text-yt-text-primary" />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} className="text-white" />
          ) : (
            <Play size={20} className="text-white" />
          )}
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 rounded-full hover:bg-yt-hover transition-colors"
          title="Skip forward 10 seconds"
        >
          <SkipForward size={18} className="text-yt-text-primary" />
        </button>
      </div>

      {/* Frame generation controls */}
      <div className="border-t border-yt-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-yt-text-secondary uppercase tracking-wider">
            Video Frame Generation
          </h4>
          <button
            onClick={handleGenerateFrame}
            className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            <ImageIcon size={12} />
            Generate Frame
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['music', 'podcast', 'audiobook'] as AudioFrameTemplate[]).map((template) => (
            <button
              key={template}
              onClick={() => setSelectedTemplate(template)}
              className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                selectedTemplate === template
                  ? getTemplateColor(template)
                  : 'border-yt-border hover:bg-yt-hover'
              }`}
            >
              {getTemplateIcon(template)}
              <span className="text-xs mt-1 capitalize">{template}</span>
            </button>
          ))}
        </div>

        {/* Template preview */}
        {showFramePreview && (
          <div className="mt-3 p-3 bg-yt-hover rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-yt-text-primary">
                {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template Preview
              </span>
              <div className={`text-xs px-2 py-1 rounded ${getTemplateColor(selectedTemplate)}`}>
                {selectedTemplate}
              </div>
            </div>
            <div className="h-24 bg-yt-bg rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-yt-text-primary font-medium mb-1">
                  {audio.name.replace(/\.[^/.]+$/, '')}
                </div>
                <div className="text-xs text-yt-text-secondary">
                  {selectedTemplate === 'music' && 'Album cover style with waveform visualization'}
                  {selectedTemplate === 'podcast' && 'Podcast episode with host and guest info'}
                  {selectedTemplate === 'audiobook' && 'Audiobook chapter with narrator credits'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio trimming controls */}
      {onTrim && (
        <div className="border-t border-yt-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-yt-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Scissors size={12} />
              Trim Audio
            </h4>
            <button
              onClick={handleTrim}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={trimStart >= trimEnd}
            >
              Apply Trim
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-yt-text-secondary">
              <span>Start: {formatTime(trimStart)}</span>
              <span>End: {formatTime(trimEnd)}</span>
              <span>Duration: {formatTime(trimEnd - trimStart)}</span>
            </div>

            <div className="relative h-2 bg-yt-hover rounded-full">
              <div
                className="absolute h-full bg-red-600/50 rounded-full"
                style={{
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`
                }}
              />
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="absolute top-1/2 -translate-y-1/2 w-full h-4 opacity-0 cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="absolute top-1/2 -translate-y-1/2 w-full h-4 opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max={duration}
                step="0.1"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="flex-1 text-xs p-1.5 bg-yt-bg border border-yt-border rounded"
                placeholder="Start (seconds)"
              />
              <input
                type="number"
                min="0"
                max={duration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="flex-1 text-xs p-1.5 bg-yt-bg border border-yt-border rounded"
                placeholder="End (seconds)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {audio.status !== 'pending' && (
        <div className={`mt-4 p-2 rounded-lg text-xs text-center ${
          audio.status === 'completed' ? 'bg-green-500/20 text-green-500' :
          audio.status === 'error' ? 'bg-red-500/20 text-red-500' :
          'bg-blue-500/20 text-blue-500'
        }`}>
          {audio.status === 'uploading' && 'Generating animated waveform video...'}
          {audio.status === 'completed' && 'Animated waveform video generated'}
          {audio.status === 'error' && `Error: ${audio.error || 'Failed to generate video'}`}
        </div>
      )}
    </div>
  )
}

// Compact version for lists
export function CompactAudioCard({ audio }: { audio: AudioFile }) {
  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-yt-hover transition-colors">
      <div className="relative w-12 h-12 bg-yt-bg rounded overflow-hidden flex-shrink-0 mr-3">
        {audio.audioThumbnail ? (
          <img src={audio.audioThumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-red-600/20">
            <Music size={16} className="text-red-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-yt-text-primary truncate">
          {audio.name.replace(/\.[^/.]+$/, '')}
        </p>
        <p className="text-[10px] text-yt-text-secondary">
          {audio.size} • {audio.duration ? `${Math.floor(audio.duration / 60)}:${Math.floor(audio.duration % 60).toString().padStart(2, '0')}` : '--:--'}
          {audio.audioFormat && ` • ${audio.audioFormat}`}
        </p>
      </div>
    </div>
  )
}