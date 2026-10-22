import { ShieldCheck, UserRound } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '../../lib/hooks'
import { useUser } from '../../state/user'
import './settings.css'

export function SettingsLayout() {
  useDocumentTitle('Settings')
  const { pathname } = useLocation()
  const { twoFactor } = useUser()

  const items = [
    { to: '/settings/account', label: 'Account', icon: UserRound, badge: null },
    {
      to: '/settings/security',
      label: 'Security',
      icon: ShieldCheck,
      badge: twoFactor.enabled ? { text: '2FA on', className: 'badge badge--ok' } : { text: '2FA off', className: 'badge badge--gold' },
    },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-head__sub">Update how you appear to other players and keep your account secure.</p>
        </div>
      </div>

      <div className="settings">
        <nav className="settings-nav" aria-label="Settings sections">
          {items.map((item) => {
            const active = pathname === item.to
            return (
              <Link key={item.to} to={item.to} className={`settings-nav__link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <item.icon size={18} aria-hidden="true" />
                {item.label}
                {item.badge ? <span className={item.badge.className}>{item.badge.text}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
