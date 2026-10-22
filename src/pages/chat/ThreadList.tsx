import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { useChat } from '../../state/chat'
import { usePlayerLookup } from '../../state/user'
import type { Channel, ChatMessage } from '../../types'
import { visibilityIcon } from './visibility'

type Filter = 'all' | 'dm' | 'channels'

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'dm', label: 'Direct' },
  { id: 'channels', label: 'Channels' },
]

interface ThreadListProps {
  activeId?: string
  onCreate: () => void
}

export function ThreadList({ activeId, onCreate }: ThreadListProps) {
  const { channels, dms, messages, unread } = useChat()
  const lookup = usePlayerLookup()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()

  const preview = (threadId: string, withAuthor: boolean): { text: string; time: string } => {
    const last: ChatMessage | undefined = messages[threadId]?.at(-1)
    if (!last) return { text: 'No messages yet', time: '' }
    if (last.kind === 'system' || !withAuthor) return { text: last.text, time: last.time }
    const author = last.authorId === 'me' ? 'You' : (lookup(last.authorId)?.displayName.split(' ')[0] ?? 'Someone')
    return { text: `${author}: ${last.text}`, time: last.time }
  }

  const visibleChannels = useMemo(
    () => (filter === 'dm' ? [] : channels.filter((channel) => channel.name.includes(needle))),
    [channels, filter, needle],
  )
  const visibleDms = useMemo(
    () =>
      filter === 'channels'
        ? []
        : dms.filter((thread) => (lookup(thread.playerId)?.displayName ?? '').toLowerCase().includes(needle)),
    [dms, filter, needle, lookup],
  )

  const renderUnread = (id: string) =>
    unread[id] ? (
      <span className="thread__badge" aria-label={`${unread[id]} unread`}>
        {unread[id]}
      </span>
    ) : null

  const renderChannel = (channel: Channel) => {
    const { text, time } = preview(channel.id, true)
    const active = channel.id === activeId
    return (
      <li key={channel.id}>
        <Link to={`/chat/${channel.id}`} className={`thread${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
          <span className="thread__icon">{visibilityIcon(channel.visibility)}</span>
          <span className="thread__text">
            <span className="thread__name truncate">{channel.name}</span>
            <span className="thread__preview truncate">{text}</span>
          </span>
          <span className="thread__meta">
            <span className="thread__time">{time}</span>
            {renderUnread(channel.id)}
          </span>
        </Link>
      </li>
    )
  }

  const empty = visibleChannels.length === 0 && visibleDms.length === 0

  return (
    <aside className="chat__list" aria-label="Conversations">
      <div className="chat__list-head">
        <div className="chat__list-title">
          <h2>Messages</h2>
          <button type="button" className="btn btn--primary btn--sm" onClick={onCreate}>
            <Plus size={16} aria-hidden="true" />
            New channel
          </button>
        </div>
        <label className="search">
          <span className="sr-only">Search conversations</span>
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search conversations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="segmented segmented--fill" role="group" aria-label="Conversation type">
          {filters.map((item) => (
            <button key={item.id} type="button" className="segmented__btn" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat__list-scroll">
        {visibleChannels.length > 0 ? (
          <>
            <h3 className="chat__section">Channels</h3>
            <ul>{visibleChannels.map(renderChannel)}</ul>
          </>
        ) : null}

        {visibleDms.length > 0 ? (
          <>
            <h3 className="chat__section">Direct messages</h3>
            <ul>
              {visibleDms.map((thread) => {
                const player = lookup(thread.playerId)
                if (!player) return null
                const { text, time } = preview(thread.id, false)
                const active = thread.id === activeId
                return (
                  <li key={thread.id}>
                    <Link to={`/chat/${thread.id}`} className={`thread${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                      <Avatar name={player.displayName} seed={player.id} size={36} status={player.status} ring="var(--panel)" />
                      <span className="thread__text">
                        <span className="thread__name truncate">{player.displayName}</span>
                        <span className="thread__preview truncate">{text}</span>
                      </span>
                      <span className="thread__meta">
                        <span className="thread__time">{time}</span>
                        {renderUnread(thread.id)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}

        {empty ? <p className="chat__none muted">No conversations match &ldquo;{query}&rdquo;.</p> : null}
      </div>
    </aside>
  )
}
