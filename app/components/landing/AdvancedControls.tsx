'use client'

import { Layers, Shield, Upload, Settings, Check, Lock, Globe, Users, Calendar, Play, FolderPlus, RefreshCw, Mic, Activity, Image as ImageIcon, Music } from 'lucide-react'
import { useState } from 'react'

const controls = [
  {
    id: 'playlist',
    title: 'Playlist Management',
    icon: Layers,
    description: 'Advanced playlist controls for organizing your content.',
    features: [
      {
        title: 'Add to existing playlists',
        description: 'Select from your existing YouTube playlists or create new ones on the fly.',
        icon: FolderPlus,
        visual: (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white border border-slate/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-yt-red/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-yt-red" />
                </div>
                <div>
                  <div className="text-sm font-medium text-charcoal">My Gaming Playlist</div>
                  <div className="text-xs text-slate">15 videos • Updated today</div>
                </div>
              </div>
              <Check className="w-5 h-5 text-yt-red" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white border border-slate/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-slate" />
                </div>
                <div>
                  <div className="text-sm font-medium text-charcoal">Create new playlist</div>
                  <div className="text-xs text-slate">"New Playlist Name"</div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border border-slate/30"></div>
            </div>
          </div>
        )
      },
      {
        title: 'Create new playlists automatically',
        description: 'Automatically create playlists based on upload date, category, or custom rules.',
        icon: Calendar,
        visual: (
          <div className="p-4 bg-gradient-to-br from-yt-red/5 to-transparent rounded-lg border border-yt-red/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-yt-red/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yt-red" />
              </div>
              <div>
                <div className="text-sm font-medium text-charcoal">Auto-create by date</div>
                <div className="text-xs text-slate">"March 2026 Uploads"</div>
              </div>
            </div>
            <div className="text-xs text-slate space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yt-red"></div>
                <span>Creates playlist for each month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yt-red"></div>
                <span>Auto-adds videos based on upload date</span>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Auto-organize by upload date',
        description: 'Videos are automatically sorted in playlists by upload date for optimal viewing.',
        icon: RefreshCw,
        visual: (
          <div className="flex items-center justify-center p-4 bg-slate/5 rounded-lg">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yt-red/10 to-transparent rounded-full blur"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yt-red" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-charcoal">Chronological Order</div>
                  <div className="text-xs text-slate">Newest videos first</div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ],
    color: 'text-yt-red',
    bgColor: 'bg-yt-red/10'
  },
  {
    id: 'privacy',
    title: 'Privacy & Settings',
    icon: Shield,
    description: 'Fine-grained privacy controls and YouTube compliance features.',
    features: [
      {
        title: 'Public/Private/Unlisted videos',
        description: 'Set privacy level for each video individually or apply to entire batches.',
        icon: Globe,
        visual: (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Public', color: 'bg-green-500', icon: Globe },
              { label: 'Unlisted', color: 'bg-yellow-500', icon: Lock },
              { label: 'Private', color: 'bg-red-500', icon: Users }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center p-3 bg-white border border-slate/20 rounded-lg">
                <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center mb-2`}>
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-medium text-charcoal">{item.label}</div>
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Category selection',
        description: 'Choose from YouTube categories or let AI suggest the most relevant one.',
        icon: Settings,
        visual: (
          <div className="p-3 bg-white border border-slate/20 rounded-lg">
            <div className="text-xs text-slate mb-2">Selected Category</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yt-red/10 flex items-center justify-center">
                  <Settings className="w-3 h-3 text-yt-red" />
                </div>
                <span className="text-sm font-medium text-charcoal">Education</span>
              </div>
              <div className="text-xs text-slate">AI Suggested ✓</div>
            </div>
          </div>
        )
      },
      {
        title: 'Age restriction controls',
        description: 'Mark videos as "Made for Kids" or apply age restrictions as needed.',
        icon: Users,
        visual: (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yt-red/5 to-transparent rounded-lg border border-yt-red/20">
            <div className="w-10 h-10 rounded-full bg-yt-red/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-yt-red" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-charcoal">Made for Kids</div>
              <div className="text-xs text-slate">YouTube compliance enabled</div>
            </div>
            <div className="w-8 h-5 rounded-full bg-yt-red relative">
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white"></div>
            </div>
          </div>
        )
      }
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10'
  },
  {
    id: 'batch',
    title: 'Batch Processing',
    icon: Upload,
    description: 'Upload and manage multiple videos simultaneously with advanced controls.',
    features: [
      {
        title: 'Upload 50+ videos simultaneously',
        description: 'Parallel upload processing with individual progress tracking for each video.',
        icon: Upload,
        visual: (
          <div className="space-y-2">
            {[70, 45, 90, 30].map((percent, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate">video_{idx + 1}.mp4</span>
                  <span className="text-charcoal font-medium">{percent}%</span>
                </div>
                <div className="h-2 bg-slate/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yt-red rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Individual progress tracking',
        description: 'Monitor each video upload independently with detailed status updates.',
        icon: Settings,
        visual: (
          <div className="p-3 bg-white border border-slate/20 rounded-lg">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {['Uploading', 'Processing', 'Complete', 'Failed'].map((status, idx) => (
                <div key={idx} className={`text-center py-1 rounded text-xs ${status === 'Complete' ? 'bg-green-100 text-green-800' : status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-slate/10 text-slate'}`}>
                  {status}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate">4 videos uploading • 12 remaining</div>
          </div>
        )
      },
      {
        title: 'Resume failed uploads',
        description: 'Automatically retry failed uploads or resume interrupted sessions.',
        icon: RefreshCw,
        visual: (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yt-red/5 to-transparent rounded-lg">
            <div className="w-10 h-10 rounded-full bg-yt-red/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-yt-red" />
            </div>
            <div>
              <div className="text-sm font-medium text-charcoal">Auto-resume enabled</div>
              <div className="text-xs text-slate">3 retries on failure</div>
            </div>
          </div>
        )
      }
    ],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10'
  },
  {
    id: 'audio',
    title: 'Audio Studio',
    icon: Mic,
    description: 'Transform audio into stunning YouTube videos with waveforms and metadata.',
    features: [
      {
        title: 'Animated Waveforms',
        description: 'Auto-generate beautiful waveform animations perfectly synced to your audio tracks.',
        icon: Activity,
        visual: (
          <div className="p-4 bg-slate/5 rounded-lg border border-slate/10 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Activity className="w-24 h-24 text-purple-600" />
            </div>
            <div className="relative flex items-end justify-center gap-1 h-12">
              {[40, 70, 45, 90, 60, 80, 50, 65, 30, 85, 45, 75, 55, 35].map((height, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-gradient-to-t from-purple-600 to-purple-400 rounded-full animate-pulse"
                  style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}
                ></div>
              ))}
            </div>
          </div>
        )
      },
      {
        title: 'Audio to Video Conversion',
        description: 'Upload MP3 or WAV directly. We handle the complex FFmpeg container conversion.',
        icon: ImageIcon,
        visual: (
          <div className="flex items-center gap-4 p-4 bg-white border border-slate/20 rounded-lg">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                MP3
              </div>
              <span className="text-[10px] text-slate font-medium">AUDIO</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-0.5 w-8 bg-slate/20 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate/40 transform rotate-45"></div>
              </div>
              <Activity className="w-4 h-4 text-purple-600 my-1 animate-spin-slow" />
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-yt-red/10 flex items-center justify-center text-yt-red font-bold text-xs relative overflow-hidden">
                MP4
                <div className="absolute bottom-0 left-0 w-full h-1 bg-yt-red"></div>
              </div>
              <span className="text-[10px] text-slate font-medium">VIDEO</span>
            </div>
          </div>
        )
      },
      {
        title: 'Smart Podcast Metadata',
        description: 'AI detects audio content and generates episode notes, timestamps, and categories.',
        icon: Music,
        visual: (
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-600/5 to-transparent rounded-lg border border-purple-600/20">
              <div className="mt-0.5">
                <Music className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal">🎙️ Episode 42: The Future of AI</div>
                <div className="text-[10px] text-slate mt-1 line-clamp-2">In this episode, we dive deep into the world of artificial intelligence. We discuss machine learning, neural networks, and how these technologies are shaping our future.</div>
                <div className="flex gap-1 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate/10 text-slate">#Podcast</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate/10 text-slate">#Tech</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-600/10'
  }
]

export default function AdvancedControls() {
  const [activeControl, setActiveControl] = useState('playlist')

  const currentControl = controls.find(c => c.id === activeControl) || controls[0]
  const ControlIcon = currentControl.icon

  return (
    <section id="advanced-controls" className="section-padding bg-white">
      <div className="container-wide">
        <div className="text-center space-y-8 mb-16">
          <div className="badge badge-subtle">
            <span>Advanced Controls</span>
          </div>

          <h2 className="heading-lg">
            Professional Tools for <span className="text-yt-red">Scale & Control</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            From playlist automation to batch processing, access the advanced controls serious creators need to manage large volumes of content.
          </p>
        </div>

        {/* Control type selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {controls.map((control) => {
            const Icon = control.icon
            const isActive = activeControl === control.id
            return (
              <button
                key={control.id}
                onClick={() => setActiveControl(control.id)}
                className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${isActive
                    ? 'bg-yt-red text-white shadow-md'
                    : 'bg-white border border-slate/20 text-charcoal hover:border-yt-red/30 hover:shadow-sm'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{control.title}</span>
              </button>
            )
          })}
        </div>

        {/* Main control display */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white border border-slate/10 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left panel - Features list */}
              <div className="lg:w-2/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-xl ${currentControl.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <ControlIcon className={`w-8 h-8 ${currentControl.color}`} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yt-red/10 text-yt-red text-xs font-medium mb-2">
                      Active Section
                    </div>
                    <h3 className="text-2xl font-semibold text-charcoal">{currentControl.title}</h3>
                    <p className="text-slate mt-2">{currentControl.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {currentControl.features.map((feature, idx) => {
                    const FeatureIcon = feature.icon
                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${currentControl.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <FeatureIcon className={`w-5 h-5 ${currentControl.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-charcoal">{feature.title}</h4>
                            <p className="text-sm text-slate mt-1">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right panel - Visual demo */}
              <div className="lg:w-3/5">
                <div className="sticky top-8">
                  <div className="bg-gradient-to-br from-slate/5 to-white rounded-xl border border-slate/20 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm font-medium text-charcoal">Live Interface Preview</div>
                        <div className="text-xs text-slate">Interactive demo of professional publishing tools</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>

                    {/* Visual demo area */}
                    <div className="space-y-6">
                      {currentControl.features.map((feature, idx) => (
                        <div key={idx} className="space-y-3">
                          <div className="text-sm font-medium text-charcoal px-2">{feature.title}</div>
                          <div className="p-4 bg-white border border-slate/20 rounded-lg shadow-xs">
                            {feature.visual}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Demo footer */}
                    <div className="mt-8 pt-6 border-t border-slate/20">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <div className="text-sm text-slate/70 mb-1">Production-ready interface</div>
                          <div className="text-lg font-semibold text-charcoal">Ready to use</div>
                        </div>
                        <div className="h-px sm:h-8 sm:w-px bg-slate/20"></div>
                        <div className="text-center sm:text-left">
                          <div className="text-sm text-slate/70 mb-1">Reliability</div>
                          <div className="text-lg font-semibold text-charcoal">99.9% uptime</div>
                        </div>
                        <div className="h-px sm:h-8 sm:w-px bg-slate/20"></div>
                        <div className="text-center sm:text-left">
                          <div className="text-sm text-slate/70 mb-1">Batch capacity</div>
                          <div className="text-lg font-semibold text-charcoal">500+ videos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional note */}
        <div className="mt-12 text-center">
          <p className="text-slate max-w-2xl mx-auto">
            Scale your YouTube presence without the manual work. These professional tools handle complex workflows so you can focus on creating great content.
          </p>
        </div>
      </div>
    </section>
  )
}