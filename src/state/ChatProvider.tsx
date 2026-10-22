import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { seedChannels, seedDms, seedMessages, seedUnread } from '../data/chat'
import { getPlayer } from '../data/players'
import { clock } from '../lib/format'
import type { Channel, ChatMessage, MemberRole } from '../types'
import {
  ChatContext,
  type ChannelPatch,
  type ChatContextValue,
  type ChatState,
  type NewChannelInput,
} from './chat'
import { chatReducer } from './chatReducer'

// Chat state lives in memory only. Every function below is where a real API
// call (and websocket event) would go. Nothing is sent anywhere.
const initialState: ChatState = {
  channels: seedChannels,
  dms: seedDms,
  messages: seedMessages,
  unread: seedUnread,
}

function nameOf(playerId: string): string {
  return getPlayer(playerId)?.displayName.split(' ')[0] ?? 'Someone'
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const counter = useRef(0)

  const makeMessage = useCallback(
    (threadId: string, authorId: string, text: string, kind: ChatMessage['kind']): ChatMessage => {
      counter.current += 1
      return {
        id: `local-${Date.now().toString(36)}-${counter.current}`,
        threadId,
        authorId,
        kind,
        text,
        time: clock(),
      }
    },
    [],
  )

  const notice = useCallback(
    (threadId: string, text: string) => makeMessage(threadId, 'system', text, 'system'),
    [makeMessage],
  )

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      dispatch({ type: 'message', message: makeMessage(threadId, 'me', trimmed, 'message') })
    },
    [makeMessage],
  )

  const markRead = useCallback((threadId: string) => dispatch({ type: 'read', threadId }), [])

  const createChannel = useCallback(
    (input: NewChannelInput): string => {
      const taken = new Set(stateRef.current.channels.map((channel) => channel.id))
      let id = `ch-${input.name}`
      for (let n = 2; taken.has(id); n += 1) id = `ch-${input.name}-${n}`

      const channel: Channel = {
        id,
        kind: 'channel',
        name: input.name,
        topic: input.topic,
        visibility: input.visibility,
        hasPassword: input.hasPassword,
        createdLabel: `Created ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        members: [
          { playerId: 'me', role: 'owner' },
          ...input.inviteIds.map((playerId) => ({ playerId, role: 'member' as const })),
        ],
        bannedIds: [],
        permissions: {
          membersCanSend: true,
          membersCanInvite: input.visibility === 'public',
          membersCanShareLinks: true,
          slowModeSeconds: 0,
        },
      }
      const invited = input.inviteIds.length
      dispatch({
        type: 'create-channel',
        channel,
        notice: notice(
          id,
          invited > 0
            ? `You created #${input.name} and added ${invited} ${invited === 1 ? 'friend' : 'friends'}`
            : `You created #${input.name}`,
        ),
      })
      return id
    },
    [notice],
  )

  const updateChannel = useCallback(
    (channelId: string, patch: ChannelPatch) => dispatch({ type: 'update-channel', channelId, patch }),
    [],
  )

  const setMemberRole = useCallback(
    (channelId: string, playerId: string, role: MemberRole) => {
      const verb = role === 'admin' ? 'is now an admin' : 'is no longer an admin'
      dispatch({
        type: 'set-role',
        channelId,
        playerId,
        role,
        notice: notice(channelId, `${nameOf(playerId)} ${verb}`),
      })
    },
    [notice],
  )

  const muteMember = useCallback(
    (channelId: string, playerId: string, mutedFor: string | undefined) => {
      const text = mutedFor
        ? `${nameOf(playerId)} was muted for ${mutedFor} by You`
        : `${nameOf(playerId)} was unmuted by You`
      dispatch({ type: 'mute', channelId, playerId, mutedFor, notice: notice(channelId, text) })
    },
    [notice],
  )

  const removeMember = useCallback(
    (channelId: string, playerId: string, mode: 'kick' | 'ban') => {
      const text = mode === 'ban' ? `${nameOf(playerId)} was banned by You` : `${nameOf(playerId)} was removed by You`
      dispatch({
        type: 'remove-member',
        channelId,
        playerId,
        ban: mode === 'ban',
        notice: notice(channelId, text),
      })
    },
    [notice],
  )

  const unbanMember = useCallback(
    (channelId: string, playerId: string) => {
      dispatch({
        type: 'unban',
        channelId,
        playerId,
        notice: notice(channelId, `${nameOf(playerId)} was unbanned by You`),
      })
    },
    [notice],
  )

  const deleteChannel = useCallback((channelId: string) => dispatch({ type: 'delete-channel', channelId }), [])

  const value = useMemo<ChatContextValue>(() => {
    const totalUnread = Object.values(state.unread).reduce((sum, count) => sum + count, 0)
    return {
      ...state,
      totalUnread,
      sendMessage,
      markRead,
      createChannel,
      updateChannel,
      setMemberRole,
      muteMember,
      removeMember,
      unbanMember,
      deleteChannel,
    }
  }, [
    state,
    sendMessage,
    markRead,
    createChannel,
    updateChannel,
    setMemberRole,
    muteMember,
    removeMember,
    unbanMember,
    deleteChannel,
  ])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
