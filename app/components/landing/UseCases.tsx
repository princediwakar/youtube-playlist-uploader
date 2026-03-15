'use client'

import { Video, Users, Briefcase, Upload, FileText, Layers, Folder, Zap, Globe, Lock, Settings } from 'lucide-react'

const useCases = [
  {
    persona: 'Content Creator',
    icon: Video,
    description: 'For YouTubers, influencers, and video producers who need to upload content at scale.',
    metrics: 'Upload 50 Shorts in 10 minutes',
    features: [
      {
        icon: Upload,
        title: 'Bulk upload Shorts (50+ videos)',
        description: 'Upload multiple Shorts simultaneously with parallel processing and individual progress tracking.'
      },
      {
        icon: FileText,
        title: 'Auto-generated titles/descriptions',
        description: 'AI analyzes your video content and generates compelling titles and descriptions automatically.'
      },
      {
        icon: Layers,
        title: 'Smart playlist organization',
        description: 'Automatically organize videos into playlists based on content, date, or custom rules.'
      }
    ],
    color: 'text-yt-red',
    bgColor: 'bg-yt-red/10'
  },
  {
    persona: 'Teacher/Educator',
    icon: Users,
    description: 'For educators, course creators, and institutions uploading educational content.',
    metrics: 'Upload course videos with folders',
    features: [
      {
        icon: Folder,
        title: 'Upload course videos with folders',
        description: 'Maintain folder structure when uploading entire courses. Preserve lesson order automatically.'
      },
      {
        icon: FileText,
        title: 'Generate lesson descriptions',
        description: 'AI creates structured lesson descriptions with learning objectives and key takeaways.'
      },
      {
        icon: Layers,
        title: 'Create structured playlists',
        description: 'Automatically create playlists for each course module with proper sequencing.'
      }
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10'
  },
  {
    persona: 'Brand/Marketing',
    icon: Briefcase,
    description: 'For brands, marketing teams, and agencies managing multiple product videos.',
    metrics: 'Batch upload product videos',
    features: [
      {
        icon: Upload,
        title: 'Batch upload product videos',
        description: 'Upload hundreds of product videos with consistent metadata and branding.'
      },
      {
        icon: Globe,
        title: 'Consistent branding across uploads',
        description: 'Apply standardized titles, descriptions, and tags across all videos automatically.'
      },
      {
        icon: Users,
        title: 'Team collaboration features',
        description: 'Multiple team members can manage uploads with role-based permissions.'
      }
    ],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10'
  }
]

export default function UseCases() {
  return (
    <section id="use-cases" className="section-padding bg-white">
      <div className="container-wide">
        <div className="text-center space-y-8 mb-16">
          <div className="badge badge-subtle">
            <span>Tailored Workflows</span>
          </div>

          <h2 className="heading-lg">
            Solutions for <span className="text-yt-red">Every Type of Creator</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            Whether you're a solo creator, educator, or brand team, we've built specific workflows to handle your unique YouTube upload needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const PersonaIcon = useCase.icon
            return (
              <div
                key={index}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white border border-slate/10 rounded-2xl p-8 transition-all duration-300 group-hover:border-yt-red/30 group-hover:shadow-lg h-full">
                  <div className="flex flex-col h-full">
                    {/* Persona header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl ${useCase.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <PersonaIcon className={`w-8 h-8 ${useCase.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-charcoal">
                          {useCase.persona}
                        </h3>
                        <p className="text-sm text-slate mt-1">
                          {useCase.description}
                        </p>
                      </div>
                    </div>

                    {/* Metrics highlight */}
                    <div className="mb-6 p-4 rounded-lg bg-slate/5 border border-slate/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yt-red" />
                        <span className="text-sm font-medium text-charcoal">
                          {useCase.metrics}
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-4 mb-6 flex-1">
                      {useCase.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon
                        return (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate/5 transition-colors duration-300">
                            <div className={`w-10 h-10 rounded-lg ${useCase.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <FeatureIcon className={`w-5 h-5 ${useCase.color}`} />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-charcoal mb-1">
                                {feature.title}
                              </h4>
                              <p className="text-xs text-slate leading-relaxed">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bottom stats */}
                    <div className="pt-6 border-t border-slate/10 mt-auto">
                      <div className="flex items-center justify-between text-xs text-slate/70">
                        <span>Proven creator workflows</span>
                        <span className="flex items-center gap-1">
                          <span>See details</span>
                          <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}