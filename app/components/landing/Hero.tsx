'use client'

import { signIn } from 'next-auth/react'
import { ArrowRight, Play } from 'lucide-react'
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
    <section className="section-padding bg-pearl">
      <div className="container-narrow">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="badge badge-accent animate-fade-in">
            <span>YouTube Creator Tool</span>
          </div>

          {/* Main headline */}
          <div className="space-y-6 animate-slide-up">
            <h1 className="heading-xl">
              <span className="block">Upload Videos</span>
              <span className="block text-yt-red">Smarter, Not Harder</span>
            </h1>

            <p className="body-lg max-w-2xl mx-auto">
              Batch upload videos to YouTube with AI-powered optimization, intelligent playlists,
              and workflow automation for creators, educators, and brands.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <button
              onClick={() => signIn('google')}
              className="group relative px-10 py-4 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yt-red to-red-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <span className="relative">Start Uploading Free</span>
              <ArrowRight className="w-6 h-6 relative transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={scrollToFeatures}
              className="group px-10 py-4 bg-white border-2 border-slate/20 text-charcoal rounded-xl font-semibold text-lg hover:border-yt-red/50 hover:shadow-lg transition-all duration-300 flex items-center gap-3"
            >
              <span>See How It Works</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 animate-fade-in">
            <div className="text-center">
              <div className="heading-md text-charcoal">50+</div>
              <div className="caption">Features</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-charcoal">100%</div>
              <div className="caption">Free</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-charcoal">10K+</div>
              <div className="caption">Creators</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-charcoal">90%</div>
              <div className="caption">Time Saved</div>
            </div>
          </div>

          {/* Visual element */}
          <div className="pt-12 animate-scale-in">
            <div className="relative max-w-2xl mx-auto">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white border border-slate/10 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yt-red/10 to-yt-red/5 flex items-center justify-center">
                      <Play className="w-7 h-7 text-yt-red" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-charcoal">YouTube Upload Studio</div>
                      <div className="text-sm text-slate/70 mt-1">Batch processing • AI optimization • Ready to publish</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-charcoal">Upload Progress</div>
                        <div className="text-sm font-bold text-yt-red">75%</div>
                      </div>
                      <div className="h-2 bg-slate/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yt-red to-red-500 rounded-full w-3/4 transition-all duration-500"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate/10">
                      <div className="text-center p-4 rounded-lg hover:bg-slate/5 transition-colors duration-300">
                        <div className="text-2xl font-light text-charcoal mb-1">24</div>
                        <div className="text-xs text-slate/70">Videos in queue</div>
                      </div>
                      <div className="text-center p-4 rounded-lg hover:bg-slate/5 transition-colors duration-300 border-x border-slate/10">
                        <div className="text-2xl font-light text-charcoal mb-1">AI</div>
                        <div className="text-xs text-slate/70">Processing</div>
                      </div>
                      <div className="text-center p-4 rounded-lg hover:bg-slate/5 transition-colors duration-300">
                        <div className="text-2xl font-light text-charcoal mb-1">Ready</div>
                        <div className="text-xs text-slate/70">For YouTube</div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate/10">
                      <div className="flex items-center justify-between text-xs text-slate/70">
                        <span>Estimated completion: <span className="font-medium text-charcoal">15 minutes</span></span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-yt-red animate-pulse"></span>
                          <span>Live updating</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}