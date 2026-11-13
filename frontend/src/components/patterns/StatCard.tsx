import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCount } from '../../lib/format.ts'
import { iconProps } from '../ui/icon.ts'
import { Skeleton } from '../ui/Skeleton.tsx'

interface StatCardProps {
  label: string
  icon: LucideIcon
  to: string
  value: number | undefined
  loading: boolean
}

// UI_UX_Brief §9.5: numbers only ever come from data; skeleton while loading. Callers hide the card when value is undefined.
export function StatCard({ label, icon: Icon, to, value, loading }: StatCardProps) {
  return (
    <Link
      to={to}
      aria-busy={loading || undefined}
      className="group flex flex-col items-center rounded-md border bg-card p-6 text-center transition-colors duration-fast ease-out hover:border-hover hover:bg-row"
    >
      <span className="flex items-center gap-2 text-body text-secondary">
        <Icon {...iconProps} size={16} className="text-muted" />
        {label}
        <ChevronRight
          {...iconProps}
          size={16}
          className="text-muted transition-transform duration-fast ease-out group-hover:translate-x-0.5"
        />
      </span>
      {loading || value === undefined ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <span className="mt-3 text-stat font-medium text-strong tabular-nums">{formatCount(value)}</span>
      )}
    </Link>
  )
}
