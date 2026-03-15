'use client'

import { Brain, Upload as UploadIcon, Layers, Sparkles, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Optimization',
    description: 'Automatically generate titles, descriptions, and tags using advanced AI analysis of your video content.',
    color: 'text-yt-blue',
    bgColor: 'bg-yt-blue/10'
  },
  {
    icon: UploadIcon,
    title: 'Batch Upload',
    description: 'Upload multiple videos simultaneously with parallel processing and individual progress tracking.',
    color: 'text-yt-red',
    bgColor: 'bg-yt-red/10'
  },
  {
    icon: Layers,
    title: 'Playlist Management',
    description: 'Organize videos into playlists with automatic ordering and navigation links between videos.',
    color: 'text-yt-blue',
    bgColor: 'bg-yt-blue/10'
  },
  {
    icon: Shield,
    title: 'Privacy Controls',
    description: 'Set each video to Public, Unlisted, or Private with YouTube compliance features.',
    color: 'text-yt-text-primary',
    bgColor: 'bg-yt-border'
  },
  {
    icon: Zap,
    title: 'Smart Processing',
    description: 'Automatic format detection, Shorts optimization, and duplicate video prevention.',
    color: 'text-yt-red',
    bgColor: 'bg-yt-red/10'
  },
  {
    icon: Sparkles,
    title: 'Content Analysis',
    description: 'AI-powered category suggestions and content optimization based on YouTube best practices.',
    color: 'text-yt-blue',
    bgColor: 'bg-yt-blue/10'
  }
]

export default function Features() {
  return (
    <section id="features" className="section-padding bg-yt-panel">
      <div className="container-wide">
        <div className="text-center space-y-8 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yt-border text-yt-text-secondary caption">
            <Zap className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>

          <h2 className="heading-lg">
            Everything You Need to <span className="text-gradient">Scale Your Channel</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            From AI-powered content optimization to bulk upload management, we've built every feature creators actually need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="elegant-card elegant-card-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-yt-text-primary">
                      {feature.title}
                    </h3>
                    <p className="body-md">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 pt-12 border-t border-yt-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="heading-md text-accent-primary">50+</div>
              <div className="caption">Features available</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">100%</div>
              <div className="caption">Free to use</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">10K+</div>
              <div className="caption">Videos processed</div>
            </div>
            <div className="text-center">
              <div className="heading-md text-accent-primary">24/7</div>
              <div className="caption">Reliable service</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}