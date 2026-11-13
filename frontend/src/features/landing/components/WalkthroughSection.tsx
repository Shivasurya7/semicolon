import { Code2, Timer, Trophy } from 'lucide-react'
import { FeatureRow } from './FeatureRow.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'
import { SectionHeading } from './SectionHeading.tsx'
import { IdeVisual } from './visuals/IdeVisual.tsx'
import { LeaderboardVisual } from './visuals/LeaderboardVisual.tsx'
import { MockTestVisual } from './visuals/MockTestVisual.tsx'

export function WalkthroughSection() {
  return (
    <section aria-labelledby="walkthrough-title">
      <MarketingContainer>
        <SectionHeading
          id="walkthrough-title"
          title="One place to practise, test and improve"
          sub="Solve problems, rehearse timed tests and track your rank — all in one account."
          subClassName="max-w-[40rem] text-body-lg text-muted"
        />
        <div className="relative mt-12 flex flex-col gap-16 lg:gap-24 lg:pl-10">
          <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 hidden w-px bg-border lg:block" />
          <FeatureRow
            icon={Code2}
            title="Solve in a real IDE"
            body="Write C, C++, Java or Python 3 in a full editor. Run the sample tests, then submit against every hidden test and get a clear verdict."
            action={{ label: 'Start with Arrays', to: '/problems?topic=arrays' }}
            seeAlso={[
              { label: 'Dynamic Programming', to: '/problems?topic=dynamic-programming' },
              { label: 'Trees', to: '/problems?topic=trees' },
            ]}
            visual={
              <IdeVisual label="Preview of the Workspace editor with a Python solution, a problem statement, and Run and Submit buttons." />
            }
          />
          <FeatureRow
            icon={Timer}
            title="Rehearse under time pressure"
            body="Timed mock tests with a server-side clock, a final report and per-problem verdicts — the closest thing to the real round."
            action={{ label: 'See mock tests', to: '/mock-tests' }}
            visual={<MockTestVisual />}
            reversed
          />
          <FeatureRow
            icon={Trophy}
            title="See where you stand"
            body="Earn difficulty-weighted points for every first solve and track your weekly rank."
            action={{ label: 'View leaderboard', to: '/leaderboard' }}
            visual={<LeaderboardVisual />}
          />
        </div>
      </MarketingContainer>
    </section>
  )
}
