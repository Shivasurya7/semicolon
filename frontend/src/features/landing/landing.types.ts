import type { LucideIcon } from 'lucide-react'

// Shape of one item of GET /api/plans (API_Contract).
export interface Plan {
  code: string
  name: string
  durationDays: number
  pricePaise: number
  currency: 'INR'
}

export interface LandingCounts {
  problemCount?: number
  designCount?: number
  companyCount?: number
  theoryCount?: number
}

export interface Faq {
  question: string
  answer: string
}

export interface ModuleLink {
  name: string
  chipLabel?: string
  icon: LucideIcon
  to: string
  description: string
}

export type SyntaxTone = 'keyword' | 'control' | 'function' | 'default' | 'number' | 'string' | 'comment' | 'type'

export interface CodeToken {
  text: string
  tone: SyntaxTone
}

export interface LandingViewProps {
  counts: LandingCounts
  isLoading: boolean
  plans: Plan[]
  featuredPlanCode?: string
  faqs: Faq[]
  supportEmail: string
  year: number
  onTryProblem: () => void
  onBrowse: () => void
  onSignIn: () => void
  onChoosePlan: (code: string) => void
  onOpenSearch: () => void
}
