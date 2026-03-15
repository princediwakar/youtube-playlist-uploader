'use client'

import { signIn } from 'next-auth/react'
import { ArrowRight, Play, Upload, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="section-padding subtle-gradient">
      <div className="container-narrow">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yt-blue/10 text-yt-blue caption animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>YouTube Creator Tool</span>
          </div>

          {/* Main headline */}
          <div className="space-y-6 animate-slide-up">
            <h1 className="heading-xl">
              <span className="block">Upload Videos</span>
              <span className="block text-gradient">Smarter, Not Harder</span>
            </h1>

            <p className="body-lg max-w-2xl mx-auto">
              Batch upload videos to YouTube with AI-powered optimization, intelligent playlists,
              and workflow automation for creators, educators, and brands.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animate-delay-200">
            <button
              onClick={() => signIn('google')}
              className="btn-accent flex items-center justify-center gap-3"
            >
              <span>Start Uploading Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={scrollToFeatures}
              className="btn-secondary flex items-center justify-center gap-3"
            >
              <span>See How It Works</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 animate-fade-in animate-delay-300">
            <div className="text-center">
              <div className="heading-md text-accent-primary">50+</div>
              <div className="caption">Features</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">100%</div>
              <div className="caption">Free</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">10K+</div>
              <div className="caption">Creators</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">90%</div>
              <div className="caption">Time Saved</div>
            </div>
          </div>

          {/* Visual element */}
          <div className="pt-12 animate-scale-in animate-delay-400">
            <div className="relative max-w-2xl mx-auto">
              <div className="elegant-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yt-blue/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-yt-blue" />
                    </div>
                    <div>
                      <div className="font-medium">YouTube Upload Studio</div>
                      <div className="caption">Batch processing ready</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-yt-red/10 text-yt-red text-xs font-medium">
                    LIVE
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="caption">Upload Progress</div>
                    <div className="text-sm font-medium">75%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill w-3/4"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">24</div>
                      <div className="caption text-xs">Videos</div>
                    </div>
                    <div className="text-center border-x border-yt-border">
                      <div className="text-sm font-medium">AI</div>
                      <div className="caption text-xs">Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">YouTube</div>
                      <div className="caption text-xs">Ready</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 border border-yt-border rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Upload className="w-8 h-8 text-yt-text-tertiary" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-yt-border rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-xs font-mono text-yt-text-tertiary">AI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}