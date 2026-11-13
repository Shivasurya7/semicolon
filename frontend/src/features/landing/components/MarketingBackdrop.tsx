import { cn } from '../../../lib/cn.ts'

interface MarketingBackdropProps {
  variant: 'grid' | 'glow'
  className?: string
}

// Decorative only (UI_UX_Brief §8.3). The parent must be `relative isolate`; hidden under prefers-contrast and forced colors.
export function MarketingBackdrop({ variant, className }: MarketingBackdropProps) {
  if (variant === 'grid') {
    return (
      <div
        aria-hidden="true"
        className={cn('marketing-backdrop bg-grid-fade pointer-events-none absolute inset-0 -z-10', className)}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        'marketing-backdrop bg-accent-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[37.5rem] -translate-x-1/2 -translate-y-1/2',
        className,
      )}
    />
  )
}
