import { CircleAlert } from 'lucide-react'
import { iconProps } from '../../../components/ui/icon.ts'
import { painPoints } from '../landing.content.ts'
import { MarketingBackdrop } from './MarketingBackdrop.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'
import { SectionHeading } from './SectionHeading.tsx'

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-title" className="relative isolate">
      <MarketingBackdrop variant="grid" className="h-80" />
      <MarketingContainer>
        <SectionHeading
          id="problem-title"
          title="Placement prep shouldn't feel like guesswork"
          sub="Most students hit the same walls."
          subClassName="text-h2-marketing font-medium text-primary"
        />
        <ul className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {painPoints.map((point) => (
            <li key={point} className="flex gap-4">
              <CircleAlert {...iconProps} size={20} className="mt-1 shrink-0 text-error" />
              <span className="text-body-lg text-secondary">{point}</span>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </section>
  )
}
