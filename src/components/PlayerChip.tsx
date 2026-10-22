import { Link } from 'react-router-dom'
import { currentUserId } from '../data/players'
import type { Player } from '../types'
import { Avatar } from './ui/Avatar'

interface PlayerChipProps {
  player: Player
  size?: number
  /** Second line under the name. */
  sub?: string
  showStatus?: boolean
  ring?: string
}

export function profilePath(player: Player): string {
  return player.id === currentUserId ? '/profile' : `/profile/${player.username}`
}

/** Avatar plus name, linking to the player's profile. */
export function PlayerChip({ player, size = 36, sub, showStatus, ring }: PlayerChipProps) {
  return (
    <Link to={profilePath(player)} className="player-chip">
      <Avatar
        name={player.displayName}
        seed={player.id}
        size={size}
        status={showStatus ? player.status : undefined}
        ring={ring}
      />
      <span className="player-chip__text">
        <span className="player-chip__name truncate">{player.displayName}</span>
        {sub ? <span className="player-chip__sub truncate">{sub}</span> : null}
      </span>
    </Link>
  )
}
