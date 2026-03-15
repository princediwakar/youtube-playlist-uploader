'use client'

import { FolderOpen, Brain, Upload as UploadIcon, ArrowRight } from 'lucide-react'
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
    color: 'border-yt-blue',
    iconColor: 'text-yt-blue'
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
    color: 'border-yt-red',
    iconColor: 'text-yt-red'
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
    color: 'border-yt-blue',
    iconColor: 'text-yt-blue'
  }
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center space-y-8 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yt-border text-yt-text-secondary caption">
            <ArrowRight className="w-4 h-4" />
            <span>Simple 3-Step Workflow</span>
          </div>

          <h2 className="heading-lg">
            How It <span className="text-gradient">Works</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            Get your videos on YouTube faster than ever with our streamlined process.
          </p>
        </div>

        {/* Steps visualization */}
        <div className="relative mb-12">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-yt-border -translate-y-1/2"></div>

          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === index

              return (
                <div key={index} className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveStep(index)}
                    className={`w-16 h-16 rounded-full border-2 ${step.color} bg-white flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                  >
                    <Icon className={`w-8 h-8 ${step.iconColor}`} />
                  </button>
                  <div className="mt-4 text-center">
                    <div className="caption mb-1">Step {index + 1}</div>
                    <h3 className="font-medium text-yt-text-primary">{step.title}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active step details */}
        <div className="elegant-card">
          {steps.map((step, index) => {
            if (activeStep !== index) return null
            const Icon = step.icon

            return (
              <div key={index} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${step.iconColor === 'text-yt-blue' ? 'bg-yt-blue/10' : 'bg-yt-red/10'} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${step.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="heading-md">{step.title}</h3>
                    <p className="body-md">{step.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yt-border flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-yt-blue"></div>
                      </div>
                      <span className="text-yt-text-secondary">{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-yt-border">
                  <div className="flex items-center justify-between caption">
                    <span>Average time saved: <span className="font-medium text-yt-text-primary">85%</span></span>
                    <span>Success rate: <span className="font-medium text-yt-text-primary">99.9%</span></span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step navigation */}
        <div className="flex justify-center gap-4 mt-8">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${activeStep === index
                  ? 'bg-yt-blue text-white'
                  : 'bg-yt-hover text-yt-text-primary hover:bg-yt-border'
                }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}