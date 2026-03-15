'use client'

import { signIn } from 'next-auth/react'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function CTA() {
  return (
    <section className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center space-y-8">
          <div className="badge badge-accent">
            <span>Ready to Transform Your Workflow?</span>
          </div>

          <h2 className="heading-lg">
            Start Uploading <span className="text-yt-red">Smarter Today</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            Join 10K+ creators who upload 95% faster with automated titles, batch processing, and smart playlists.
            No credit card required—start scaling your YouTube content today.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => signIn('google')}
              className="group relative px-10 py-4 bg-gradient-to-r from-yt-red to-red-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yt-red to-red-500 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <span className="relative">Start Uploading Free</span>
              <ArrowRight className="w-6 h-6 relative transform group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#use-cases"
              className="group px-10 py-4 bg-white border-2 border-slate/20 text-charcoal rounded-xl font-semibold text-lg hover:border-yt-red/50 hover:shadow-lg transition-all duration-300 flex items-center gap-3"
            >
              <span>Learn More</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
            {[
              {
                icon: <CheckCircle className="w-8 h-8 text-yt-red" />,
                title: 'Get Started in 60 Seconds',
                description: 'Sign in with Google and upload your first video immediately.',
                color: 'from-yt-red/10 to-yt-red/5'
              },
              {
                icon: <div className="text-2xl font-bold text-yt-red">$0</div>,
                title: 'Always Free',
                description: 'No subscription fees, no hidden costs. All features available.',
                color: 'from-yt-red/10 to-yt-red/5'
              },
              {
                icon: <div className="text-xl font-bold text-yt-red">10K+</div>,
                title: 'Used by 10K+ Creators',
                description: 'Join 10K+ creators, educators, and brands scaling their YouTube presence.',
                color: 'from-yt-red/10 to-yt-red/5'
              }
            ].map((benefit, index) => (
              <div key={index} className="group text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mx-auto mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  {benefit.icon}
                </div>
                <div className="text-lg font-semibold text-charcoal mb-3">{benefit.title}</div>
                <p className="text-sm text-slate leading-relaxed">{benefit.description}</p>
                <div className="mt-4 h-px w-12 mx-auto bg-slate/20 group-hover:bg-yt-red transition-colors duration-300"></div>
              </div>
            ))}
          </div>

          {/* Final note */}
          <div className="pt-12 border-t border-slate/20">
            <p className="caption max-w-lg mx-auto">
              Need help getting started?{' '}
              <a href="mailto:support@example.com" className="text-yt-red hover:underline">
                Contact support
              </a>{' '}
              or{' '}
              <a href="/docs" className="text-yt-red hover:underline">
                read our documentation
              </a>
              .
            </p>
            <p className="caption mt-4">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-charcoal hover:underline">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="text-charcoal hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}