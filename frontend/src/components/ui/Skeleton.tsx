import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn.ts'

const SHOW_AFTER_MS = 150

interface SkeletonProps {
  className?: string
}

// Holds its final size from the first frame but only becomes visible after 150 ms, so fast loads never flash (UI_Component_Spec §5.1).
export function Skeleton({ className }: SkeletonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <span
      aria-hidden="true"
      className={cn('block rounded-md', visible ? 'bg-raised animate-skeleton' : 'bg-transparent', className)}
    />
  )
}
