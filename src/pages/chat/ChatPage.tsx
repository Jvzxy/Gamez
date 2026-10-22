import { MessageSquareOff, MessagesSquare, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocumentTitle } from '../../lib/hooks'
import { useChat } from '../../state/chat'
import { CreateChannelModal } from './CreateChannelModal'
import { InfoPanel } from './InfoPanel'
import { ThreadList } from './ThreadList'
import { ThreadView } from './ThreadView'
import './chat.css'

export function ChatPage() {
  useDocumentTitle('Chat')
  const { threadId } = useParams()
  const navigate = useNavigate()
  const { channels, dms, markRead } = useChat()

  const [createOpen, setCreateOpen] = useState(false)
  // Three columns need room. On narrower screens the details panel starts closed.
  const [showInfo, setShowInfo] = useState(() => window.matchMedia('(min-width: 1360px)').matches)

  const thread = threadId ? (channels.find((channel) => channel.id === threadId) ?? dms.find((dm) => dm.id === threadId)) : undefined
  const activeId = thread?.id

  useEffect(() => {
    if (activeId) markRead(activeId)
  }, [activeId, markRead])

  const open = Boolean(threadId)

  return (
    <div className="chat-page">
      <div className={`chat${open ? ' chat--open' : ''}${thread && showInfo ? ' chat--info' : ''}`}>
        <ThreadList activeId={activeId} onCreate={() => setCreateOpen(true)} />

        <section className="chat__main" aria-label="Conversation">
          {thread ? (
            <ThreadView key={thread.id} thread={thread} showInfo={showInfo} onToggleInfo={() => setShowInfo((value) => !value)} />
          ) : threadId ? (
            <EmptyState
              icon={MessageSquareOff}
              title="This conversation isn't available"
              action={
                <Link to="/chat" className="btn btn--primary">
                  Back to conversations
                </Link>
              }
            >
              It may have been deleted, or the link is wrong.
            </EmptyState>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Pick a conversation"
              action={
                <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={16} aria-hidden="true" />
                  New channel
                </button>
              }
            >
              Choose a channel or a direct message on the left, or start a new channel for your group.
            </EmptyState>
          )}
        </section>

        {thread && showInfo ? <InfoPanel thread={thread} /> : null}
      </div>

      <CreateChannelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false)
          navigate(`/chat/${id}`)
        }}
      />
    </div>
  )
}
