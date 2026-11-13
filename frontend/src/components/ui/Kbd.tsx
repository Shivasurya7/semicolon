import { cn } from '../../lib/cn.ts'

interface NavigatorWithUAData extends Navigator {
  userAgentData?: { platform?: string }
}

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as NavigatorWithUAData
  const platform = nav.userAgentData?.platform ?? nav.platform ?? ''
  return /mac|iphone|ipad/i.test(platform)
}

interface KbdProps {
  keyName: string
  className?: string
}

export function Kbd({ keyName, className }: KbdProps) {
  const modifier = isApplePlatform() ? '⌘' : 'Ctrl'
  return (
    <kbd
      className={cn(
        'inline-flex h-5 items-center rounded-xs border border-row bg-raised px-1.5 font-sans text-meta text-muted',
        className,
      )}
    >
      {modifier} {keyName}
    </kbd>
  )
}
