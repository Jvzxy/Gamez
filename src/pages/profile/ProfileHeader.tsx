import { MessageSquare, Pencil, Swords } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { rankOf } from '../../data/players'
import { formatNumber, hueFor, presenceLabel } from '../../lib/format'
import { useChat } from '../../state/chat'
import type { Player } from '../../types'

interface ProfileHeaderProps {
  player: Player
  isSelf: boolean
}

export function ProfileHeader({ player, isSelf }: ProfileHeaderProps) {
  const { dms } = useChat()
  const dm = dms.find((thread) => thread.playerId === player.id)
  const xpPercent = Math.round((player.xp / player.xpToNext) * 100)
  const cover = { '--hue': hueFor(player.id) } as CSSProperties

  return (
    <header className="profile-head">
      <div className="profile-head__cover" style={cover} aria-hidden="true" />

      <div className="profile-head__main">
        <div className="profile-head__avatar">
          <Avatar name={player.displayName} seed={player.id} size={104} status={player.status} ring="var(--panel)" />
        </div>

        <div className="profile-head__id">
          <h1>{player.displayName}</h1>
          <p className="muted">@{player.username}</p>
          <p className="profile-head__bio">{player.bio}</p>
        </div>

        <div className="profile-head__actions">
          {isSelf ? (
            <Link to="/settings/account" className="btn btn--ghost">
              <Pencil size={16} aria-hidden="true" />
              Edit profile
            </Link>
          ) : (
            <>
              <Link to={dm ? `/chat/${dm.id}` : '/chat'} className="btn btn--ghost">
                <MessageSquare size={16} aria-hidden="true" />
                Message
              </Link>
              <Link to="/game/pong" className="btn btn--primary">
                <Swords size={16} aria-hidden="true" />
                Challenge to Ping Pong
              </Link>
            </>
          )}
        </div>
      </div>

      <dl className="profile-facts">
        <div className="profile-facts__item profile-facts__item--level">
          <dt>Level {player.level}</dt>
          <dd>
            <div
              className="meter"
              role="progressbar"
              aria-label={`Level ${player.level} progress`}
              aria-valuemin={0}
              aria-valuemax={player.xpToNext}
              aria-valuenow={player.xp}
            >
              <div className="meter__fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="faint">
              {formatNumber(player.xp)} of {formatNumber(player.xpToNext)} XP to level {player.level + 1}
            </span>
          </dd>
        </div>
        <div className="profile-facts__item">
          <dt>Global rank</dt>
          <dd className="num">#{rankOf(player.id)}</dd>
        </div>
        <div className="profile-facts__item">
          <dt>Member since</dt>
          <dd>{player.joinedLabel}</dd>
        </div>
        <div className="profile-facts__item">
          <dt>Status</dt>
          <dd>{player.status === 'online' || player.status === 'away' ? presenceLabel(player.status) : player.activity}</dd>
        </div>
      </dl>
    </header>
  )
}
