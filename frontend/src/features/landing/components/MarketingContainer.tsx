import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'

interface MarketingContainerProps {
  className?: string
  children: ReactNode
}

export function MarketingContainer({ className, children }: MarketingContainerProps) {
  return <div className={cn('mx-auto w-full max-w-marketing px-4', className)}>{children}</div>
}
