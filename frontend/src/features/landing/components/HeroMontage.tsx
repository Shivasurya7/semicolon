import { CircleCheck } from 'lucide-react'
import { iconProps } from '../../../components/ui/icon.ts'
import { IdeVisual } from './visuals/IdeVisual.tsx'

// The frame's aria-label already states the verdict, so the overlapping card is aria-hidden.
export function HeroMontage() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[40rem] lg:max-w-none">
      <IdeVisual verdictInFooter />
      <div
        aria-hidden="true"
        className="absolute -bottom-6 left-6 hidden items-center gap-2 rounded-md border border-success/40 bg-base px-3 py-2 shadow-popover sm:flex"
      >
        <span className="absolute inset-0 rounded-md bg-success/12" />
        <CircleCheck {...iconProps} size={16} className="relative text-success" />
        <span className="relative text-body font-medium text-success">Accepted</span>
        <span className="relative text-body text-secondary tabular-nums">· 42 ms</span>
      </div>
    </div>
  )
}
