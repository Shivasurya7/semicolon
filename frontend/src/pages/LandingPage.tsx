import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SUPPORT_EMAIL, WARMUP_PROBLEM_SLUG } from '../config.ts'
import { faqs } from '../features/landing/landing.content.ts'
import {
  countsFixture,
  countsPartialFixture,
  featuredPlanCodeFixture,
  plansFixture,
} from '../features/landing/landing.fixtures.ts'
import { LandingView } from '../features/landing/LandingView.tsx'

const CURRENT_YEAR = new Date().getUTCFullYear()

// Static milestone: fixtures stand in for GET /api/plans and the catalog counts (plan/plan_1.md §10).
// In development only, ?preview=loading or ?preview=partial renders the skeleton and hidden-card states.
function usePreviewState() {
  const [params] = useSearchParams()
  const preview = import.meta.env.DEV ? params.get('preview') : null
  return {
    isLoading: preview === 'loading',
    counts: preview === 'partial' ? countsPartialFixture : countsFixture,
  }
}

function LandingPage() {
  const navigate = useNavigate()
  const { isLoading, counts } = usePreviewState()

  // The sign-in dialog (Implementation_Plan 1.2) replaces this; until then the request is recorded in the URL only.
  const onSignIn = useCallback(() => navigate({ search: '?signin=1' }), [navigate])
  const onOpenSearch = useCallback(() => {}, [])

  return (
    <LandingView
      counts={counts}
      isLoading={isLoading}
      plans={plansFixture}
      featuredPlanCode={featuredPlanCodeFixture}
      faqs={faqs}
      supportEmail={SUPPORT_EMAIL}
      year={CURRENT_YEAR}
      onTryProblem={() => navigate(`/problems/${WARMUP_PROBLEM_SLUG}`)}
      onBrowse={() => navigate('/problems')}
      onSignIn={onSignIn}
      onChoosePlan={onSignIn}
      onOpenSearch={onOpenSearch}
    />
  )
}

export default LandingPage
