import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn.ts'
import { iconProps } from './icon.ts'

export type ButtonVariant = 'primary' | 'secondary' | 'highlight' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'pill'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: LucideIcon
  trailingIcon?: LucideIcon
  className?: string
  children: ReactNode
}

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { to?: undefined; href?: undefined }
type AsRouterLink = CommonProps & Omit<LinkProps, keyof CommonProps> & { to: LinkProps['to']; href?: undefined }
type AsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string; to?: undefined }

export type ButtonProps = AsButton | AsRouterLink | AsAnchor

// UI_UX_Brief §9.1. Hover changes color only: no scale, lift or shadow (UI_Component_Spec §4.1).
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent-emphasis text-on-accent hover:bg-accent-emphasis-hover',
  secondary: 'border border-strong text-muted hover:bg-raised hover:text-primary',
  highlight: 'bg-highlight text-on-highlight hover:bg-overlay-dark',
  ghost: 'text-muted hover:bg-raised hover:text-primary',
  link: 'text-accent underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-body rounded-md',
  md: 'h-8 px-3 text-body rounded-md',
  lg: 'h-10 px-4 text-body rounded-md',
  xl: 'h-14 px-7 text-[1.125rem] font-semibold rounded-full',
  // The marketing nav's Sign in (Prompt 1 §1: h-9, radius-full).
  pill: 'h-9 px-3 sm:px-4 text-body rounded-full',
}

function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-fast ease-out',
    variant === 'link' ? 'text-body' : sizeClasses[size],
    variantClasses[variant],
    className,
  )
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    leadingIcon: Leading,
    trailingIcon: Trailing,
    className,
    children,
    ...rest
  } = props
  const classes = buttonClasses(variant, size, className)
  const content = (
    <>
      {Leading && <Leading {...iconProps} size={16} />}
      {children}
      {Trailing && <Trailing {...iconProps} size={16} />}
    </>
  )

  if (rest.to !== undefined) {
    return (
      <Link {...(rest as Omit<AsRouterLink, keyof CommonProps>)} className={classes}>
        {content}
      </Link>
    )
  }
  if (rest.href !== undefined) {
    return (
      <a {...(rest as Omit<AsAnchor, keyof CommonProps>)} className={classes}>
        {content}
      </a>
    )
  }
  const buttonRest = rest as Omit<AsButton, keyof CommonProps>
  return (
    <button type="button" {...buttonRest} className={classes}>
      {content}
    </button>
  )
}
