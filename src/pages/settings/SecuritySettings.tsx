import { useDocumentTitle } from '../../lib/hooks'
import { PasswordPanel } from './PasswordPanel'
import { TwoFactorPanel } from './TwoFactorPanel'

export function SecuritySettings() {
  useDocumentTitle('Security settings')
  return (
    <div className="settings-form">
      <TwoFactorPanel />
      <PasswordPanel />
    </div>
  )
}
