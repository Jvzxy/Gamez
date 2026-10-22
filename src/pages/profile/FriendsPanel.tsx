import { Check, MessageSquare, Swords, UserRoundX, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayerChip } from '../../components/PlayerChip'
import { friendIds, friendRequestIds } from '../../data/players'
import { useChat } from '../../state/chat'
import { usePlayerLookup } from '../../state/user'
import type { Player } from '../../types'

type Tab = 'all' | 'online' | 'requests'

// Friend changes are kept in this component's state only. They reset when you
// leave the page, because there is no backend to save them to.
export function FriendsPanel() {
  const lookup = usePlayerLookup()
  const { dms } = useChat()
  const [tab, setTab] = useState<Tab>('all')
  const [friends, setFriends] = useState(friendIds)
  const [requests, setRequests] = useState(friendRequestIds)

  const toPlayers = (ids: string[]) => ids.map((id) => lookup(id)).filter((player): player is Player => Boolean(player))
  const all = toPlayers(friends)
  const online = all.filter((player) => player.status !== 'offline')
  const pending = toPlayers(requests)

  const list = tab === 'all' ? all : tab === 'online' ? online : pending
  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'all', label: 'All', count: all.length },
    { id: 'online', label: 'Online', count: online.length },
    { id: 'requests', label: 'Requests', count: pending.length },
  ]

  return (
    <section className="panel" aria-labelledby="friends-title">
      <div className="panel__head">
        <h2 className="panel__title" id="friends-title">
          <Users size={18} aria-hidden="true" />
          Friends
        </h2>
      </div>

      <div className="friends-tabs" role="group" aria-label="Friends list view">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className="friends-tab"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className="friends-tab__count">{item.count}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="friends-empty muted">
          {tab === 'requests' ? 'No pending requests.' : tab === 'online' ? 'None of your friends are online right now.' : 'No friends yet.'}
        </p>
      ) : (
        <ul className="panel__body panel__body--flush friends-list">
          {list.map((player) => {
            const dm = dms.find((thread) => thread.playerId === player.id)
            return (
              <li key={player.id} className="friend-row">
                <PlayerChip player={player} size={38} sub={player.activity} showStatus />
                {tab === 'requests' ? (
                  <span className="friend-row__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--icon btn--sm"
                      aria-label={`Accept ${player.displayName}'s friend request`}
                      onClick={() => {
                        setRequests((current) => current.filter((id) => id !== player.id))
                        setFriends((current) => [...current, player.id])
                      }}
                    >
                      <Check size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon btn--sm"
                      aria-label={`Decline ${player.displayName}'s friend request`}
                      onClick={() => setRequests((current) => current.filter((id) => id !== player.id))}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <span className="friend-row__actions">
                    <Link
                      to={dm ? `/chat/${dm.id}` : '/chat'}
                      className="btn btn--ghost btn--icon btn--sm"
                      aria-label={`Message ${player.displayName}`}
                    >
                      <MessageSquare size={16} aria-hidden="true" />
                    </Link>
                    <Link
                      to="/game/pong"
                      className="btn btn--ghost btn--icon btn--sm"
                      aria-label={`Invite ${player.displayName} to Ping Pong`}
                    >
                      <Swords size={16} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon btn--sm"
                      aria-label={`Remove ${player.displayName} from friends`}
                      onClick={() => setFriends((current) => current.filter((id) => id !== player.id))}
                    >
                      <UserRoundX size={16} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
