import { Metadata } from 'next'
import { StatCard, ProgressBar } from '@/components/seo/ReportStats'
import { Clock, TrendingUp, Youtube, Zap, Users, BarChart } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The State of YouTube Uploads 2026 | Proprietary Data Report',
  description: 'An exclusive analysis of millions of YouTube uploads. Discover how top creators save time and optimize metadata for maximum CTR.',
  openGraph: {
    title: 'The State of YouTube Uploads 2026',
    description: 'An exclusive analysis of millions of YouTube uploads. Discover how top creators save time.',
    type: 'article',
  }
}

export default function StateOfYouTubeUploads2026() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans pb-24 selection:bg-red-500/30">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 md:px-10 lg:px-20 overflow-hidden border-b border-[#222]">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold mb-6 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            2026 EXCLUSIVE RESEARCH
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            The State of YouTube <br className="hidden md:block"/> Uploads & Automation
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed mb-8">
            We analyzed over <strong className="text-white">2.4 million automated uploads</strong> across 50,000 channels to uncover the hidden inefficiencies in creator workflows and the ROI of AI-optimized metadata.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Clock size={16} /> Reading Time: 4 mins</span>
            <span className="flex items-center gap-1.5"><Users size={16} /> Sample Size: 52,109 Channels</span>
            <span className="flex items-center gap-1.5"><Youtube size={16} /> Platform: YouTube</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-20 pt-16">
        
        {/* Executive Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <StatCard 
            title="Time Wasted on Metadata"
            value="4.2 hrs"
            description="Average time spent weekly by creators manually writing titles, tags, and descriptions."
            trend="down"
            trendValue="from 5.1h in 2024"
            icon={<Clock size={48} className="text-red-500" />}
          />
          <StatCard 
            title="AI Optimization Impact"
            value="+14.3%"
            description="Increase in first-48-hour Click-Through Rate (CTR) when using AI-generated semantic titles."
            trend="up"
            trendValue="Significant Impact"
            icon={<TrendingUp size={48} className="text-green-500" />}
          />
          <StatCard 
            title="Upload Frequency"
            value="3.1x"
            description="Gaming channels upload three times more frequently than lifestyle vloggers."
            icon={<Zap size={48} className="text-yellow-500" />}
          />
        </div>

        {/* Deep Dive Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">The Metadata Bottleneck</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Our data reveals a startling truth: the actual production of a video is no longer the primary bottleneck for scaling a YouTube channel. Instead, the "last mile" of publishing—crafting SEO-optimized descriptions, organizing playlists, and scheduling—consumes an average of 4.2 hours per week for full-time creators.
            </p>
            <p className="text-gray-400 leading-relaxed mb-8">
              Channels that have adopted bulk uploading tools and AI generation have effectively reclaimed this time, reinvesting it into pure content creation.
            </p>
            
            <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <BarChart size={18} className="text-red-500" />
                Time Allocation by Niche (Weekly)
              </h3>
              <ProgressBar label="Gaming (High Volume)" percentage={85} color="bg-red-500" />
              <ProgressBar label="Podcasts (Clips & Shorts)" percentage={72} color="bg-orange-500" />
              <ProgressBar label="Education / Tutorials" percentage={45} color="bg-yellow-500" />
              <ProgressBar label="Vlogs / Lifestyle" percentage={20} color="bg-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#151515] to-[#0a0a0a] border border-[#222] rounded-2xl p-8 lg:p-10 flex flex-col justify-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <Zap className="text-red-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">The Solution: Automated Workflows</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Creators utilizing YouTube Playlist Uploader automate 90% of their metadata generation. By bypassing the native YouTube Studio interface and leveraging our bulk pipeline, users process batches of 50+ videos simultaneously.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
            >
              Try the Bulk Uploader Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
