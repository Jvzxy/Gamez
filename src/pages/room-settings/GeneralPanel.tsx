import { Check, Info } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { channelSlug } from '../../lib/format'
import { canEditCore, canEditRules } from '../../lib/permissions'
import { useChat } from '../../state/chat'
import type { Channel, ChannelVisibility, MemberRole } from '../../types'
import { visibilityOptions } from '../chat/visibility'

const topicLimit = 120

interface GeneralPanelProps {
  channel: Channel
  myRole: MemberRole
}

export function GeneralPanel({ channel, myRole }: GeneralPanelProps) {
  const { channels, updateChannel } = useChat()
  const [name, setName] = useState(channel.name)
  const [topic, setTopic] = useState(channel.topic)
  const [visibility, setVisibility] = useState<ChannelVisibility>(channel.visibility)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({})
  const [saved, setSaved] = useState(false)

  const core = canEditCore(myRole)
  const rules = canEditRules(myRole)
  const dirty = name !== channel.name || topic !== channel.topic || visibility !== channel.visibility || password.length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: { name?: string; password?: string } = {}
    if (core) {
      if (name.length < 2) found.name = 'Use at least 2 characters.'
      else if (channels.some((other) => other.id !== channel.id && other.name === name)) found.name = 'Another channel already uses that name.'
      if (visibility === 'protected' && !channel.hasPassword && password.length < 4) found.password = 'Choose a password of at least 4 characters.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    updateChannel(channel.id, {
      topic: topic.trim(),
      ...(core
        ? {
            name,
            visibility,
            // The password itself is never kept in this preview, only the fact that one exists.
            hasPassword: visibility === 'protected' ? channel.hasPassword || password.length > 0 : false,
          }
        : {}),
    })
    setPassword('')
    setSaved(true)
  }

  return (
    <section className="panel" aria-labelledby="general-title">
      <div className="panel__head">
        <h2 className="panel__title" id="general-title">
          General
        </h2>
      </div>
      <form className="panel__body form-stack" onSubmit={submit} noValidate>
        {!core ? (
          <p className="notice">
            <Info size={18} aria-hidden="true" />
            <span>Admins can edit the topic. Only the owner can change the name, who can join, or the password.</span>
          </p>
        ) : null}

        <div className="field">
          <label className="field__label" htmlFor="room-name">
            Channel name
          </label>
          <input
            id="room-name"
            className="input"
            value={name}
            maxLength={24}
            disabled={!core}
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => {
              setName(channelSlug(event.target.value))
              setSaved(false)
            }}
          />
          {errors.name ? <p className="field__error">{errors.name}</p> : <p className="field__hint">Lowercase letters, numbers and hyphens.</p>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="room-topic">
            Topic
          </label>
          <textarea
            id="room-topic"
            className="textarea"
            rows={2}
            maxLength={topicLimit}
            disabled={!rules}
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value)
              setSaved(false)
            }}
          />
          <p className="field__hint">
            {topic.length} of {topicLimit} characters
          </p>
        </div>

        <fieldset className="radio-cards" disabled={!core}>
          <legend className="field__label">Who can join</legend>
          {visibilityOptions.map((option) => (
            <label key={option.id} className="radio-card">
              <input
                type="radio"
                name="room-visibility"
                value={option.id}
                checked={visibility === option.id}
                onChange={() => {
                  setVisibility(option.id)
                  setSaved(false)
                }}
              />
              <option.icon size={20} aria-hidden="true" />
              <span className="radio-card__text">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {core && visibility === 'protected' ? (
          <div className="field">
            <label className="field__label" htmlFor="room-password">
              {channel.hasPassword ? 'New password' : 'Channel password'}
            </label>
            <input
              id="room-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={errors.password ? true : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setSaved(false)
              }}
            />
            {errors.password ? (
              <p className="field__error">{errors.password}</p>
            ) : (
              <p className="field__hint">{channel.hasPassword ? 'Leave blank to keep the current password.' : 'Share it with the people you want to let in.'}</p>
            )}
          </div>
        ) : null}

        <div className="twofa-actions">
          <button type="submit" className="btn btn--primary" disabled={!dirty}>
            Save changes
          </button>
          {saved ? (
            <p className="save-bar__text" role="status">
              <Check size={16} aria-hidden="true" />
              Saved for this session. Nothing is sent to a server yet.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
