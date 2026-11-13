import { ChevronDown, CircleCheck, CloudUpload, Play } from 'lucide-react'
import { iconProps } from '../../../../components/ui/icon.ts'
import { cn } from '../../../../lib/cn.ts'
import { MONTAGE_ACTIVE_LINE, montageCode } from '../../landing.content.ts'
import type { SyntaxTone } from '../../landing.types.ts'
import { AppFrame, FakeButton } from '../AppFrame.tsx'

const toneClasses: Record<SyntaxTone, string> = {
  keyword: 'text-syn-keyword',
  control: 'text-syn-control',
  function: 'text-syn-function',
  default: 'text-syn-default',
  number: 'text-syn-number',
  string: 'text-syn-string',
  comment: 'text-syn-comment',
  type: 'text-syn-type',
}

interface IdeVisualProps {
  label?: string
  verdictInFooter?: boolean
  className?: string
}

export function IdeVisual({
  label = 'Preview of the Semicolan Workspace: a problem statement, a Python solution and an Accepted verdict.',
  verdictInFooter = false,
  className,
}: IdeVisualProps) {
  return (
    <AppFrame
      label={label}
      className={className}
      header={
        <>
          <div className="flex h-full items-stretch gap-6 text-body">
            <span className="relative flex items-center text-accent">
              Description
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
            </span>
            <span className="flex items-center text-muted">Solution</span>
            <span className="hidden items-center text-muted xs:flex">Submissions</span>
          </div>
          <span className="flex h-7 items-center gap-1 rounded-md border border-strong px-2 text-body text-muted">
            Python 3
            <ChevronDown {...iconProps} size={14} />
          </span>
        </>
      }
      footer={
        <>
          {verdictInFooter ? (
            <span className="inline-flex items-center gap-1.5 text-body sm:hidden">
              <CircleCheck {...iconProps} size={16} className="text-success" />
              <span className="font-medium text-success">Accepted</span>
              <span className="text-secondary tabular-nums">· 42 ms</span>
            </span>
          ) : null}
          <span className={cn(verdictInFooter && 'hidden sm:inline-flex')}>
            <FakeButton variant="ghost">Console</FakeButton>
          </span>
          <span className="flex items-center gap-2">
            <FakeButton variant="secondary" icon={Play}>
              Run
            </FakeButton>
            <FakeButton variant="success" icon={CloudUpload}>
              Submit
            </FakeButton>
          </span>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]">
        {/* Hidden where the frame is too narrow to show both columns: phones and the 1024–1279 two-column band. */}
        <div className="hidden space-y-2 border-r p-4 sm:block lg:hidden xl:block">
          <span className="block h-3 w-2/3 rounded-xs bg-chip" />
          <span className="block h-2 w-full rounded-xs bg-chip" />
          <span className="block h-2 w-[90%] rounded-xs bg-chip" />
          <span className="block h-2 w-[95%] rounded-xs bg-chip" />
          <span className="block h-2 w-[70%] rounded-xs bg-chip" />
          <div className="mt-4 space-y-1 rounded-md bg-inset p-3 font-mono text-code-sm text-secondary">
            <p className="truncate">Input: nums = [2,7,11,15], target = 9</p>
            <p>Output: [0,1]</p>
          </div>
        </div>
        <div className="overflow-hidden p-4 font-mono text-code-sm">
          {montageCode.map((tokens, index) => {
            const lineNumber = index + 1
            return (
              <div key={lineNumber} className="flex gap-4 whitespace-pre">
                <span
                  className={cn(
                    'w-5 shrink-0 text-right tabular-nums',
                    lineNumber === MONTAGE_ACTIVE_LINE ? 'text-primary' : 'text-syn-line-number',
                  )}
                >
                  {lineNumber}
                </span>
                <code>
                  {tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} className={toneClasses[token.tone]}>
                      {token.text}
                    </span>
                  ))}
                </code>
              </div>
            )
          })}
        </div>
      </div>
    </AppFrame>
  )
}
