import { steps } from '../landing.content.ts'
import { MarketingBackdrop } from './MarketingBackdrop.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'
import { SectionHeading } from './SectionHeading.tsx'

function StepCard({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <li className="flex flex-col rounded-lg border bg-step-card p-8 transition-colors duration-fast ease-out focus-within:border-hover hover:border-hover sm:min-h-[18.5rem]">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full bg-step-badge text-[1.25rem] font-bold text-step-badge tabular-nums"
      >
        {number}
      </span>
      <h3 className="mt-6 text-[1.25rem] font-bold text-strong">{title}</h3>
      <p className="mt-3 text-[1rem] leading-[1.6] text-muted">{body}</p>
    </li>
  )
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative isolate">
      <MarketingBackdrop variant="glow" />
      <MarketingContainer>
        <SectionHeading
          id="how-title"
          align="center"
          title="Four steps to your first verdict"
          sub="Start free in under a minute."
          subClassName="text-[1.125rem] text-muted"
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <StepCard key={step.title} number={index + 1} title={step.title} body={step.body} />
          ))}
        </ol>
      </MarketingContainer>
    </section>
  )
}
