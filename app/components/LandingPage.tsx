'use client'

import Hero from '@/app/components/landing/Hero'
import Features from '@/app/components/landing/Features'
import HowItWorks from '@/app/components/landing/HowItWorks'
import CTA from '@/app/components/landing/CTA'

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </div>
  )
}