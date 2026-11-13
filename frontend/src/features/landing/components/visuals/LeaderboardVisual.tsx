import { AppFrame } from '../AppFrame.tsx'

// Other entrants are abstract bars, never invented people or colleges (UI_Component_Spec §6).
const others: Array<{ rank: number; points: number; barWidth: string }> = [
  { rank: 1, points: 64, barWidth: 'w-28' },
  { rank: 2, points: 58, barWidth: 'w-20' },
  { rank: 3, points: 51, barWidth: 'w-24' },
]

export function LeaderboardVisual() {
  return (
    <AppFrame
      label="Preview of the weekly leaderboard with your rank highlighted."
      header={
        <>
          <span className="text-body text-primary">Weekly leaderboard</span>
          <span className="text-meta text-muted">This week</span>
        </>
      }
    >
      <ul>
        {others.map(({ rank, points, barWidth }) => (
          <li key={rank} className="flex items-center gap-3 px-4 py-3">
            <span className="w-8 text-body font-medium text-muted tabular-nums">#{rank}</span>
            <span className={`block h-2.5 rounded-xs bg-chip ${barWidth}`} />
            <span className="ml-auto text-body text-secondary tabular-nums">{points} pts</span>
          </li>
        ))}
        <li className="flex items-center gap-3 border-t bg-accent-subtle px-4 py-3">
          <span className="w-8 text-body font-medium text-accent tabular-nums">#12</span>
          <span className="text-body font-medium text-accent">You</span>
          <span className="ml-auto text-body text-secondary tabular-nums">18 pts</span>
        </li>
      </ul>
    </AppFrame>
  )
}
