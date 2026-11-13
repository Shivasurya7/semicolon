import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'

interface TooltipProps {
  label: string
  side?: 'top' | 'bottom'
  children: ReactNode
}

// Visual label only: the trigger already carries the same accessible name (aria-label), so this is aria-hidden.
export function Tooltip({ label, side = 'bottom', children }: TooltipProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={(event) => setOpen(event.target.matches(':focus-visible'))}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-row bg-input px-2 py-1 text-meta text-primary shadow-popover animate-fade-in',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
