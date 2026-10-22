import { Ban, Search, ShieldCheck, ShieldOff, UserMinus, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { PlayerChip } from '../../components/PlayerChip'
import { Modal } from '../../components/ui/Modal'
import { canChangeRole, canModerate, roleLabel } from '../../lib/permissions'
import { useChat } from '../../state/chat'
import { usePlayerLookup } from '../../state/user'
import type { Channel, MemberRole } from '../../types'

const roleOrder: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 }
const muteChoices = ['10 minutes', '1 hour', '1 day']

interface Pending {
  playerId: string
  mode: 'kick' | 'ban'
}

export function MembersPanel({ channel, myRole }: { channel: Channel; myRole: MemberRole }) {
  const { setMemberRole, muteMember, removeMember, unbanMember } = useChat()
  const lookup = usePlayerLookup()
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)

  const needle = query.trim().toLowerCase()
  const members = [...channel.members]
    .sort((a, b) => roleOrder[a.role] - roleOrder[b.role])
    .filter((member) => {
      if (!needle) return true
      const player = lookup(member.playerId)
      return Boolean(player && `${player.displayName} ${player.username}`.toLowerCase().includes(needle))
    })

  const pendingPlayer = pending ? lookup(pending.playerId) : undefined

  const confirm = () => {
    if (!pending) return
    removeMember(channel.id, pending.playerId, pending.mode)
    setPending(null)
  }

  return (
    <section className="panel" aria-labelledby="members-title">
      <div className="panel__head">
        <h2 className="panel__title" id="members-title">
          Members
        </h2>
        <span className="badge">{channel.members.length}</span>
      </div>

      <div className="panel__body members__tools">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search members</span>
          <input className="input" type="search" placeholder="Search members" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {members.length > 0 ? (
        <ul className="members">
          {members.map((member) => {
            const player = lookup(member.playerId)
            if (!player) return null
            const isMe = member.playerId === 'me'
            const moderate = !isMe && canModerate(myRole, member.role)
            const roles = !isMe && canChangeRole(myRole, member.role)
            return (
              <li key={member.playerId} className="members__row">
                <PlayerChip player={player} size={38} showStatus sub={isMe ? 'You' : undefined} />
                <span className="members__badges">
                  <span className={`badge${member.role === 'owner' ? ' badge--gold' : member.role === 'admin' ? ' badge--p2' : ''}`}>{roleLabel(member.role)}</span>
                  {member.mutedFor ? (
                    <span className="badge">
                      <VolumeX size={12} aria-hidden="true" />
                      Muted {member.mutedFor}
                    </span>
                  ) : null}
                </span>
                <span className="members__actions">
                  {roles ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setMemberRole(channel.id, member.playerId, member.role === 'admin' ? 'member' : 'admin')}
                    >
                      {member.role === 'admin' ? <ShieldOff size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                      {member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    </button>
                  ) : null}
                  {moderate ? (
                    <>
                      {member.mutedFor ? (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => muteMember(channel.id, member.playerId, undefined)}>
                          <Volume2 size={15} aria-hidden="true" />
                          Unmute
                        </button>
                      ) : (
                        <select
                          className="select select--sm select--auto"
                          aria-label={`Mute ${player.displayName}`}
                          value=""
                          onChange={(event) => event.target.value && muteMember(channel.id, member.playerId, event.target.value)}
                        >
                          <option value="">Mute…</option>
                          {muteChoices.map((choice) => (
                            <option key={choice} value={choice}>
                              {choice}
                            </option>
                          ))}
                        </select>
                      )}
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPending({ playerId: member.playerId, mode: 'kick' })}>
                        <UserMinus size={15} aria-hidden="true" />
                        Remove
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm members__ban" onClick={() => setPending({ playerId: member.playerId, mode: 'ban' })}>
                        <Ban size={15} aria-hidden="true" />
                        Ban
                      </button>
                    </>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="panel__body muted">No members match &ldquo;{query}&rdquo;.</p>
      )}

      <div className="panel__head members__banned-head">
        <h3 className="panel__title">Banned</h3>
        <span className="badge">{channel.bannedIds.length}</span>
      </div>
      {channel.bannedIds.length > 0 ? (
        <ul className="members">
          {channel.bannedIds.map((id) => {
            const player = lookup(id)
            if (!player) return null
            return (
              <li key={id} className="members__row">
                <PlayerChip player={player} size={34} />
                <span className="members__badges" />
                <span className="members__actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => unbanMember(channel.id, id)}>
                    Unban
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="panel__body muted">Nobody is banned.</p>
      )}

      <Modal open={pending !== null} onClose={() => setPending(null)} label={pending?.mode === 'ban' ? 'Ban member' : 'Remove member'} size="sm">
        <div className="resign">
          <h2>{pending?.mode === 'ban' ? `Ban ${pendingPlayer?.displayName ?? 'this member'}?` : `Remove ${pendingPlayer?.displayName ?? 'this member'}?`}</h2>
          <p className="muted">
            {pending?.mode === 'ban'
              ? 'They are removed from the channel and can’t rejoin until you unban them.'
              : 'They are removed from the channel but can join again if it allows.'}
          </p>
          <div className="resign__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={confirm}>
              {pending?.mode === 'ban' ? 'Ban' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
