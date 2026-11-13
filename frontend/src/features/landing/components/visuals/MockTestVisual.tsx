import { Circle, CircleCheck, CircleDot, Timer, type LucideIcon } from 'lucide-react'
import { iconProps } from '../../../../components/ui/icon.ts'
import { AppFrame } from '../AppFrame.tsx'

interface StatusStyle {
  label: string
  icon: LucideIcon
  className: string
}

const statuses: Record<'accepted' | 'attempted' | 'notStarted', StatusStyle> = {
  accepted: { label: 'Accepted', icon: CircleCheck, className: 'text-success' },
  attempted: { label: 'Attempted', icon: CircleDot, className: 'text-warning' },
  notStarted: { label: 'Not started', icon: Circle, className: 'text-muted' },
}

const rows: Array<{ title: string; meta: string; status: keyof typeof statuses }> = [
  { title: 'Rotate an array', meta: 'Easy · Arrays', status: 'accepted' },
  { title: 'Shortest path in a grid', meta: 'Medium · Graphs', status: 'attempted' },
  { title: 'Count set bits', meta: 'Medium · Bit manipulation', status: 'notStarted' },
]

export function MockTestVisual() {
  return (
    <AppFrame
      label="Preview of a mock test in progress: three problems with their status and the time left."
      header={
        <>
          <span className="flex items-center gap-2 text-body text-primary">
            <Timer {...iconProps} size={16} className="text-muted" />
            Mock test · 90 min
          </span>
          <span className="text-body font-medium text-primary tabular-nums">54:12 left</span>
        </>
      }
    >
      <ul className="divide-y divide-row">
        {rows.map(({ title, meta, status }) => {
          const { label, icon: Icon, className } = statuses[status]
          return (
            <li key={title} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body text-primary">{title}</span>
                <span className="text-meta text-muted">{meta}</span>
              </span>
              <span className={`inline-flex shrink-0 items-center gap-1.5 text-meta font-medium ${className}`}>
                <Icon {...iconProps} size={14} />
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </AppFrame>
  )
}
