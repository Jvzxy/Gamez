import { ArrowLeft, Lock, SearchX, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useDocumentTitle } from '../../lib/hooks'
import { canEditCore, canOpenRoomSettings, roleLabel } from '../../lib/permissions'
import { useChat } from '../../state/chat'
import { GeneralPanel } from './GeneralPanel'
import { MembersPanel } from './MembersPanel'
import { PermissionsPanel } from './PermissionsPanel'
import './room.css'

export function RoomSettingsPage() {
  const { threadId } = useParams()
  const { channels, deleteChannel } = useChat()
  const navigate = useNavigate()
  const channel = channels.find((candidate) => candidate.id === threadId)
  const myRole = channel?.members.find((member) => member.playerId === 'me')?.role

  const [deleting, setDeleting] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  useDocumentTitle(channel ? `#${channel.name} settings` : 'Room settings')

  if (!channel) {
    return (
      <div className="page">
        <div className="panel">
          <EmptyState
            icon={SearchX}
            title="Channel not found"
            action={
              <Link to="/chat" className="btn btn--primary">
                Back to chat
              </Link>
            }
          >
            It may have been deleted, or the link is wrong.
          </EmptyState>
        </div>
      </div>
    )
  }

  if (!myRole || !canOpenRoomSettings(myRole)) {
    return (
      <div className="page">
        <div className="panel">
          <EmptyState
            icon={Lock}
            title="Room settings are for owners and admins"
            action={
              <Link to={`/chat/${channel.id}`} className="btn btn--primary">
                Back to #{channel.name}
              </Link>
            }
          >
            Ask the channel owner if you need something changed.
          </EmptyState>
        </div>
      </div>
    )
  }

  const remove = () => {
    // Leave the page first: once the channel is gone this route has nothing to show.
    navigate('/chat')
    deleteChannel(channel.id)
  }

  return (
    <div className="page room">
      <div className="page-head">
        <div className="room__title">
          <Link to={`/chat/${channel.id}`} className="btn btn--ghost btn--icon btn--sm" aria-label={`Back to #${channel.name}`}>
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <div>
            <h1>Room settings</h1>
            <p className="page-head__sub">
              #{channel.name}, your role: {roleLabel(myRole)}
            </p>
          </div>
        </div>
      </div>

      <div className="room__stack">
        <GeneralPanel channel={channel} myRole={myRole} />
        <PermissionsPanel channel={channel} myRole={myRole} />
        <MembersPanel channel={channel} myRole={myRole} />

        {canEditCore(myRole) ? (
          <section className="panel room__danger" aria-labelledby="danger-title">
            <div className="panel__head">
              <h2 className="panel__title" id="danger-title">
                Delete channel
              </h2>
            </div>
            <div className="panel__body room__danger-body">
              <p className="muted">Deleting removes the channel and its messages for everyone. This can&rsquo;t be undone.</p>
              <button type="button" className="btn btn--danger" onClick={() => setDeleting(true)}>
                <Trash2 size={16} aria-hidden="true" />
                Delete #{channel.name}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <Modal open={deleting} onClose={() => setDeleting(false)} label="Delete channel" size="sm">
        <div className="resign">
          <h2>Delete #{channel.name}?</h2>
          <p className="muted">Type the channel name to confirm.</p>
          <input className="input" aria-label="Channel name" autoComplete="off" value={confirmName} onChange={(event) => setConfirmName(event.target.value)} placeholder={channel.name} />
          <div className="resign__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setDeleting(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" disabled={confirmName !== channel.name} onClick={remove}>
              Delete channel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
