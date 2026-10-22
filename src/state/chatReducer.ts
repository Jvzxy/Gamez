import type { Channel, ChatMessage, MemberRole } from '../types'
import type { ChannelPatch, ChatState } from './chat'

export type ChatAction =
  | { type: 'message'; message: ChatMessage }
  | { type: 'read'; threadId: string }
  | { type: 'create-channel'; channel: Channel; notice: ChatMessage }
  | { type: 'update-channel'; channelId: string; patch: ChannelPatch }
  | { type: 'set-role'; channelId: string; playerId: string; role: MemberRole; notice: ChatMessage }
  | { type: 'mute'; channelId: string; playerId: string; mutedFor: string | undefined; notice: ChatMessage }
  | { type: 'remove-member'; channelId: string; playerId: string; ban: boolean; notice: ChatMessage }
  | { type: 'unban'; channelId: string; playerId: string; notice: ChatMessage }
  | { type: 'delete-channel'; channelId: string }

function updateChannel(state: ChatState, channelId: string, change: (channel: Channel) => Channel): ChatState {
  return {
    ...state,
    channels: state.channels.map((channel) => (channel.id === channelId ? change(channel) : channel)),
  }
}

function addMessage(state: ChatState, message: ChatMessage): ChatState {
  const existing = state.messages[message.threadId] ?? []
  return { ...state, messages: { ...state.messages, [message.threadId]: [...existing, message] } }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'message':
      return addMessage(state, action.message)

    case 'read':
      if (!state.unread[action.threadId]) return state
      return { ...state, unread: { ...state.unread, [action.threadId]: 0 } }

    case 'create-channel':
      return addMessage(
        { ...state, channels: [action.channel, ...state.channels] },
        action.notice,
      )

    case 'update-channel':
      return updateChannel(state, action.channelId, (channel) => ({ ...channel, ...action.patch }))

    case 'set-role':
      return addMessage(
        updateChannel(state, action.channelId, (channel) => ({
          ...channel,
          members: channel.members.map((member) =>
            member.playerId === action.playerId ? { ...member, role: action.role } : member,
          ),
        })),
        action.notice,
      )

    case 'mute':
      return addMessage(
        updateChannel(state, action.channelId, (channel) => ({
          ...channel,
          members: channel.members.map((member) =>
            member.playerId === action.playerId ? { ...member, mutedFor: action.mutedFor } : member,
          ),
        })),
        action.notice,
      )

    case 'remove-member':
      return addMessage(
        updateChannel(state, action.channelId, (channel) => ({
          ...channel,
          members: channel.members.filter((member) => member.playerId !== action.playerId),
          bannedIds: action.ban ? [...channel.bannedIds, action.playerId] : channel.bannedIds,
        })),
        action.notice,
      )

    case 'unban':
      return addMessage(
        updateChannel(state, action.channelId, (channel) => ({
          ...channel,
          bannedIds: channel.bannedIds.filter((id) => id !== action.playerId),
        })),
        action.notice,
      )

    case 'delete-channel': {
      const messages = { ...state.messages }
      delete messages[action.channelId]
      const unread = { ...state.unread }
      delete unread[action.channelId]
      return {
        ...state,
        channels: state.channels.filter((channel) => channel.id !== action.channelId),
        messages,
        unread,
      }
    }

    default:
      return state
  }
}
