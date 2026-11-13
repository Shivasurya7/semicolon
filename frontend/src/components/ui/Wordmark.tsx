import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.ts'

interface WordmarkProps {
  className?: string
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link
      to="/"
      aria-label="Semicolan home"
      className={cn('inline-flex items-baseline gap-0.5 rounded-xs text-[1.25rem] font-bold leading-none', className)}
    >
      <span aria-hidden="true" className="text-accent">
        ;
      </span>
      <span aria-hidden="true" className="text-strong">
        Semicolan
      </span>
    </Link>
  )
}
