import { BookOpen, Boxes, Building2, Code2, type LucideIcon } from 'lucide-react'
import { StatCard } from '../../../components/patterns/StatCard.tsx'
import { cn } from '../../../lib/cn.ts'
import type { LandingCounts } from '../landing.types.ts'
import { MarketingContainer } from './MarketingContainer.tsx'
import { ModuleChips } from './ModuleChips.tsx'

interface StatsSectionProps {
  counts: LandingCounts
  isLoading: boolean
}

const cards: Array<{ key: keyof LandingCounts; label: string; icon: LucideIcon; to: string }> = [
  { key: 'problemCount', label: 'Problems', icon: Code2, to: '/problems' },
  { key: 'designCount', label: 'System & low-level design', icon: Boxes, to: '/design/hld' },
  { key: 'companyCount', label: 'Companies', icon: Building2, to: '/companies' },
  { key: 'theoryCount', label: 'Theory & quizzes', icon: BookOpen, to: '/devops' },
]

// Fewer than four cards stay card-sized and centered instead of stretching across the row.
const mdColumns = [
  '',
  'md:grid-cols-[minmax(0,18rem)] md:justify-center',
  'md:grid-cols-[repeat(2,minmax(0,18rem))] md:justify-center',
  'md:grid-cols-[repeat(3,minmax(0,18rem))] md:justify-center',
  'md:grid-cols-4',
]

// A count that is unavailable hides its card: a number is never invented (Prompt 1 §3).
export function StatsSection({ counts, isLoading }: StatsSectionProps) {
  const visible = isLoading ? cards : cards.filter((card) => counts[card.key] !== undefined)
  const singleRowBelowMd = visible.length === 1 ? 'xs:grid-cols-[minmax(0,18rem)] xs:justify-center' : 'xs:grid-cols-2'

  return (
    <section aria-labelledby="stats-title">
      <MarketingContainer>
        <ModuleChips />
        <h2 id="stats-title" className="mt-16 text-center text-[1.375rem] font-bold text-strong">
          Everything you need for the coding round
        </h2>
        {visible.length > 0 && (
          <ul className={cn('mt-12 grid grid-cols-1 gap-4', singleRowBelowMd, mdColumns[visible.length])}>
            {visible.map(({ key, label, icon, to }) => (
              <li key={key} className="grid">
                <StatCard label={label} icon={icon} to={to} value={counts[key]} loading={isLoading} />
              </li>
            ))}
          </ul>
        )}
      </MarketingContainer>
    </section>
  )
}
