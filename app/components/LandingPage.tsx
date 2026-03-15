'use client'

import { signIn } from 'next-auth/react'
import { Youtube, FolderOpen, Upload, User } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-32">
      <div className="relative mb-12">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-yt-panel rounded-full flex items-center justify-center shadow-lg border border-yt-border">
          <Youtube className="text-yt-red" size={64} />
        </div>
      </div>

      <h2 className="text-3xl md:text-5xl font-medium text-yt-text-primary mb-6 tracking-tight text-center leading-tight">
        A Better Way to <br/><span className="text-yt-blue">Upload Videos</span>
      </h2>

      <p className="text-yt-text-secondary text-sm md:text-base max-w-2xl text-center mb-12 leading-relaxed">
        Simplify your workflow. Upload individual videos or entire playlists directly to your YouTube channel with smart, AI-powered defaults that save you time.
      </p>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 w-full">
        <div className="upload-card group flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
            <FolderOpen className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
          </div>
          <h3 className="text-yt-text-primary font-medium mb-2 text-base">Select Videos</h3>
          <p className="text-sm text-yt-text-secondary">Upload multiple video files or select entire folders from your computer.</p>
        </div>
        <div className="upload-card group flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
            <Upload className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
          </div>
          <h3 className="text-yt-text-primary font-medium mb-2 text-base">Processing & AI</h3>
          <p className="text-sm text-yt-text-secondary">Save time with AI-generated titles, descriptions, categories, and tags.</p>
        </div>
        <div className="upload-card group flex flex-col items-center text-center sm:col-span-2 md:col-span-1">
          <div className="w-12 h-12 bg-yt-bg rounded-full flex items-center justify-center mb-6">
            <Youtube className="text-yt-text-secondary group-hover:text-yt-text-primary transition-colors duration-300" size={24} />
          </div>
          <h3 className="text-yt-text-primary font-medium mb-2 text-base">Start Upload</h3>
          <p className="text-sm text-yt-text-secondary">Publish directly to your YouTube channel with correct playlist organization.</p>
        </div>
      </div>

      <button
        onClick={() => signIn('google')}
        className="btn-primary flex items-center"
      >
        <User className="mr-2" size={20} />
        <span>Sign In with Google</span>
      </button>
    </div>
  )
}