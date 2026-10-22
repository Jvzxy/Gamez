import { ChartNoAxesColumn } from 'lucide-react'
import type { CSSProperties } from 'react'
import { TrendChart } from '../../components/ui/charts'
import { GameGlyph } from '../../components/ui/GameIcon'
import { getGame } from '../../data/games'
import { formatNumber, formatPercent, signed } from '../../lib/format'
import type { Player } from '../../types'

export function StatsPanel({ player }: { player: Player }) {
  const { stats } = player
  const winRate = stats.wins / stats.matches
  const segments = [
    { key: 'win', label: 'Wins', value: stats.wins },
    { key: 'draw', label: 'Draws', value: stats.draws },
    { key: 'loss', label: 'Losses', value: stats.losses },
  ]
  const weeklyClass = player.weeklyDelta > 0 ? 'delta--up' : player.weeklyDelta < 0 ? 'delta--down' : 'delta--flat'

  return (
    <section className="panel" aria-labelledby="stats-title">
      <div className="panel__head">
        <h2 className="panel__title" id="stats-title">
          <ChartNoAxesColumn size={18} aria-hidden="true" />
          Player statistics
        </h2>
      </div>

      <div className="panel__body stats">
        <dl className="stat-grid">
          <div>
            <dt>Rating</dt>
            <dd className="num">{formatNumber(player.rating)}</dd>
            <span className="faint">
              <span className={`delta ${weeklyClass}`}>{signed(player.weeklyDelta)}</span> this week
            </span>
          </div>
          <div>
            <dt>Win rate</dt>
            <dd className="num">{formatPercent(winRate)}</dd>
            <span className="faint">{formatNumber(stats.matches)} matches</span>
          </div>
          <div>
            <dt>Current streak</dt>
            <dd className="num">{stats.currentStreak}</dd>
            <span className="faint">{stats.currentStreak === 1 ? 'win' : 'wins'} in a row</span>
          </div>
          <div>
            <dt>Best streak</dt>
            <dd className="num">{stats.bestStreak}</dd>
            <span className="faint">all time</span>
          </div>
        </dl>

        <div className="stats__block">
          <h3>Results</h3>
          <div
            className="results-bar"
            role="img"
            aria-label={`${stats.wins} wins, ${stats.draws} draws, ${stats.losses} losses`}
          >
            {segments.map((segment) => (
              <span key={segment.key} className={`results-bar__seg results-bar__seg--${segment.key}`} style={{ flexGrow: segment.value }} />
            ))}
          </div>
          <ul className="results-legend">
            {segments.map((segment) => (
              <li key={segment.key}>
                <span className={`results-legend__swatch results-bar__seg--${segment.key}`} aria-hidden="true" />
                <span>{segment.label}</span>
                <strong className="num">{formatNumber(segment.value)}</strong>
                <span className="faint">{formatPercent(segment.value / stats.matches)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="stats__block">
          <h3>Rating trend</h3>
          <TrendChart values={stats.ratingHistory} label="Rating" unit="matches ago" />
        </div>

        <div className="stats__block">
          <h3>By game</h3>
          <ul className="by-game">
            {stats.perGame.map((record) => {
              const game = getGame(record.gameId)
              if (!game) return null
              const rate = record.wins / record.played
              return (
                <li key={record.gameId} style={{ '--hue': game.hue } as CSSProperties}>
                  <GameGlyph gameId={game.id} hue={game.hue} size={18} box={34} />
                  <span className="by-game__name">
                    <strong>{game.name}</strong>
                    <span className="faint">{formatNumber(record.played)} played</span>
                  </span>
                  <span
                    className="by-game__bar meter"
                    role="img"
                    aria-label={`${formatPercent(rate)} win rate in ${game.name}`}
                  >
                    <span className="meter__fill" style={{ width: `${rate * 100}%`, background: `hsl(${game.hue} 85% 60%)` }} />
                  </span>
                  <span className="num by-game__rate">{formatPercent(rate)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
