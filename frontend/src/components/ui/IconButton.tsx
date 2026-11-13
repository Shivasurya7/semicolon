import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn.ts'
import { iconProps } from './icon.ts'
import { Tooltip } from './Tooltip.tsx'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  icon: LucideIcon
  label: string
  iconSize?: number
}

// 32 px minimum, 44 px on coarse pointers (UI_UX_Brief §9.1); the label is both the accessible name and the tooltip.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, iconSize = 16, className, ...rest },
  ref,
) {
  return (
    <Tooltip label={label}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        {...rest}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-fast ease-out hover:bg-raised hover:text-primary [@media(pointer:coarse)]:size-11',
          className,
        )}
      >
        <Icon {...iconProps} size={iconSize} />
      </button>
    </Tooltip>
  )
})
