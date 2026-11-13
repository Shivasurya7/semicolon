import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'

interface SectionHeadingProps {
  id: string
  title: ReactNode
  sub?: ReactNode
  align?: 'start' | 'center'
  titleClassName?: string
  subClassName?: string
}

// Section titles are h2 regardless of their marketing type token; the hero holds the page's only h1.
export function SectionHeading({ id, title, sub, align = 'start', titleClassName, subClassName }: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={cn(centered && 'text-center')}>
      <h2
        id={id}
        className={cn(
          'text-balance text-h1-marketing font-bold text-strong',
          centered ? 'mx-auto max-w-[45rem]' : 'max-w-[40rem]',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {sub && <p className={cn('mt-4', centered && 'mx-auto max-w-[40rem]', subClassName)}>{sub}</p>}
    </div>
  )
}
