import { Settings, Swords, User, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlayerChip } from '../../components/PlayerChip'
import { Avatar } from '../../components/ui/Avatar'
import { rankOf } from '../../data/players'
import { formatNumber, formatPercent, presenceLabel } from '../../lib/format'
import { canOpenRoomSettings } from '../../lib/permissions'
import { usePlayerLookup } from '../../state/user'
import type { Channel, DirectThread, MemberRole, Player } from '../../types'
import { visibilityLabel } from './visibility'

function ChannelInfo({ channel }: { channel: Channel }) {
  const lookup = usePlayerLookup()
  const myRole = channel.members.find((member) => member.playerId === 'me')?.role ?? 'member'
  const visibility = visibilityLabel(channel.visibility)

  const groups: Array<{ role: MemberRole; title: string }> = [
    { role: 'owner', title: 'Owner' },
    { role: 'admin', title: 'Admins' },
    { role: 'member', title: 'Members' },
  ]

  return (
    <>
      <section className="info-block">
        <h2>About</h2>
        <p>{channel.topic || 'No topic set.'}</p>
        <p className="info-line muted">
          {visibility.icon}
          {visibility.text}
        </p>
        <p className="faint info-small">{channel.createdLabel}</p>
        {canOpenRoomSettings(myRole) ? (
          <Link to={`/chat/${channel.id}/settings`} className="btn btn--secondary btn--sm info-btn">
            <Settings size={15} aria-hidden="true" />
            Room settings
          </Link>
        ) : null}
      </section>

      {groups.map((group) => {
        const members = channel.members.filter((member) => member.role === group.role)
        if (members.length === 0) return null
        return (
          <section key={group.role} className="info-block">
            <h2>
              {group.title} <span className="faint">{members.length}</span>
            </h2>
            <ul className="info-members">
              {members.map((member) => {
                const player = lookup(member.playerId)
                if (!player) return null
                return (
                  <li key={member.playerId}>
                    <PlayerChip player={player} size={32} showStatus sub={player.status === 'in-game' || player.status === 'offline' ? player.activity : undefined} />
                    {member.mutedFor ? (
                      <span className="badge" title={`Muted for ${member.mutedFor}`}>
                        <VolumeX size={12} aria-hidden="true" />
                        Muted
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}

function PlayerInfo({ player }: { player: Player }) {
  const winRate = player.stats.wins / player.stats.matches
  return (
    <>
      <section className="info-block info-player">
        <Avatar name={player.displayName} seed={player.id} size={72} status={player.status} ring="var(--panel)" />
        <div>
          <h2 className="info-player__name">{player.displayName}</h2>
          <p className="muted">@{player.username}</p>
          <p className="faint info-small">{player.status === 'online' || player.status === 'away' ? presenceLabel(player.status) : player.activity}</p>
        </div>
        <p className="info-bio muted">{player.bio}</p>
        <dl className="info-stats">
          <div>
            <dt>Rating</dt>
            <dd className="num">{formatNumber(player.rating)}</dd>
          </div>
          <div>
            <dt>Rank</dt>
            <dd className="num">#{rankOf(player.id)}</dd>
          </div>
          <div>
            <dt>Win rate</dt>
            <dd className="num">{formatPercent(winRate)}</dd>
          </div>
        </dl>
        <div className="info-actions">
          <Link to="/games" className="btn btn--primary btn--sm">
            <Swords size={15} aria-hidden="true" />
            Play a game
          </Link>
          <Link to={`/profile/${player.username}`} className="btn btn--ghost btn--sm">
            <User size={15} aria-hidden="true" />
            Profile
          </Link>
        </div>
      </section>
    </>
  )
}

export function InfoPanel({ thread }: { thread: Channel | DirectThread }) {
  const lookup = usePlayerLookup()
  const peer = thread.kind === 'dm' ? lookup(thread.playerId) : undefined

  return (
    <aside className="chat__info" aria-label={thread.kind === 'channel' ? 'Channel details' : 'Player details'}>
      {thread.kind === 'channel' ? <ChannelInfo channel={thread} /> : peer ? <PlayerInfo player={peer} /> : null}
      <p className="info-note faint">Sample data. Presence and membership are not live.</p>
    </aside>
  )
}
