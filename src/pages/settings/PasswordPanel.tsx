import { Check, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface Errors {
  current?: string
  next?: string
  confirm?: string
}

export function PasswordPanel() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [done, setDone] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    if (current.length === 0) found.current = 'Enter your current password.'
    if (next.length < 10) found.next = 'Use at least 10 characters.'
    else if (next === current) found.next = 'Choose a password you haven’t used here.'
    if (confirm !== next) found.confirm = 'The two passwords don’t match.'
    setErrors(found)
    setDone(false)
    if (Object.keys(found).length > 0) return
    // Nothing is sent anywhere. The fields are simply cleared.
    setCurrent('')
    setNext('')
    setConfirm('')
    setDone(true)
  }

  return (
    <section className="panel" aria-labelledby="password-title">
      <div className="panel__head">
        <h2 className="panel__title" id="password-title">
          <LockKeyhole size={18} aria-hidden="true" />
          Password
        </h2>
      </div>
      <form className="panel__body form-stack" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="field span-2">
            <label className="field__label" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={current}
              aria-invalid={errors.current ? true : undefined}
              onChange={(event) => setCurrent(event.target.value)}
            />
            {errors.current ? <p className="field__error">{errors.current}</p> : null}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={next}
              aria-invalid={errors.next ? true : undefined}
              onChange={(event) => setNext(event.target.value)}
            />
            {errors.next ? <p className="field__error">{errors.next}</p> : <p className="field__hint">At least 10 characters.</p>}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={errors.confirm ? true : undefined}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {errors.confirm ? <p className="field__error">{errors.confirm}</p> : null}
          </div>
        </div>
        <div className="twofa-actions">
          <button type="submit" className="btn btn--secondary">
            Update password
          </button>
          {done ? (
            <p className="save-bar__text" role="status">
              <Check size={16} aria-hidden="true" />
              Looks good. Nothing was saved: there is no server to store a password yet.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
