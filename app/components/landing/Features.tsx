'use client'

import { Brain, Upload as UploadIcon, Layers, Shield, Zap, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Optimization',
    description: 'Automatically generate titles, descriptions, and tags using advanced AI analysis of your video content.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  },
  {
    icon: UploadIcon,
    title: 'Batch Upload',
    description: 'Upload multiple videos simultaneously with parallel processing and individual progress tracking.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  },
  {
    icon: Layers,
    title: 'Playlist Management',
    description: 'Organize videos into playlists with automatic ordering and navigation links between videos.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  },
  {
    icon: Shield,
    title: 'Privacy Controls',
    description: 'Set each video to Public, Unlisted, or Private with YouTube compliance features.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  },
  {
    icon: Zap,
    title: 'Smart Processing',
    description: 'Automatic format detection, Shorts optimization, and duplicate video prevention.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  },
  {
    icon: Sparkles,
    title: 'Content Analysis',
    description: 'AI-powered category suggestions and content optimization based on YouTube best practices.',
    color: 'text-slate',
    bgColor: 'bg-slate/10'
  }
]

export default function Features() {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-wide">
        <div className="text-center space-y-8 mb-16">
          <div className="badge badge-subtle">
            <span>Powerful Features</span>
          </div>

          <h2 className="heading-lg">
            Everything You Need to <span className="text-yt-red">Scale Your Channel</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            From AI-powered content optimization to bulk upload management, we've built every feature creators actually need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white border border-slate/10 rounded-2xl p-8 transition-all duration-300 group-hover:border-yt-red/30 group-hover:shadow-lg">
                  <div className="flex flex-col items-start">
                    <div className={`w-16 h-16 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-charcoal">
                        {feature.title}
                      </h3>
                      <p className="body-md text-slate">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate/10 w-full">
                      <div className="text-xs text-slate/70 flex items-center gap-1">
                        <span>Learn more</span>
                        <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-20 pt-16 border-t border-slate/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50+', label: 'Features available', description: 'Comprehensive toolset' },
              { value: '100%', label: 'Free to use', description: 'No hidden costs' },
              { value: '10K+', label: 'Videos processed', description: 'Trusted by creators' },
              { value: '24/7', label: 'Reliable service', description: 'Always available' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl md:text-5xl font-light text-charcoal mb-2 font-display">{stat.value}</div>
                <div className="text-sm font-medium text-charcoal mb-1">{stat.label}</div>
                <div className="text-xs text-slate/70">{stat.description}</div>
                <div className="mt-4 h-px w-12 mx-auto bg-slate/20 group-hover:bg-yt-red transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}