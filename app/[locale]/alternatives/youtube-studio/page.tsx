/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Check, X, Upload, Sparkles, Layers, RefreshCw, Music, Zap, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'YouTube Studio Alternative — Bulk Uploader & Playlist Manager',
  description: 'Stop uploading one video at a time. Compare YouTube Studio vs our bulk uploader — batch upload, AI metadata, auto playlists, and 95% faster workflow.',
  keywords: ['youtube studio alternative', 'youtube bulk uploader', 'youtube alternative', 'upload bulk videos'],
  alternates: {
    canonical: '/alternatives/youtube-studio',
  },
  openGraph: {
    title: 'YouTube Studio Alternative — Bulk Uploader & Playlist Manager',
    description: 'Stop uploading one video at a time. Compare YouTube Studio vs our bulk uploader — batch upload, AI metadata, auto playlists, and 95% faster workflow.',
  },
}

const comparisons = [
  {
    feature: 'Upload multiple files at once',
    app: 'Drag & drop entire folders. Upload 50+ files in one go.',
    studio: 'One video at a time. Repeat the process for every file.',
    appScore: true,
  },
  {
    feature: 'AI-generated titles & descriptions',
    app: 'Auto-generate from filenames or AI prompts. Bulk apply.',
    studio: 'Manual entry for every single video. No AI assistance.',
    appScore: true,
  },
  {
    feature: 'Smart playlist organization',
    app: 'Auto-categorize by folder, date, or naming patterns.',
    studio: 'Manually create and assign each playlist one by one.',
    appScore: true,
  },
  {
    feature: 'Background upload processing',
    app: 'Uploads run in the background. Close the tab, come back later.',
    studio: 'Must stay on the upload page. Lose connection? Start over.',
    appScore: true,
  },
  {
    feature: 'Audio-to-video conversion',
    app: 'Built-in waveform visualization for podcasts and music.',
    studio: 'No audio conversion. Must pre-render video files.',
    appScore: true,
  },
  {
    feature: 'Auto-retry on failure',
    app: 'Automatic chunked uploads with resume support.',
    studio: 'Connection drops mid-upload? Start from scratch.',
    appScore: true,
  },
  {
    feature: 'Bulk privacy & metadata',
    app: 'Apply privacy, category, and settings to all videos at once.',
    studio: 'Configure each video individually before uploading.',
    appScore: true,
  },
]

export default function YouTubeStudioAlternativePage() {
  return (
    <div className="min-h-screen bg-pearl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="mr-1.5" size={16} />
            Back to Home
          </Link>
        </div>

        {/* Hero section */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="text-center space-y-8">
              <div className="badge badge-accent animate-fade-in">
                <span>Honest Comparison</span>
              </div>

              <div className="space-y-6 animate-slide-up">
                <h1 className="heading-xl">
                  <span className="block">YouTube Studio vs.</span>
                  <span className="block text-yt-red">The Smarter Way to Upload</span>
                </h1>

                <p className="body-lg max-w-3xl mx-auto">
                  YouTube Studio is fine for one-off uploads. But if you're uploading multiple videos a week — 
                  or managing a back-catalog — the manual workflow is a time trap. Here's how we compare.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
                <Link
                  href="/"
                  className="group relative px-10 py-4 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-yt-red to-red-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <span className="relative">Try the Bulk Uploader Free</span>
                  <ArrowRight className="w-6 h-6 relative transform group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#comparison"
                  className="group px-10 py-4 bg-white border-2 border-slate/20 text-charcoal rounded-xl font-semibold text-lg hover:border-yt-red/50 hover:shadow-lg transition-all duration-300 flex items-center gap-3"
                >
                  <span>See the Full Comparison</span>
                  <svg className="w-5 h-5 transform group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pain point section */}
        <section className="section-padding bg-white rounded-2xl border border-slate/10 mb-12">
          <div className="container-narrow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="badge badge-accent">
                  <span>The Reality Check</span>
                </div>
                <h2 className="heading-lg">
                  Uploading to YouTube Shouldn't Take{' '}
                  <span className="text-yt-red">All Day</span>
                </h2>
                <p className="body-lg">
                  Here's the truth: YouTube Studio was designed for creators uploading one video at a time. 
                  It works — but only if you have hours to burn on repetitive clicks.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: X, text: 'Click "Upload" → select file → fill metadata → repeat 20 times', color: 'text-yt-red' },
                    { icon: X, text: 'No batch operations — every playlist, tag, and setting is manual', color: 'text-yt-red' },
                    { icon: X, text: 'One browser crash wipes out your progress. No auto-save, no resume.', color: 'text-yt-red' },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-yt-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <span className="text-sm sm:text-base text-slate">{item.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="badge badge-accent">
                  <span>The Better Way</span>
                </div>
                <h2 className="heading-lg">
                  Bulk Upload,{' '}
                  <span className="text-yt-red">Auto-Organize</span>
                </h2>
                <p className="body-lg">
                  Our bulk uploader was built from the ground up for creators who value their time. 
                  No repetitive clicks. No lost progress. Just drag, drop, and publish.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: Check, text: 'Drop 50 files at once. Auto-generate titles, descriptions, and tags.', color: 'text-green-600' },
                    { icon: Check, text: 'Smart playlists created from your folder structure in seconds.', color: 'text-green-600' },
                    { icon: Check, text: 'Resumable chunked uploads — pause, close, come back, and continue.', color: 'text-green-600' },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <span className="text-sm sm:text-base text-slate">{item.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section id="comparison" className="section-padding">
          <div className="container-narrow">
            <div className="text-center space-y-6 mb-12">
              <div className="badge badge-subtle">
                <span>Side by Side</span>
              </div>
              <h2 className="heading-lg">
                Feature Comparison
              </h2>
              <p className="body-lg max-w-2xl mx-auto">
                See exactly what you gain when you switch from manual uploads to bulk processing.
              </p>
            </div>

            <div className="bg-white border border-slate/10 rounded-2xl overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 p-6 bg-gradient-to-r from-yt-red/5 to-transparent border-b border-slate/10">
                <div className="col-span-5 sm:col-span-6">
                  <span className="text-xs font-semibold text-slate uppercase tracking-wider">Feature</span>
                </div>
                <div className="col-span-3 sm:col-span-3 text-center">
                  <span className="text-xs font-semibold text-yt-red uppercase tracking-wider">Bulk Uploader</span>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center">
                  <span className="text-xs font-semibold text-slate uppercase tracking-wider">YouTube Studio</span>
                </div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-slate/10">
                {comparisons.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-5 sm:p-6 hover:bg-slate/5 transition-colors">
                    <div className="col-span-5 sm:col-span-6 flex items-center">
                      <span className="text-sm sm:text-base font-medium text-charcoal">{row.feature}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-600/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-slate hidden sm:inline">{row.app}</span>
                      </div>
                    </div>
                    <div className="col-span-4 sm:col-span-3 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-yt-red/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-yt-red" />
                        </div>
                        <span className="text-xs sm:text-sm text-slate hidden sm:inline">{row.studio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table footer */}
              <div className="p-6 bg-gradient-to-r from-yt-red/5 to-transparent border-t border-slate/10">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-yt-red" />
                  <span className="text-sm font-medium text-charcoal">
                    Save 95% of your upload time. Start for free — no credit card needed.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="text-center space-y-6 mb-12">
              <h2 className="heading-lg">
                What You're Missing with <span className="text-yt-red">Manual Uploads</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Upload,
                  title: 'Bulk Upload',
                  description: 'Drag in an entire folder of videos. We process them all in parallel with individual progress tracking.',
                  color: 'from-yt-red/10 to-yt-red/5',
                  iconColor: 'text-yt-red',
                },
                {
                  icon: Sparkles,
                  title: 'AI Metadata',
                  description: 'Auto-generate titles, descriptions, and tags from filenames or AI prompts. No more typing the same thing 20 times.',
                  color: 'from-purple-600/10 to-purple-600/5',
                  iconColor: 'text-purple-600',
                },
                {
                  icon: Layers,
                  title: 'Auto Playlists',
                  description: 'Organize videos into playlists automatically based on folder structure, naming conventions, or custom rules.',
                  color: 'from-blue-600/10 to-blue-600/5',
                  iconColor: 'text-blue-600',
                },
                {
                  icon: RefreshCw,
                  title: 'Resumable Uploads',
                  description: 'Chunked upload with auto-retry. Network drop? Pause and resume. Browser crash? Pick up where you left off.',
                  color: 'from-emerald-600/10 to-emerald-600/5',
                  iconColor: 'text-emerald-600',
                },
                {
                  icon: Music,
                  title: 'Audio Support',
                  description: 'Upload MP3, WAV, M4A directly. We convert audio to video with animated waveform visualization — no extra tools needed.',
                  color: 'from-orange-600/10 to-orange-600/5',
                  iconColor: 'text-orange-600',
                },
                {
                  icon: Shield,
                  title: 'Privacy Controls',
                  description: 'Set all videos to public, unlisted, or private with one click. Apply consistent settings across your entire batch.',
                  color: 'from-cyan-600/10 to-cyan-600/5',
                  iconColor: 'text-cyan-600',
                },
              ].map((feature, i) => {
                const FeatureIcon = feature.icon
                return (
                  <div key={i} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yt-red/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white border border-slate/10 rounded-2xl p-6 sm:p-8 transition-all duration-300 group-hover:border-yt-red/30 group-hover:shadow-lg h-full">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}>
                        <FeatureIcon className={`w-7 h-7 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-charcoal mb-3">{feature.title}</h3>
                      <p className="text-sm text-slate leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="bg-gradient-to-br from-yt-red/5 to-white border border-slate/10 rounded-2xl p-8 sm:p-12 text-center space-y-8">
              <div className="badge badge-accent">
                <span>Ready to Scale?</span>
              </div>

              <h2 className="heading-lg">
                Stop Babysitting Uploads.{' '}
                <span className="text-yt-red">Start Creating.</span>
              </h2>

              <p className="body-lg max-w-2xl mx-auto">
                Join 10K+ creators who upload 95% faster with automated titles, batch processing, and smart playlists.
                No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/"
                  className="group relative px-10 py-4 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-yt-red to-red-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <span className="relative">Try It Free</span>
                  <ArrowRight className="w-6 h-6 relative transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <p className="caption">
                Already have an account?{' '}
                <Link href="/" className="text-yt-red hover:underline font-medium">Sign in here</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <div className="pb-8 text-center">
          <p className="caption max-w-lg mx-auto">
            YouTube Studio is a trademark of Google LLC. We are not affiliated with or endorsed by Google or YouTube.
            This comparison is based on publicly available features as of {new Date().getFullYear()}.
          </p>
        </div>
      </div>
    </div>
  )
}
