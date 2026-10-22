import { Eye, Radio } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarStack } from '../../components/ui/Avatar'
import { GameGlyph } from '../../components/ui/GameIcon'
import { getGame } from '../../data/games'
import { liveMatches } from '../../data/matches'
import { usePlayerLookup } from '../../state/user'
import type { LiveMatch, Player } from '../../types'

function LiveRow({ match }: { match: LiveMatch }) {
  const lookup = usePlayerLookup()
  const game = getGame(match.gameId)
  if (!game) return null

  const players = match.playerIds.map((id) => lookup(id)).filter((player): player is Player => Boolean(player))
  const isDuel = match.playerCount === 2 && players.length === 2
  const playable = game.status === 'playable'
  const label = !playable
    ? `${game.name} is planned and not playable yet. Open its plan.`
    : isDuel
      ? `Watch a simulated ${game.name} match between ${players[0].displayName} and ${players[1].displayName}`
      : `Watch ${game.name} with ${match.playerCount} players`

  return (
    <li>
      <Link
        to={`/game/${match.gameId}/${match.id}`}
        className="live-row"
        style={{ '--hue': game.hue } as CSSProperties}
        aria-label={label}
      >
        <GameGlyph gameId={game.id} hue={game.hue} size={20} box={40} />

        <span className="live-row__main">
          {isDuel ? (
            <span className="live-row__duel">
              <span className="live-row__player">
                <Avatar name={players[0].displayName} seed={players[0].id} size={26} />
                <span className="truncate">{players[0].displayName.split(' ')[0]}</span>
              </span>
              <span className="live-row__score num">{match.headline}</span>
              <span className="live-row__player live-row__player--right">
                <span className="truncate">{players[1].displayName.split(' ')[0]}</span>
                <Avatar name={players[1].displayName} seed={players[1].id} size={26} />
              </span>
            </span>
          ) : (
            <span className="live-row__duel">
              <AvatarStack
                people={players.map((player) => ({ id: player.id, name: player.displayName }))}
                total={match.playerCount}
                size={26}
              />
              <span className="live-row__score num">{match.headline}</span>
            </span>
          )}
          <span className="live-row__detail truncate">
            {game.name}, {match.detail}
          </span>
        </span>

        <span className="live-row__side">
          <span className="live-row__viewers">
            <Eye size={15} aria-hidden="true" />
            {match.spectators}
            <span className="sr-only"> watching</span>
          </span>
          <span className="btn btn--secondary btn--sm" aria-hidden="true">
            {playable ? 'Watch' : 'Plan'}
          </span>
        </span>
      </Link>
    </li>
  )
}

export function LiveMatches() {
  const sorted = [...liveMatches].sort((a, b) => b.spectators - a.spectators)

  return (
    <section className="panel" aria-labelledby="live-title">
      <div className="panel__head">
        <h2 className="panel__title" id="live-title">
          <Radio size={18} aria-hidden="true" />
          Live matches
        </h2>
        <span className="badge">Sample data</span>
      </div>
      <ul className="panel__body panel__body--flush live-list">
        {sorted.map((match) => (
          <LiveRow key={match.id} match={match} />
        ))}
      </ul>
    </section>
  )
}
