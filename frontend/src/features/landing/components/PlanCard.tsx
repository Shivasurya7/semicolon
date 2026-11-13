import { useId } from 'react'
import { Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { iconProps } from '../../../components/ui/icon.ts'
import { cn } from '../../../lib/cn.ts'
import { formatDuration, formatRupees } from '../../../lib/format.ts'

interface PlanCardProps {
  name: string
  pricePaise: number
  durationDays?: number
  meta: string
  features: string[]
  cta: { label: string; variant: 'primary' | 'secondary' | 'highlight'; onClick: () => void }
  featured?: boolean
}

// UI_UX_Brief §9.5; the single featured plan uses plan-featured, premium-border and the highlight CTA.
export function PlanCard({ name, pricePaise, durationDays, meta, features, cta, featured = false }: PlanCardProps) {
  const titleId = useId()
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'relative flex h-full flex-col rounded-md border p-6',
        featured ? 'border-premium bg-plan-featured' : 'bg-card',
      )}
    >
      {featured && (
        <span className="absolute -top-3 right-4 inline-flex h-6 items-center rounded-md border border-success bg-base px-2 text-meta font-medium text-success">
          Best value
        </span>
      )}
      <h3 id={titleId} className="text-[1.25rem] font-normal text-muted">
        {name}
      </h3>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-stat font-medium text-strong tabular-nums">{formatRupees(pricePaise)}</span>
        {durationDays !== undefined && (
          <span className="text-[1rem] text-secondary">
            <span aria-hidden="true">/ </span>
            <span className="sr-only">for </span>
            {formatDuration(durationDays)}
          </span>
        )}
      </p>
      <p className="mt-1 text-meta text-muted">{meta}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-[1rem] text-secondary">
            <Check {...iconProps} size={16} className="mt-1 shrink-0 text-accent-icon" />
            {feature}
          </li>
        ))}
      </ul>
      <Button variant={cta.variant} size="lg" onClick={cta.onClick} className="mt-8 w-full">
        {cta.label}
      </Button>
    </article>
  )
}
