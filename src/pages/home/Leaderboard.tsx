import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { PlayerChip } from '../../components/PlayerChip'
import { leaderboardAllTime, leaderboardWeekly, totalRanked } from '../../data/players'
import { formatNumber, formatPercent, signed } from '../../lib/format'
import { usePlayerLookup } from '../../state/user'
import type { Player } from '../../types'

type Mode = 'all-time' | 'weekly'
const visibleRows = 8

function Row({ player, rank, mode, isMe }: { player: Player; rank: number; mode: Mode; isMe: boolean }) {
  const sub = mode === 'all-time' ? `${formatPercent(player.stats.wins / player.stats.matches)} win rate` : `Rating ${formatNumber(player.rating)}`
  const weeklyClass = player.weeklyDelta > 0 ? 'delta--up' : player.weeklyDelta < 0 ? 'delta--down' : 'delta--flat'

  return (
    <li className={`lb-row${isMe ? ' is-me' : ''}`}>
      <span className={`lb-row__rank num${rank <= 3 ? ` lb-row__rank--${rank}` : ''}`}>{rank}</span>
      <PlayerChip player={player} size={34} sub={sub} />
      {isMe ? <span className="badge badge--p1">You</span> : null}
      <span className="lb-row__value">
        {mode === 'all-time' ? (
          <span className="num">{formatNumber(player.rating)}</span>
        ) : (
          <span className={`num delta ${weeklyClass}`}>{signed(player.weeklyDelta)}</span>
        )}
      </span>
    </li>
  )
}

export function Leaderboard() {
  const [mode, setMode] = useState<Mode>('all-time')
  // The lookup swaps in the edited profile for "You", so Settings changes show up here.
  const lookup = usePlayerLookup()

  const ranked = (mode === 'all-time' ? leaderboardAllTime() : leaderboardWeekly()).map((player) => lookup(player.id) ?? player)
  const myIndex = ranked.findIndex((player) => player.id === 'me')
  const top = ranked.slice(0, visibleRows)
  const meOutsideTop = myIndex >= visibleRows

  return (
    <section className="panel" aria-labelledby="board-title">
      <div className="panel__head">
        <h2 className="panel__title" id="board-title">
          <Trophy size={18} aria-hidden="true" />
          Leaderboard
        </h2>
        <div className="segmented" role="group" aria-label="Leaderboard period">
          <button type="button" className="segmented__btn" aria-pressed={mode === 'all-time'} onClick={() => setMode('all-time')}>
            All time
          </button>
          <button type="button" className="segmented__btn" aria-pressed={mode === 'weekly'} onClick={() => setMode('weekly')}>
            This week
          </button>
        </div>
      </div>

      <ol className="panel__body panel__body--flush">
        {top.map((player, index) => (
          <Row key={player.id} player={player} rank={index + 1} mode={mode} isMe={player.id === 'me'} />
        ))}
        {meOutsideTop ? (
          <>
            <li className="lb-gap" aria-hidden="true" />
            <Row player={ranked[myIndex]} rank={myIndex + 1} mode={mode} isMe />
          </>
        ) : null}
      </ol>

      <p className="lb-foot faint">
        {mode === 'all-time'
          ? `Ranked among ${formatNumber(totalRanked)} players. Sample ratings.`
          : 'Rating gained in the last 7 days.'}
      </p>
    </section>
  )
}
