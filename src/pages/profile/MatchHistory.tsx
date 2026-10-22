import { History, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MatchTable } from '../../components/MatchTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { getGame } from '../../data/games'
import { getMatchHistory } from '../../data/matches'
import type { GameId, MatchResult, Player } from '../../types'

type ResultFilter = 'all' | MatchResult

const resultFilters: Array<{ id: ResultFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'win', label: 'Wins' },
  { id: 'loss', label: 'Losses' },
  { id: 'draw', label: 'Draws' },
]

const pageSize = 8

export function MatchHistory({ player }: { player: Player }) {
  const [result, setResult] = useState<ResultFilter>('all')
  const [gameId, setGameId] = useState<'all' | GameId>('all')
  const [shown, setShown] = useState(pageSize)

  const history = useMemo(() => getMatchHistory(player.id), [player.id])
  const gamesPlayed = useMemo(() => [...new Set(history.map((match) => match.gameId))], [history])

  const filtered = history.filter(
    (match) => (result === 'all' || match.result === result) && (gameId === 'all' || match.gameId === gameId),
  )
  const visible = filtered.slice(0, shown)

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel__head history-head">
        <h2 className="panel__title" id="history-title">
          <History size={18} aria-hidden="true" />
          Match history
        </h2>
        <div className="history-filters">
          <div className="segmented" role="group" aria-label="Filter by result">
            {resultFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className="segmented__btn"
                aria-pressed={result === filter.id}
                onClick={() => {
                  setResult(filter.id)
                  setShown(pageSize)
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="history-game">
            Filter by game
          </label>
          <select
            id="history-game"
            className="select select--sm"
            value={gameId}
            onChange={(event) => {
              setGameId(event.target.value as 'all' | GameId)
              setShown(pageSize)
            }}
          >
            <option value="all">All games</option>
            {gamesPlayed.map((id) => (
              <option key={id} value={id}>
                {getGame(id)?.name ?? id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="panel__body panel__body--flush">
            <MatchTable matches={visible} caption={`${player.displayName}'s match history`} />
          </div>
          {filtered.length > shown ? (
            <div className="history-more">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(filtered.length)}>
                Show {filtered.length - shown} more
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No matches found"
          action={
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setResult('all')
                setGameId('all')
              }}
            >
              Clear filters
            </button>
          }
        >
          Nothing matches these filters. Try a different result or game.
        </EmptyState>
      )}
    </section>
  )
}
