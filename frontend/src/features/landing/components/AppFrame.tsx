import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { iconProps } from '../../../components/ui/icon.ts'
import { cn } from '../../../lib/cn.ts'

interface AppFrameProps {
  label: string
  header: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

// An imitation of the app window (Prompt 1 §2). Decorative: one text alternative, nothing inside is focusable.
export function AppFrame({ label, header, footer, className, children }: AppFrameProps) {
  return (
    <figure role="img" aria-label={label} className={cn('overflow-hidden rounded-lg border bg-surface', className)}>
      <div aria-hidden="true" inert>
        <div className="flex h-10 items-center justify-between gap-3 border-b bg-raised px-3">{header}</div>
        {children}
        {footer && (
          <div className="flex h-12 items-center justify-between gap-2 border-t bg-raised px-3">{footer}</div>
        )}
      </div>
    </figure>
  )
}

const fakeButtonVariants = {
  ghost: 'text-muted',
  secondary: 'border border-strong text-muted',
  success: 'border border-success text-success',
} as const

interface FakeButtonProps {
  variant: keyof typeof fakeButtonVariants
  icon?: LucideIcon
  children: ReactNode
}

// Looks like Button size sm but is a span, so screen readers and the tab order never meet it.
export function FakeButton({ variant, icon: Icon, children }: FakeButtonProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-body font-medium',
        fakeButtonVariants[variant],
      )}
    >
      {Icon && <Icon {...iconProps} size={14} />}
      {children}
    </span>
  )
}
