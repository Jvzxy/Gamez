import { createContext, useContext, useMemo } from 'react'
import { getPlayer } from '../data/players'
import type { Player } from '../types'

export type TwoFactorMethod = 'app' | 'sms' | 'email'

export interface AccountSettings {
  displayName: string
  username: string
  email: string
  bio: string
  language: string
  showOnlineStatus: boolean
  allowFriendRequests: 'everyone' | 'friends-of-friends' | 'nobody'
  notifyMatchInvites: boolean
  notifyDirectMessages: boolean
  notifyFriendRequests: boolean
}

export interface TwoFactorState {
  enabled: boolean
  method: TwoFactorMethod | null
}

export interface UserContextValue {
  account: AccountSettings
  updateAccount: (patch: Partial<AccountSettings>) => void
  twoFactor: TwoFactorState
  setTwoFactor: (next: TwoFactorState) => void
}

export const UserContext = createContext<UserContextValue | null>(null)

export function useUser(): UserContextValue {
  const value = useContext(UserContext)
  if (!value) throw new Error('useUser must be used inside <UserProvider>')
  return value
}

/** The signed-in player, with any edits made in Settings applied on top. */
export function useCurrentPlayer(): Player {
  const { account } = useUser()
  return useMemo(() => {
    const base = getPlayer('me')
    if (!base) throw new Error('Sample data is missing the current user')
    return { ...base, displayName: account.displayName, username: account.username, bio: account.bio }
  }, [account.displayName, account.username, account.bio])
}

/** Looks a player up by id, substituting the edited profile for the current user. */
export function usePlayerLookup(): (id: string) => Player | undefined {
  const me = useCurrentPlayer()
  return useMemo(() => (id: string) => (id === me.id ? me : getPlayer(id)), [me])
}
