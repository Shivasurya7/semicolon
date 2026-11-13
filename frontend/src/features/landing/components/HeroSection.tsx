import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { iconProps } from '../../../components/ui/icon.ts'
import { formatCount } from '../../../lib/format.ts'
import { HeroMontage } from './HeroMontage.tsx'
import { MarketingBackdrop } from './MarketingBackdrop.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'

interface HeroSectionProps {
  problemCount: number | undefined
  isLoading: boolean
  onTryProblem: () => void
  onBrowse: () => void
}

const LANGUAGES = 'C, C++, Java, Python 3'

function ProblemCountPill({ problemCount, isLoading }: Pick<HeroSectionProps, 'problemCount' | 'isLoading'>) {
  return (
    <Link
      to="/problems"
      className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border bg-raised px-3 text-[0.8125rem] text-primary transition-colors duration-fast ease-out hover:bg-chip"
    >
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-10" />
          <span>problems · {LANGUAGES}</span>
        </>
      ) : problemCount !== undefined ? (
        <span className="truncate">
          <span className="tabular-nums">{formatCount(problemCount)}</span> problems · {LANGUAGES}
        </span>
      ) : (
        <span>{LANGUAGES}</span>
      )}
      <ArrowRight {...iconProps} size={14} className="shrink-0" />
    </Link>
  )
}

export function HeroSection({ problemCount, isLoading, onTryProblem, onBrowse }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate pt-12 md:pt-16 lg:pt-20">
      <MarketingBackdrop variant="grid" />
      <MarketingContainer className="grid items-center gap-12 lg:grid-cols-[11fr_9fr] lg:gap-10">
        <div className="min-w-0">
          <ProblemCountPill problemCount={problemCount} isLoading={isLoading} />
          <h1
            id="hero-title"
            className="mt-6 text-balance text-[3rem] font-bold leading-none tracking-[-0.01em] text-strong md:text-display"
          >
            Crack your placement <span className="text-accent">coding round.</span>
          </h1>
          <p className="mt-6 max-w-[35rem] text-lead text-secondary">
            Practice in a real in-browser IDE, rehearse timed mock tests, and see where you stand — priced for
            students, in rupees.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" trailingIcon={ArrowRight} onClick={onTryProblem} className="w-full sm:w-auto">
              Try a problem now
            </Button>
            <Button variant="secondary" size="xl" onClick={onBrowse} className="w-full sm:w-auto">
              Browse problems
            </Button>
          </div>
          <p className="mt-4 text-body text-muted">Free to start · No card needed</p>
        </div>
        <HeroMontage />
      </MarketingContainer>
    </section>
  )
}
