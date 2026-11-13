import { useEffect } from 'react'
import { FaqSection } from './components/FaqSection.tsx'
import { HeroSection } from './components/HeroSection.tsx'
import { HowItWorksSection } from './components/HowItWorksSection.tsx'
import { MarketingFooter } from './components/MarketingFooter.tsx'
import { MarketingNav } from './components/MarketingNav.tsx'
import { PricingSection } from './components/PricingSection.tsx'
import { ProblemSection } from './components/ProblemSection.tsx'
import { StatsSection } from './components/StatsSection.tsx'
import { WalkthroughSection } from './components/WalkthroughSection.tsx'
import type { LandingViewProps } from './landing.types.ts'

// Presentational: data in through props, every action out through a callback (UI_Generation_Prompts Prompt 1).
export function LandingView({
  counts,
  isLoading,
  plans,
  featuredPlanCode,
  faqs,
  supportEmail,
  year,
  onTryProblem,
  onBrowse,
  onSignIn,
  onChoosePlan,
  onOpenSearch,
}: LandingViewProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenSearch()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onOpenSearch])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-base text-primary">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-raised focus:px-3 focus:py-2 focus:text-body focus:text-primary"
      >
        Skip to content
      </a>
      <MarketingNav onSignIn={onSignIn} onOpenSearch={onOpenSearch} />
      <main id="main" className="flex flex-col gap-24 md:gap-32">
        <HeroSection
          problemCount={counts.problemCount}
          isLoading={isLoading}
          onTryProblem={onTryProblem}
          onBrowse={onBrowse}
        />
        <StatsSection counts={counts} isLoading={isLoading} />
        <ProblemSection />
        <WalkthroughSection />
        <HowItWorksSection />
        <PricingSection
          plans={plans}
          featuredPlanCode={featuredPlanCode}
          onSignIn={onSignIn}
          onChoosePlan={onChoosePlan}
        />
        <FaqSection faqs={faqs} />
      </main>
      <MarketingFooter supportEmail={supportEmail} year={year} onSignIn={onSignIn} />
    </div>
  )
}
