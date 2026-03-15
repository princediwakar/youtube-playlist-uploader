'use client'

import { signIn } from 'next-auth/react'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export default function CTA() {
  return (
    <section className="section-padding bg-yt-panel">
      <div className="container-narrow">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yt-blue/10 text-yt-blue caption">
            <Sparkles className="w-4 h-4" />
            <span>Ready to Transform Your Workflow?</span>
          </div>

          <h2 className="heading-lg">
            Start Uploading <span className="text-gradient">Smarter Today</span>
          </h2>

          <p className="body-lg max-w-2xl mx-auto">
            Join thousands of creators who save hours every week with our AI-powered YouTube upload tool.
            No credit card required. No limits. Just better content creation.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => signIn('google')}
              className="btn-accent flex items-center justify-center gap-3 px-8"
            >
              <span>Start Uploading Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#features"
              className="btn-secondary flex items-center justify-center gap-3 px-8"
            >
              <span>Learn More</span>
            </a>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yt-blue/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-yt-blue" />
              </div>
              <div className="font-medium text-yt-text-primary mb-2">Get Started in 60 Seconds</div>
              <p className="caption">
                Sign in with Google and upload your first video immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yt-red/10 flex items-center justify-center mx-auto mb-4">
                <div className="text-lg font-bold text-yt-red">$0</div>
              </div>
              <div className="font-medium text-yt-text-primary mb-2">Always Free</div>
              <p className="caption">
                No subscription fees, no hidden costs. All features available.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yt-border flex items-center justify-center mx-auto mb-4">
                <div className="text-sm font-medium text-yt-text-primary">10K+</div>
              </div>
              <div className="font-medium text-yt-text-primary mb-2">Trusted by Creators</div>
              <p className="caption">
                Join a community of 10K+ creators, educators, and brands.
              </p>
            </div>
          </div>

          {/* Final note */}
          <div className="pt-12 border-t border-yt-border">
            <p className="caption max-w-lg mx-auto">
              Need help getting started?{' '}
              <a href="mailto:support@example.com" className="text-yt-blue hover:underline">
                Contact support
              </a>{' '}
              or{' '}
              <a href="/docs" className="text-yt-blue hover:underline">
                read our documentation
              </a>
              .
            </p>
            <p className="caption mt-4">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-yt-text-primary hover:underline">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="text-yt-text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}