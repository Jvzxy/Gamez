import { createContext, useContext } from 'react'
import type {
  Channel,
  ChannelVisibility,
  ChatMessage,
  DirectThread,
  MemberRole,
} from '../types'

export interface NewChannelInput {
  name: string
  topic: string
  visibility: ChannelVisibility
  /** True when the owner chose a password. The password itself is never kept. */
  hasPassword: boolean
  inviteIds: string[]
}

export type ChannelPatch = Partial<
  Pick<Channel, 'name' | 'topic' | 'visibility' | 'hasPassword' | 'permissions'>
>

export interface ChatState {
  channels: Channel[]
  dms: DirectThread[]
  messages: Record<string, ChatMessage[]>
  unread: Record<string, number>
}

export interface ChatContextValue extends ChatState {
  totalUnread: number
  sendMessage: (threadId: string, text: string) => void
  markRead: (threadId: string) => void
  createChannel: (input: NewChannelInput) => string
  updateChannel: (channelId: string, patch: ChannelPatch) => void
  setMemberRole: (channelId: string, playerId: string, role: MemberRole) => void
  muteMember: (channelId: string, playerId: string, mutedFor: string | undefined) => void
  removeMember: (channelId: string, playerId: string, mode: 'kick' | 'ban') => void
  unbanMember: (channelId: string, playerId: string) => void
  deleteChannel: (channelId: string) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat must be used inside <ChatProvider>')
  return value
}
