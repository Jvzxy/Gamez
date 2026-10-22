import { Check, Copy, Download, KeyRound, Mail, ShieldCheck, ShieldOff, Smartphone, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { CodeInput } from '../../components/ui/CodeInput'
import { Modal } from '../../components/ui/Modal'
import { generateBackupCodes, maskEmail } from '../../lib/backupCodes'
import { useUser, type TwoFactorMethod } from '../../state/user'

type Step = 'method' | 'verify' | 'backup'

const methods: Array<{ id: TwoFactorMethod; title: string; description: string; icon: LucideIcon }> = [
  { id: 'app', title: 'Authenticator app', description: 'Codes from an app such as Google Authenticator, 1Password or Authy.', icon: KeyRound },
  { id: 'sms', title: 'Text message', description: 'A code is texted to your phone each time you sign in.', icon: Smartphone },
  { id: 'email', title: 'Email', description: 'A code is sent to your account email.', icon: Mail },
]

const methodName = (method: TwoFactorMethod | null): string => methods.find((m) => m.id === method)?.title ?? 'None'

// Shown for the authenticator-app step. It is a fixed sample, not tied to any account or app.
const sampleKey = 'JBSW Y3DP EHPK 3PXP'

export function TwoFactorPanel() {
  const { twoFactor, setTwoFactor, account } = useUser()
  const [step, setStep] = useState<Step | null>(null)
  const [method, setMethod] = useState<TwoFactorMethod>('app')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [turningOff, setTurningOff] = useState(false)
  const [offCode, setOffCode] = useState('')
  const [offError, setOffError] = useState('')
  // True when the backup-code dialog was opened to refresh codes on an already-enabled account.
  const [refreshing, setRefreshing] = useState(false)

  const closeWizard = () => {
    setStep(null)
    setRefreshing(false)
    setCode('')
    setError('')
    setSaved(false)
    setCopied(false)
  }

  const beginSetup = () => {
    setMethod('app')
    setPhone('')
    setCode('')
    setError('')
    setStep('method')
  }

  const beginRefresh = () => {
    setCodes(generateBackupCodes())
    setRefreshing(true)
    setSaved(false)
    setStep('backup')
  }

  const verify = () => {
    if (method === 'sms' && !/^\+?[0-9 ()-]{7,}$/.test(phone.trim())) {
      setError('Enter a phone number with at least 7 digits.')
      return
    }
    if (code.length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }
    // There is no server to check the code against, so any 6 digits pass in this preview.
    setError('')
    setCodes(generateBackupCodes())
    setSaved(false)
    setStep('backup')
  }

  const finish = () => {
    if (!refreshing) setTwoFactor({ enabled: true, method })
    closeWizard()
  }

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const downloadCodes = () => {
    const blob = new Blob([`gamez sample backup codes (preview, not connected to an account)\n\n${codes.join('\n')}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'gamez-backup-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const turnOff = () => {
    if (offCode.length !== 6) {
      setOffError('Enter a 6-digit code to confirm.')
      return
    }
    setTwoFactor({ enabled: false, method: null })
    setTurningOff(false)
    setOffCode('')
    setOffError('')
  }

  return (
    <section className="panel" aria-labelledby="twofa-title">
      <div className="panel__head">
        <h2 className="panel__title" id="twofa-title">
          <ShieldCheck size={18} aria-hidden="true" />
          Two-factor authentication
        </h2>
        {twoFactor.enabled ? <span className="badge badge--ok">On</span> : <span className="badge badge--gold">Off</span>}
      </div>

      <div className="panel__body form-stack">
        <p className="muted">
          Two-factor authentication asks for a second code after your password, so a stolen password alone can&rsquo;t open your account.
        </p>

        <p className="notice notice--warn">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>
            Preview only. There is no server, so no code is really sent or checked and nothing here protects an account. The screens show how the flow will work.
          </span>
        </p>

        {twoFactor.enabled ? (
          <>
            <dl className="twofa-summary">
              <div>
                <dt>Method</dt>
                <dd>{methodName(twoFactor.method)}</dd>
              </div>
              <div>
                <dt>Backup codes</dt>
                <dd>Generated in this browser session</dd>
              </div>
            </dl>
            <div className="twofa-actions">
              <button type="button" className="btn btn--secondary" onClick={beginRefresh}>
                New backup codes
              </button>
              <button type="button" className="btn btn--danger" onClick={() => setTurningOff(true)}>
                <ShieldOff size={16} aria-hidden="true" />
                Turn off
              </button>
            </div>
          </>
        ) : (
          <div className="twofa-actions">
            <button type="button" className="btn btn--primary" onClick={beginSetup}>
              <ShieldCheck size={16} aria-hidden="true" />
              Set up two-factor authentication
            </button>
          </div>
        )}
      </div>

      <Modal open={step !== null} onClose={closeWizard} label="Set up two-factor authentication">
        <div className="wizard">
          {step === 'method' ? (
            <>
              <div className="modal__head">
                <h2>Choose a method</h2>
                <p>You can change this later.</p>
              </div>
              <fieldset className="radio-cards wizard__body">
                <legend className="sr-only">Method</legend>
                {methods.map((option) => (
                  <label className="radio-card" key={option.id}>
                    <input type="radio" name="method" value={option.id} checked={method === option.id} onChange={() => setMethod(option.id)} />
                    <option.icon size={20} aria-hidden="true" />
                    <span className="radio-card__text">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="modal__foot">
                <button type="button" className="btn btn--ghost" onClick={closeWizard}>
                  Cancel
                </button>
                <button type="button" className="btn btn--primary" onClick={() => setStep('verify')}>
                  Continue
                </button>
              </div>
            </>
          ) : null}

          {step === 'verify' ? (
            <>
              <div className="modal__head">
                <h2>Verify {methodName(method).toLowerCase()}</h2>
                <p>Preview: no message is sent, and any 6-digit code is accepted.</p>
              </div>
              <div className="wizard__body form-stack">
                {method === 'app' ? (
                  <div className="qr-box">
                    <div className="qr-box__code" aria-hidden="true">
                      QR code would appear here
                    </div>
                    <p className="muted">
                      Or enter this sample key in your app: <strong className="mono">{sampleKey}</strong>
                    </p>
                  </div>
                ) : null}
                {method === 'sms' ? (
                  <div className="field">
                    <label className="field__label" htmlFor="phone">
                      Phone number
                    </label>
                    <input id="phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+63 912 345 6789" />
                  </div>
                ) : null}
                {method === 'email' ? <p className="muted">A code would be sent to {maskEmail(account.email)}.</p> : null}
                <CodeInput id="verify-code" label="6-digit code" value={code} onChange={setCode} invalid={Boolean(error)} autoFocus />
                {error ? <p className="field__error">{error}</p> : null}
              </div>
              <div className="modal__foot">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('method')}>
                  Back
                </button>
                <button type="button" className="btn btn--primary" onClick={verify}>
                  Verify
                </button>
              </div>
            </>
          ) : null}

          {step === 'backup' ? (
            <>
              <div className="modal__head">
                <h2>Save your backup codes</h2>
                <p>Each code works once if you lose access to your second factor. These are sample codes made in your browser.</p>
              </div>
              <div className="wizard__body form-stack">
                <ul className="backup-codes" aria-label="Backup codes">
                  {codes.map((backup) => (
                    <li key={backup} className="mono">
                      {backup}
                    </li>
                  ))}
                </ul>
                <div className="twofa-actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={copyCodes}>
                    {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={downloadCodes}>
                    <Download size={15} aria-hidden="true" />
                    Download
                  </button>
                </div>
                <label className="check">
                  <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
                  <span>I&rsquo;ve saved these codes somewhere safe.</span>
                </label>
              </div>
              <div className="modal__foot">
                <button type="button" className="btn btn--ghost" onClick={closeWizard}>
                  Cancel
                </button>
                <button type="button" className="btn btn--primary" disabled={!saved} onClick={finish}>
                  {refreshing ? 'Done' : 'Turn on two-factor authentication'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal open={turningOff} onClose={() => setTurningOff(false)} label="Turn off two-factor authentication" size="sm">
        <div className="wizard">
          <div className="modal__head">
            <h2>Turn off two-factor authentication?</h2>
            <p>Your account will rely on your password alone. Enter a code to confirm (any 6 digits work in this preview).</p>
          </div>
          <div className="wizard__body form-stack">
            <CodeInput id="off-code" label="6-digit code" value={offCode} onChange={setOffCode} invalid={Boolean(offError)} autoFocus />
            {offError ? <p className="field__error">{offError}</p> : null}
          </div>
          <div className="modal__foot">
            <button type="button" className="btn btn--ghost" onClick={() => setTurningOff(false)}>
              Keep it on
            </button>
            <button type="button" className="btn btn--danger" onClick={turnOff}>
              Turn off
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
