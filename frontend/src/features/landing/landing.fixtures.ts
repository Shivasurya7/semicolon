import type { LandingCounts, Plan } from './landing.types.ts'

// Preview data only, imported by LandingPage until the API is wired. Never render these values from markup.

export const countsFixture: LandingCounts = {
  problemCount: 650,
  designCount: 120,
  companyCount: 48,
  theoryCount: 340,
}

export const countsPartialFixture: LandingCounts = {
  problemCount: 650,
}

export const plansFixture: Plan[] = [
  { code: 'PREMIUM_3M', name: '3 months', durationDays: 90, pricePaise: 49900, currency: 'INR' },
  { code: 'PREMIUM_12M', name: '12 months', durationDays: 365, pricePaise: 99900, currency: 'INR' },
]

// GET /api/plans has no featured flag yet (plan/plan_1.md §13 item 2), so the preview names it explicitly.
export const featuredPlanCodeFixture = 'PREMIUM_3M'
