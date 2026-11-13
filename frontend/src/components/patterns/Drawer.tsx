import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { cn } from '../../lib/cn.ts'

interface DrawerProps {
  open: boolean
  onClose: () => void
  label: string
  className?: string
  children: ReactNode
}

// Slides in from the start edge (UI_Component_Spec §4.3). Stays mounted so the exit transition plays; `inert` when closed.
export function Drawer({ open, onClose, label, className, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, onClose)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div inert={!open} className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-scrim transition-opacity duration-base ease-out',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-subtle bg-base p-4 duration-base ease-out',
          // Visibility flips instantly on open (so focus can move in) and only after the slide on close.
          open ? 'visible translate-x-0 transition-transform' : 'invisible -translate-x-full transition-[transform,visibility]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
