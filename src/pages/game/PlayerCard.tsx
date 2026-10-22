import { Link } from 'react-router-dom'
import { profilePath } from '../../components/PlayerChip'
import { Avatar } from '../../components/ui/Avatar'
import { difficultyLabel, isSynthetic } from '../../games/players'
import type { Seat } from '../../games/types'
import { formatNumber, formatPercent, presenceLabel } from '../../lib/format'
import type { Player } from '../../types'

interface PlayerCardProps {
  player: Player
  isMe: boolean
  /** Which side of the board or court this player is on. Drives the accent colour. */
  side?: 'left' | 'right'
  align?: 'start' | 'end'
  /** The seat this card describes: adds the role label and whether it is a bot. */
  seat?: Seat
  /** True while it is this seat's turn. */
  active?: boolean
}

export function PlayerCard({ player, isMe, side, align = 'start', seat, active }: PlayerCardProps) {
  const synthetic = isSynthetic(player)
  const botOnSample = seat?.kind === 'bot' && !synthetic
  const winRate = player.stats.matches > 0 ? player.stats.wins / player.stats.matches : 0

  let tag: string | null = null
  if (seat?.kind === 'bot') tag = botOnSample ? 'Bot plays this seat' : `Computer, ${difficultyLabel(seat.difficulty).toLowerCase()}`
  else if (synthetic) tag = 'Guest on this device'

  return (
    <article
      className={`pcard${side ? ` pcard--${side}` : ''}${align === 'end' ? ' pcard--end' : ''}${active ? ' is-active' : ''}`}
      aria-label={`Player ${player.displayName}${active ? ', to move' : ''}`}
    >
      <Avatar name={player.displayName} seed={player.id} size={56} status={synthetic ? undefined : player.status} ring="var(--panel)" />
      <div className="pcard__text">
        <p className="pcard__name">
          {synthetic ? (
            <span className="truncate">{player.displayName}</span>
          ) : (
            <Link to={profilePath(player)} className="truncate">
              {player.displayName}
            </Link>
          )}
          {isMe ? <span className="badge badge--p1">You</span> : null}
        </p>
        <p className="pcard__handle truncate">
          {seat ? <strong className="pcard__role">{seat.label}</strong> : null}
          {seat ? ', ' : null}
          {synthetic ? tag : `@${player.username}, level ${player.level}`}
        </p>
        {synthetic ? (
          <p className="pcard__stats faint">Not rated. Practice games don&rsquo;t change anyone&rsquo;s rating.</p>
        ) : (
          <dl className="pcard__stats">
            <div>
              <dt>Rating</dt>
              <dd className="num">{formatNumber(player.rating)}</dd>
            </div>
            <div>
              <dt>Win rate</dt>
              <dd className="num">{formatPercent(winRate)}</dd>
            </div>
            <div>
              <dt>{botOnSample ? 'Controlled by' : 'Status'}</dt>
              <dd>{botOnSample ? 'Bot' : presenceLabel(player.status)}</dd>
            </div>
          </dl>
        )}
      </div>
    </article>
  )
}
