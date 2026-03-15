'use client'

import { FolderOpen, Brain, Upload as UploadIcon } from 'lucide-react'
import { useState } from 'react'

const steps = [
  {
    icon: FolderOpen,
    title: 'Select & Upload',
    description: 'Drag and drop videos or entire folders. Our tool supports all major video formats.',
    details: [
      'Upload multiple videos simultaneously',
      'Support for MP4, MOV, AVI, MKV, WEBM, FLV, WMV, M4V',
      'Drag & drop interface with visual feedback',
      'Folder upload with preserved structure'
    ],
    color: 'border-slate',
    iconColor: 'text-slate'
  },
  {
    icon: Brain,
    title: 'AI Processing',
    description: 'Our AI analyzes your content and generates titles, descriptions, tags, and categories.',
    details: [
      'Automatic title generation based on content',
      'Smart description writing with formatting',
      'Relevant tag suggestions for discoverability',
      'YouTube category recommendations'
    ],
    color: 'border-slate',
    iconColor: 'text-slate'
  },
  {
    icon: UploadIcon,
    title: 'Publish & Manage',
    description: 'Publish directly to your YouTube channel with correct playlist organization.',
    details: [
      'Direct upload to your YouTube channel',
      'Playlist creation and management',
      'Privacy controls (Public/Private/Unlisted)',
      'Real-time progress tracking'
    ],
    color: 'border-slate',
    iconColor: 'text-slate'
  }
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center space-y-8 mb-16">
          <div className="badge badge-subtle">
            <span>Simple 3-Step Workflow</span>
          </div>

          <h2 className="heading-lg">
            How It <span className="text-yt-red">Works</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            Get your videos on YouTube faster than ever with our streamlined process.
          </p>
        </div>

        {/* Steps visualization */}
        <div className="relative mb-16">
          <div className="absolute top-[calc(50%+24px)] left-0 right-0 h-px bg-slate/10 z-0"></div>

          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === index

              return (
                <div key={index} className="flex flex-col items-center z-10">
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-full ${isActive ? 'bg-yt-red/10' : ''} transition-all duration-300 z-10`}></div>
                    <button
                      onClick={() => setActiveStep(index)}
                      className={`relative w-20 h-20 rounded-full border-2 ${isActive ? 'border-yt-red bg-white shadow-lg' : 'border-slate/30 bg-white'} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 hover:scale-105 hover:border-yt-red/50'} z-20`}
                    >
                      <div className={`absolute -inset-1 rounded-full ${isActive ? 'bg-yt-red/20' : 'bg-transparent'} transition-all duration-300`}></div>
                      <Icon className={`w-10 h-10 ${isActive ? 'text-yt-red' : 'text-slate/70'} transition-colors duration-300`} />
                      {isActive && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yt-red text-white flex items-center justify-center text-xs font-medium z-30">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-xs font-medium text-slate/70 mb-2">STEP {index + 1}</div>
                    <h3 className={`text-lg font-semibold ${isActive ? 'text-charcoal' : 'text-slate'} transition-colors duration-300`}>{step.title}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active step details */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white border border-slate/10 rounded-2xl p-8 shadow-sm">
            {steps.map((step, index) => {
              if (activeStep !== index) return null
              const Icon = step.icon

              return (
                <div key={index} className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yt-red/10 to-yt-red/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-yt-red" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yt-red/10 text-yt-red text-xs font-medium mb-3">
                        Step {index + 1}
                      </div>
                      <h3 className="text-2xl font-semibold text-charcoal mb-3">{step.title}</h3>
                      <p className="text-lg text-slate leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-slate/5 hover:bg-slate/10 transition-colors duration-300">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-yt-red"></div>
                        </div>
                        <span className="text-slate leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="text-sm text-slate/70 mb-1">Average time saved</div>
                        <div className="text-3xl font-light text-charcoal font-display">85%</div>
                      </div>
                      <div className="h-px md:h-8 md:w-px bg-slate/20"></div>
                      <div className="text-center md:text-left">
                        <div className="text-sm text-slate/70 mb-1">Success rate</div>
                        <div className="text-3xl font-light text-charcoal font-display">99.9%</div>
                      </div>
                      <div className="h-px md:h-8 md:w-px bg-slate/20"></div>
                      <div className="text-center md:text-left">
                        <div className="text-sm text-slate/70 mb-1">Creators using this step</div>
                        <div className="text-3xl font-light text-charcoal font-display">10K+</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step navigation */}
        <div className="flex justify-center gap-3 mt-12">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${activeStep === index
                  ? 'bg-yt-red text-white shadow-md'
                  : 'bg-white border border-slate/20 text-charcoal hover:border-yt-red/30 hover:shadow-sm'
                }`}
            >
              {activeStep === index && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{step.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}