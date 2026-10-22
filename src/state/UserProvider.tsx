import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { UserContext, type AccountSettings, type TwoFactorState, type UserContextValue } from './user'

// Account data lives in memory only. Reloading the page resets it. Replace the
// initial values and the two setters with API calls once a backend exists.
const initialAccount: AccountSettings = {
  displayName: 'Kairo Vance',
  username: 'kairo',
  email: 'kairo@example.com',
  bio: 'Paddle first, ask questions later. Chess on Sundays, drawing games when the lobby gets loud.',
  language: 'en',
  showOnlineStatus: true,
  allowFriendRequests: 'everyone',
  notifyMatchInvites: true,
  notifyDirectMessages: true,
  notifyFriendRequests: false,
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountSettings>(initialAccount)
  const [twoFactor, setTwoFactor] = useState<TwoFactorState>({ enabled: false, method: null })

  const updateAccount = useCallback((patch: Partial<AccountSettings>) => {
    setAccount((current) => ({ ...current, ...patch }))
  }, [])

  const value = useMemo<UserContextValue>(
    () => ({ account, updateAccount, twoFactor, setTwoFactor }),
    [account, updateAccount, twoFactor],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
