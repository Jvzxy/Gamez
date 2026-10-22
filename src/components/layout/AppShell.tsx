import { Info, House, MessageSquare, Settings, Swords, User, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useChat } from '../../state/chat'
import { useCurrentPlayer } from '../../state/user'
import { PongIcon } from '../icons/PongIcon'
import { Avatar } from '../ui/Avatar'

interface NavItem {
  label: string
  to: string
  /** Path prefixes that mark this item as the current section. */
  sections: string[]
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/', sections: ['/'], icon: House },
  { label: 'Games', to: '/games', sections: ['/games', '/game'], icon: Swords },
  { label: 'Chat', to: '/chat', sections: ['/chat'], icon: MessageSquare },
  { label: 'Profile', to: '/profile', sections: ['/profile'], icon: User },
  { label: 'Settings', to: '/settings', sections: ['/settings'], icon: Settings },
]

function isActive(pathname: string, sections: string[]): boolean {
  return sections.some((section) => (section === '/' ? pathname === '/' : pathname === section || pathname.startsWith(`${section}/`)))
}

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="gamez home">
      <span className="brand__mark">
        <PongIcon size={20} strokeWidth={2.4} />
      </span>
      gamez
    </Link>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const { totalUnread } = useChat()
  const me = useCurrentPlayer()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav" aria-label="Main">
          {navItems.map((item) => {
            const active = isActive(pathname, item.sections)
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nav__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon size={20} aria-hidden="true" />
                {item.label}
                {item.label === 'Chat' && totalUnread > 0 ? (
                  <span className="nav__badge" aria-label={`${totalUnread} unread messages`}>
                    {totalUnread}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar__foot">
          <p className="preview-tag">
            <Info size={15} aria-hidden="true" />
            <span>Frontend preview with sample data. No server is connected.</span>
          </p>
          <Link to="/profile" className="me-card" aria-label="Your profile">
            <Avatar name={me.displayName} seed={me.id} size={38} status={me.status} />
            <span className="me-card__text">
              <span className="me-card__name">{me.displayName}</span>
              <span className="me-card__meta">Level {me.level}</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <Brand />
          <p className="preview-tag">
            <Info size={14} aria-hidden="true" />
            <span>Sample data</span>
          </p>
        </header>
        <main>
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {navItems.map((item) => {
          const active = isActive(pathname, item.sections)
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`tabbar__link${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon size={22} aria-hidden="true" />
              {item.label}
              {item.label === 'Chat' && totalUnread > 0 ? (
                <span className="tabbar__badge" aria-label={`${totalUnread} unread messages`}>
                  {totalUnread}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
