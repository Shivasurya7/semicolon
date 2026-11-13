import { Button } from '../../../components/ui/Button.tsx'
import { cn } from '../../../lib/cn.ts'
import { freePlanFeatures, premiumPlanFeatures } from '../landing.content.ts'
import type { Plan } from '../landing.types.ts'
import { MarketingBackdrop } from './MarketingBackdrop.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'
import { PlanCard } from './PlanCard.tsx'
import { SectionHeading } from './SectionHeading.tsx'

interface PricingSectionProps {
  plans: Plan[]
  featuredPlanCode?: string
  onSignIn: () => void
  onChoosePlan: (code: string) => void
}

export function PricingSection({ plans, featuredPlanCode, onSignIn, onChoosePlan }: PricingSectionProps) {
  return (
    <section id="pricing" aria-labelledby="pricing-title">
      <MarketingContainer>
        <SectionHeading
          id="pricing-title"
          align="center"
          title="Simple prices, in rupees"
          sub="One-time payment. No auto-renewal. Extend any time."
          subClassName="text-[1.125rem] text-secondary"
        />
        <ul className="mx-auto mt-12 grid max-w-[60rem] grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] items-stretch gap-4">
          <li>
            <PlanCard
              name="Free"
              pricePaise={0}
              meta="No card needed"
              features={freePlanFeatures}
              cta={{ label: 'Start free', variant: 'secondary', onClick: onSignIn }}
            />
          </li>
          {plans.map((plan) => {
            const featured = plan.code === featuredPlanCode
            return (
              <li key={plan.code} className={cn(featured && 'relative isolate')}>
                {featured && <MarketingBackdrop variant="glow" />}
                <PlanCard
                  name={plan.name}
                  pricePaise={plan.pricePaise}
                  durationDays={plan.durationDays}
                  meta={`Billed once · access for ${plan.durationDays} days`}
                  features={premiumPlanFeatures}
                  featured={featured}
                  cta={{
                    label: 'Get Premium',
                    variant: featured ? 'highlight' : 'primary',
                    onClick: () => onChoosePlan(plan.code),
                  }}
                />
              </li>
            )
          })}
        </ul>
        <p className="mt-8 text-center text-body text-muted">
          Pay with UPI, cards or netbanking via Razorpay · 7-day refund if you haven't started a mock test —{' '}
          <Button variant="link" to="/legal/refund-policy">
            Refund policy
          </Button>
        </p>
      </MarketingContainer>
    </section>
  )
}
