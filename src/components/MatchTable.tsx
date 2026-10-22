import { getGame } from '../data/games'
import { signed, timeAgo } from '../lib/format'
import { usePlayerLookup } from '../state/user'
import type { MatchResult, PlayedMatch, Player } from '../types'
import { PlayerChip } from './PlayerChip'
import { AvatarStack } from './ui/Avatar'
import { GameGlyph } from './ui/GameIcon'

const resultText: Record<MatchResult, { letter: string; word: string }> = {
  win: { letter: 'W', word: 'Win' },
  loss: { letter: 'L', word: 'Loss' },
  draw: { letter: 'D', word: 'Draw' },
}

function deltaClass(value: number): string {
  if (value > 0) return 'delta delta--up'
  if (value < 0) return 'delta delta--down'
  return 'delta delta--flat'
}

interface MatchTableProps {
  matches: PlayedMatch[]
  caption: string
}

export function MatchTable({ matches, caption }: MatchTableProps) {
  const lookup = usePlayerLookup()

  return (
    <div className="table-wrap">
      <table className="table match-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Result</th>
            <th scope="col">Game</th>
            <th scope="col">Opponent</th>
            <th scope="col">Score</th>
            <th scope="col" className="is-right">
              Rating
            </th>
            <th scope="col" className="col-mode">
              Mode
            </th>
            <th scope="col" className="is-right">
              Played
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const game = getGame(match.gameId)
            const opponents = match.opponentIds
              .map((id) => lookup(id))
              .filter((player): player is Player => Boolean(player))
            const text = resultText[match.result]
            return (
              <tr key={match.id}>
                <td>
                  <span className={`result result--${match.result}`}>
                    <span aria-hidden="true">{text.letter}</span>
                    <span className="sr-only">{text.word}</span>
                  </span>
                </td>
                <td>
                  <span className="match-table__game">
                    {game ? <GameGlyph gameId={game.id} hue={game.hue} size={16} box={28} /> : null}
                    <span className="truncate">{game?.name ?? match.gameId}</span>
                  </span>
                </td>
                <td>
                  {opponents.length === 1 ? (
                    <PlayerChip player={opponents[0]} size={28} />
                  ) : (
                    <span className="match-table__group">
                      <AvatarStack
                        people={opponents.slice(0, 3).map((p) => ({ id: p.id, name: p.displayName }))}
                        size={28}
                      />
                      <span className="truncate">
                        {opponents[0]?.displayName.split(' ')[0]} and {opponents.length - 1} others
                      </span>
                    </span>
                  )}
                </td>
                <td>{match.score}</td>
                <td className="is-right">
                  <span className={deltaClass(match.ratingDelta)}>{signed(match.ratingDelta)}</span>
                </td>
                <td className="col-mode faint">{match.mode}</td>
                <td className="is-right faint">{timeAgo(match.minutesAgo)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
