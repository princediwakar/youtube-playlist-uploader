'use client'

import Hero from '@/app/components/landing/Hero'
import UseCases from '@/app/components/landing/UseCases'
import AdvancedControls from '@/app/components/landing/AdvancedControls'
import CTA from '@/app/components/landing/CTA'

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <UseCases />
      <AdvancedControls />
      <CTA />
    </div>
  )
}