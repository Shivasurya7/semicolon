import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.ts'
import { iconProps } from '../ui/icon.ts'

interface AccordionProps {
  className?: string
  children: ReactNode
}

export function Accordion({ className, children }: AccordionProps) {
  return <div className={cn('border-t border-row', className)}>{children}</div>
}

interface AccordionItemProps {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

// APG accordion: a heading wrapping a button with aria-expanded, and a labelled region (UI_Component_Spec §3.2, §4.3).
export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const buttonId = `${id}-button`
  const panelId = `${id}-panel`

  return (
    <div className="border-b border-row">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-row-title text-muted transition-colors duration-fast ease-out hover:text-primary aria-expanded:text-primary"
        >
          <span>{title}</span>
          <ChevronDown
            {...iconProps}
            size={16}
            className={cn('shrink-0 transition-transform duration-base ease-out', open && 'rotate-180')}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-base ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
