import { Globe, Hash, KeyRound, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ChannelVisibility } from '../../types'

export function visibilityIcon(visibility: ChannelVisibility, size = 18): ReactNode {
  if (visibility === 'private') return <Lock size={size} aria-hidden="true" />
  if (visibility === 'protected') return <KeyRound size={size} aria-hidden="true" />
  return <Hash size={size} aria-hidden="true" />
}

export function visibilityLabel(visibility: ChannelVisibility): { icon: ReactNode; text: string } {
  if (visibility === 'private') return { icon: <Lock size={15} aria-hidden="true" />, text: 'Private. Members join by invite.' }
  if (visibility === 'protected') return { icon: <KeyRound size={15} aria-hidden="true" />, text: 'Protected. A password is needed to join.' }
  return { icon: <Globe size={15} aria-hidden="true" />, text: 'Public. Anyone can join.' }
}

/** The three ways a channel can be opened up. Shared by the create dialog and Room Settings. */
export const visibilityOptions: Array<{ id: ChannelVisibility; title: string; description: string; icon: LucideIcon }> = [
  { id: 'public', title: 'Public', description: 'Anyone can find and join.', icon: Globe },
  { id: 'private', title: 'Private', description: 'Only people you invite can join.', icon: Lock },
  { id: 'protected', title: 'Password protected', description: 'Anyone with the password can join.', icon: KeyRound },
]
