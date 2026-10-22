import { Check, Info } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Toggle } from '../../components/ui/Toggle'
import { getPlayerByUsername } from '../../data/players'
import { useDocumentTitle } from '../../lib/hooks'
import { useUser, type AccountSettings as Account } from '../../state/user'

interface Errors {
  displayName?: string
  username?: string
  email?: string
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fil', label: 'Filipino' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
]

function validate(draft: Account): Errors {
  const errors: Errors = {}
  const name = draft.displayName.trim()
  if (name.length < 2 || name.length > 30) errors.displayName = 'Use between 2 and 30 characters.'
  if (!/^[a-z0-9_]{3,20}$/.test(draft.username)) errors.username = 'Use 3 to 20 lowercase letters, numbers or underscores.'
  else {
    const owner = getPlayerByUsername(draft.username)
    if (owner && owner.id !== 'me') errors.username = 'That username is already taken.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errors.email = 'Enter an email address like name@example.com.'
  return errors
}

export function AccountSettings() {
  useDocumentTitle('Account settings')
  const { account, updateAccount } = useUser()
  const [draft, setDraft] = useState<Account>(account)
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(account)

  const change = (patch: Partial<Account>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSaved(false)
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    updateAccount({ ...draft, displayName: draft.displayName.trim() })
    setSaved(true)
  }

  const discard = () => {
    setDraft(account)
    setErrors({})
    setSaved(false)
  }

  return (
    <form className="settings-form" onSubmit={save} noValidate>
      <section className="panel" aria-labelledby="profile-title">
        <div className="panel__head">
          <h2 className="panel__title" id="profile-title">
            Profile
          </h2>
        </div>
        <div className="panel__body form-stack">
          <div className="avatar-row">
            <Avatar name={draft.displayName || 'You'} seed="me" size={64} />
            <p className="muted">Your picture uses your initials for now. Uploading an image needs a server to store it.</p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="display-name">
                Display name
              </label>
              <input
                id="display-name"
                className="input"
                value={draft.displayName}
                maxLength={30}
                aria-invalid={errors.displayName ? true : undefined}
                onChange={(event) => change({ displayName: event.target.value })}
              />
              {errors.displayName ? <p className="field__error">{errors.displayName}</p> : <p className="field__hint">Shown on your profile, in chat and on leaderboards.</p>}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="input"
                value={draft.username}
                maxLength={20}
                autoComplete="username"
                aria-invalid={errors.username ? true : undefined}
                onChange={(event) => change({ username: event.target.value.toLowerCase() })}
              />
              {errors.username ? <p className="field__error">{errors.username}</p> : <p className="field__hint">Your profile address: /profile/{draft.username || 'username'}</p>}
            </div>

            <div className="field span-2">
              <label className="field__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                value={draft.email}
                aria-invalid={errors.email ? true : undefined}
                onChange={(event) => change({ email: event.target.value })}
              />
              {errors.email ? <p className="field__error">{errors.email}</p> : <p className="field__hint">Used for sign-in and security notices.</p>}
            </div>

            <div className="field span-2">
              <label className="field__label" htmlFor="bio">
                Bio
              </label>
              <textarea id="bio" className="textarea" rows={3} maxLength={160} value={draft.bio} onChange={(event) => change({ bio: event.target.value })} />
              <p className="field__hint">{draft.bio.length} of 160 characters</p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="language">
                Language
              </label>
              <select id="language" className="select" value={draft.language} onChange={(event) => change({ language: event.target.value })}>
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
              <p className="field__hint">Translations aren&rsquo;t available yet. Your choice is kept for when they are.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="privacy-title">
        <div className="panel__head">
          <h2 className="panel__title" id="privacy-title">
            Privacy
          </h2>
        </div>
        <div className="panel__body">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__title" id="online-label">
                Show when I&rsquo;m online
              </span>
              <span className="setting-row__desc">Friends can see if you&rsquo;re online or in a game.</span>
            </div>
            <Toggle label="Show when I'm online" checked={draft.showOnlineStatus} onChange={(value) => change({ showOnlineStatus: value })} />
          </div>
          <div className="setting-row">
            <div className="setting-row__text">
              <label className="setting-row__title" htmlFor="friend-requests">
                Who can send friend requests
              </label>
              <span className="setting-row__desc">Limit who can add you.</span>
            </div>
            <select
              id="friend-requests"
              className="select select--auto"
              value={draft.allowFriendRequests}
              onChange={(event) => change({ allowFriendRequests: event.target.value as Account['allowFriendRequests'] })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends-of-friends">Friends of friends</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="notify-title">
        <div className="panel__head">
          <h2 className="panel__title" id="notify-title">
            Notifications
          </h2>
        </div>
        <div className="panel__body">
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__title">Match invites</span>
              <span className="setting-row__desc">When a friend invites you to a game.</span>
            </div>
            <Toggle label="Match invites" checked={draft.notifyMatchInvites} onChange={(value) => change({ notifyMatchInvites: value })} />
          </div>
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__title">Direct messages</span>
              <span className="setting-row__desc">When someone messages you privately.</span>
            </div>
            <Toggle label="Direct messages" checked={draft.notifyDirectMessages} onChange={(value) => change({ notifyDirectMessages: value })} />
          </div>
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__title">Friend requests</span>
              <span className="setting-row__desc">When someone wants to add you.</span>
            </div>
            <Toggle label="Friend requests" checked={draft.notifyFriendRequests} onChange={(value) => change({ notifyFriendRequests: value })} />
          </div>
        </div>
      </section>

      <div className="save-bar" role="status">
        <p className="save-bar__text">
          {saved ? (
            <>
              <Check size={16} aria-hidden="true" />
              Saved for this session. Nothing is sent to a server yet.
            </>
          ) : dirty ? (
            'You have unsaved changes.'
          ) : (
            <>
              <Info size={16} aria-hidden="true" />
              Changes are kept in memory until a backend exists.
            </>
          )}
        </p>
        <div className="save-bar__actions">
          <button type="button" className="btn btn--ghost" onClick={discard} disabled={!dirty}>
            Discard
          </button>
          <button type="submit" className="btn btn--primary" disabled={!dirty}>
            Save changes
          </button>
        </div>
      </div>
    </form>
  )
}
