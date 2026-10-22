import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { friendIds } from '../../data/players'
import { channelSlug } from '../../lib/format'
import { useChat } from '../../state/chat'
import { usePlayerLookup } from '../../state/user'
import type { ChannelVisibility, Player } from '../../types'
import { visibilityOptions } from './visibility'

const topicLimit = 120

interface FormProps {
  onClose: () => void
  onCreated: (channelId: string) => void
}

function CreateChannelForm({ onClose, onCreated }: FormProps) {
  const { channels, createChannel } = useChat()
  const lookup = usePlayerLookup()

  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [visibility, setVisibility] = useState<ChannelVisibility>('public')
  const [password, setPassword] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const friends = friendIds.map((id) => lookup(id)).filter((player): player is Player => Boolean(player))

  let nameError = ''
  if (name.length < 3) nameError = 'Use at least 3 characters.'
  else if (name.startsWith('-') || name.endsWith('-')) nameError = 'A name cannot start or end with a hyphen.'
  else if (channels.some((channel) => channel.name === name)) nameError = 'A channel with this name already exists.'

  const passwordError = visibility === 'protected' && password.length < 6 ? 'Use at least 6 characters.' : ''

  const toggleInvite = (id: string) =>
    setInvited((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (nameError || passwordError) return
    const id = createChannel({
      name,
      topic: topic.trim(),
      visibility,
      // The password is checked here and then dropped. A backend would store a hash of it.
      hasPassword: visibility === 'protected',
      inviteIds: invited,
    })
    onCreated(id)
  }

  return (
    <form className="modal__form" onSubmit={submit} noValidate>
      <div className="modal__head">
        <div>
          <h2>Create a channel</h2>
          <p>Channels are group chats around a topic, like a game night or a ladder.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Close">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="modal__body">
        <div className="field">
          <label className="field__label" htmlFor="channel-name">
            Channel name
          </label>
          <input
            id="channel-name"
            className="input"
            value={name}
            autoFocus
            autoComplete="off"
            placeholder="chess-club"
            maxLength={24}
            aria-invalid={submitted && nameError ? true : undefined}
            aria-describedby="channel-name-help"
            onChange={(event) => setName(channelSlug(event.target.value))}
          />
          {submitted && nameError ? (
            <p className="field__error" id="channel-name-help">
              {nameError}
            </p>
          ) : (
            <p className="field__hint" id="channel-name-help">
              Lowercase letters, numbers and hyphens. Spaces turn into hyphens.
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="channel-topic">
            Topic <span className="faint">(optional)</span>
          </label>
          <textarea
            id="channel-topic"
            className="textarea"
            rows={2}
            maxLength={topicLimit}
            placeholder="What is this channel for?"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <p className="field__hint">
            {topic.length} of {topicLimit} characters
          </p>
        </div>

        <fieldset className="radio-cards">
          <legend className="field__label">Who can join</legend>
          {visibilityOptions.map((option) => (
            <label key={option.id} className="radio-card">
              <input
                type="radio"
                name="visibility"
                value={option.id}
                checked={visibility === option.id}
                onChange={() => setVisibility(option.id)}
              />
              <option.icon size={20} aria-hidden="true" />
              <span className="radio-card__text">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {visibility === 'protected' ? (
          <div className="field">
            <label className="field__label" htmlFor="channel-password">
              Channel password
            </label>
            <input
              id="channel-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={submitted && passwordError ? true : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            {submitted && passwordError ? (
              <p className="field__error">{passwordError}</p>
            ) : (
              <p className="field__hint">Share it with the people you want to let in.</p>
            )}
          </div>
        ) : null}

        <fieldset className="radio-cards">
          <legend className="field__label">
            Add friends <span className="faint">(optional)</span>
          </legend>
          <div className="chip-grid">
            {friends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                className="chip"
                aria-pressed={invited.includes(friend.id)}
                onClick={() => toggleInvite(friend.id)}
              >
                <Avatar name={friend.displayName} seed={friend.id} size={26} />
                {friend.displayName.split(' ')[0]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="modal__foot">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Create channel
        </button>
      </div>
    </form>
  )
}

interface CreateChannelModalProps {
  open: boolean
  onClose: () => void
  onCreated: (channelId: string) => void
}

export function CreateChannelModal({ open, onClose, onCreated }: CreateChannelModalProps) {
  return (
    <Modal open={open} onClose={onClose} label="Create a channel">
      <CreateChannelForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  )
}
