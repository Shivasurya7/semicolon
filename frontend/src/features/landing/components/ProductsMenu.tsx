import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { iconProps } from '../../../components/ui/icon.ts'
import { cn } from '../../../lib/cn.ts'
import { productModules } from '../landing.content.ts'

// A disclosure of navigation links, deliberately not role="menu" (these are links, not commands).
export function ProductsMenu() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-xs text-[1rem] text-primary transition-colors duration-fast ease-out hover:text-accent"
      >
        Products
        <ChevronDown
          {...iconProps}
          size={16}
          className={cn('transition-transform duration-base ease-out', open && 'rotate-180')}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 mt-3 w-[36rem] rounded-md border border-row bg-input p-2 shadow-popover animate-dialog-in"
      >
        <ul className="grid grid-cols-2 gap-1">
          {productModules.map(({ name, icon: Icon, to, description }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => setOpen(false)}
                className="flex gap-3 rounded-md p-3 transition-colors duration-fast ease-out hover:bg-raised"
              >
                <Icon {...iconProps} size={20} className="mt-0.5 shrink-0 text-accent-icon" />
                <span className="flex flex-col">
                  <span className="text-body font-medium text-primary">{name}</span>
                  <span className="text-meta text-muted">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
