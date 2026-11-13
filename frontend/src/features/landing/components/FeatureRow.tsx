import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'
import { iconProps } from '../../../components/ui/icon.ts'
import { cn } from '../../../lib/cn.ts'

interface FeatureRowProps {
  icon: LucideIcon
  title: string
  body: string
  action: { label: string; to: string }
  seeAlso?: Array<{ label: string; to: string }>
  visual: ReactNode
  reversed?: boolean
}

export function FeatureRow({ icon: Icon, title, body, action, seeAlso, visual, reversed = false }: FeatureRowProps) {
  return (
    <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <span
        aria-hidden="true"
        className="absolute -left-[calc(2.5rem+3.5px)] top-3 hidden size-2 rounded-full bg-accent-icon lg:block"
      />
      <div>
        <span className="grid size-10 place-items-center rounded-md border bg-card">
          <Icon {...iconProps} size={24} className="text-accent-icon" />
        </span>
        <h3 className="mt-6 text-[1.875rem] font-bold leading-[1.2] text-strong md:text-[2.25rem]">{title}</h3>
        <p className="mt-4 max-w-[32rem] text-body-lg text-secondary">{body}</p>
        <Button size="lg" to={action.to} trailingIcon={ArrowRight} className="mt-8">
          {action.label}
        </Button>
        {seeAlso && seeAlso.length > 0 && (
          <p className="mt-4 text-body text-muted">
            See also:{' '}
            {seeAlso.map((link, index) => (
              <span key={link.to}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <Button variant="link" to={link.to}>
                  {link.label}
                </Button>
              </span>
            ))}
          </p>
        )}
      </div>
      <div className={cn('min-w-0', reversed && 'lg:order-first')}>{visual}</div>
    </div>
  )
}
