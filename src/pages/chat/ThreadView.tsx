import { ArrowLeft, Info, Send, Settings, Swords, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { canOpenRoomSettings } from '../../lib/permissions'
import { useChat } from '../../state/chat'
import { usePlayerLookup } from '../../state/user'
import type { Channel, DirectThread } from '../../types'
import { visibilityIcon } from './visibility'

interface ThreadViewProps {
  thread: Channel | DirectThread
  showInfo: boolean
  onToggleInfo: () => void
}

export function ThreadView({ thread, showInfo, onToggleInfo }: ThreadViewProps) {
  const { messages, sendMessage } = useChat()
  const lookup = usePlayerLookup()
  const list = messages[thread.id] ?? []

  const [draft, setDraft] = useState('')
  const [wait, setWait] = useState(0)
  const scroller = useRef<HTMLOListElement>(null)

  const channel = thread.kind === 'channel' ? thread : undefined
  const peer = thread.kind === 'dm' ? lookup(thread.playerId) : undefined
  const myMember = channel?.members.find((member) => member.playerId === 'me')
  const myRole = myMember?.role ?? 'member'
  const isStaff = myRole !== 'member'

  // Why the composer is locked, if it is.
  let lockedReason = ''
  if (channel && myMember?.mutedFor) lockedReason = `You are muted in this channel for ${myMember.mutedFor}.`
  else if (channel && !channel.permissions.membersCanSend && !isStaff) lockedReason = 'Only the owner and admins can send messages in this channel.'

  const slowMode = channel && !isStaff ? channel.permissions.slowModeSeconds : 0

  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollTop = element.scrollHeight
  }, [list.length, thread.id])

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const send = () => {
    if (!draft.trim() || lockedReason || wait > 0) return
    sendMessage(thread.id, draft)
    setDraft('')
    if (slowMode > 0) setWait(slowMode)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send()
  }

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const title = channel ? channel.name : (peer?.displayName ?? 'Conversation')
  const placeholder = channel ? `Message #${channel.name}` : `Message ${peer?.displayName.split(' ')[0] ?? ''}`

  return (
    <>
      <header className="chat-head">
        <Link to="/chat" className="btn btn--ghost btn--icon btn--sm chat-head__back" aria-label="Back to conversations">
          <ArrowLeft size={17} aria-hidden="true" />
        </Link>

        {channel ? (
          <span className="thread__icon thread__icon--lg">{visibilityIcon(channel.visibility, 20)}</span>
        ) : peer ? (
          <Avatar name={peer.displayName} seed={peer.id} size={40} status={peer.status} ring="var(--panel)" />
        ) : null}

        <div className="chat-head__text">
          <h1 className="chat-head__title truncate">{title}</h1>
          <p className="chat-head__sub truncate">{channel ? channel.topic || 'No topic set.' : peer?.activity}</p>
        </div>

        <div className="chat-head__actions">
          {peer ? (
            <>
              <Link to="/game/pong" className="btn btn--secondary btn--sm">
                <Swords size={15} aria-hidden="true" />
                Challenge
              </Link>
              <Link to={`/profile/${peer.username}`} className="btn btn--ghost btn--icon btn--sm" aria-label={`View ${peer.displayName}'s profile`}>
                <User size={16} aria-hidden="true" />
              </Link>
            </>
          ) : null}
          {channel && canOpenRoomSettings(myRole) ? (
            <Link to={`/chat/${channel.id}/settings`} className="btn btn--ghost btn--sm">
              <Settings size={15} aria-hidden="true" />
              Room settings
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            aria-pressed={showInfo}
            aria-label={channel ? 'Toggle channel details' : 'Toggle player details'}
            onClick={onToggleInfo}
          >
            <Info size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <ol className="msgs" ref={scroller} role="log" aria-label={`Messages in ${title}`}>
        {list.length === 0 ? (
          <li className="msgs__empty muted">No messages yet. Say hello to start the conversation.</li>
        ) : null}
        {list.map((message, index) => {
          if (message.kind === 'system') {
            return (
              <li key={message.id} className="msg-system">
                {message.text}
              </li>
            )
          }
          const previous = list[index - 1]
          const grouped = previous?.kind === 'message' && previous.authorId === message.authorId
          const author = lookup(message.authorId)
          const isMe = message.authorId === 'me'
          return (
            <li key={message.id} className={`msg${grouped ? ' msg--grouped' : ''}`}>
              {grouped ? (
                <time className="msg__hover-time">{message.time.replace(/ (AM|PM)$/, '')}</time>
              ) : (
                <Avatar name={author?.displayName ?? '?'} seed={message.authorId} size={36} />
              )}
              <div className="msg__body">
                {grouped ? null : (
                  <p className="msg__meta">
                    <span className={`msg__author${isMe ? ' is-me' : ''}`}>{isMe ? 'You' : (author?.displayName ?? 'Unknown')}</span>
                    <time>{message.time}</time>
                  </p>
                )}
                <p className="msg__text">{message.text}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <form className="composer" onSubmit={submit}>
        {lockedReason ? (
          <p className="composer__locked">{lockedReason}</p>
        ) : (
          <>
            <label className="sr-only" htmlFor="composer-input">
              {placeholder}
            </label>
            <div className="composer__box">
              <textarea
                id="composer-input"
                className="textarea composer__input"
                rows={1}
                placeholder={placeholder}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={keyDown}
              />
              <button type="submit" className="btn btn--primary" disabled={!draft.trim() || wait > 0}>
                <Send size={16} aria-hidden="true" />
                Send
              </button>
            </div>
            <p className="composer__hint faint">
              {wait > 0 ? `Slow mode is on. You can send again in ${wait}s.` : 'Enter to send, Shift and Enter for a new line. Messages stay in this browser tab only.'}
            </p>
          </>
        )}
      </form>
    </>
  )
}
