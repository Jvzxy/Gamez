// Shared types for the gamez frontend.
// Everything here describes *sample data shapes*. When a backend exists, these
// are the interfaces its API responses should be mapped to.

export type GameId =
  | 'pong'
  | 'checkers'
  | 'chess'
  | 'sketch-guess'
  | 'doodle-relay'
  | 'codewords'
  | 'party-pack'
  | 'map-guess'
  | 'card-chaos'
  | 'snap-roulette'
  | 'quiz-blitz'
  | 'puzzles'

export type GameCategory = 'Arcade' | 'Board' | 'Creative' | 'Party' | 'Trivia' | 'Puzzle'

/**
 * What a game can really do today.
 *  - playable: has working gameplay in this codebase (a module in src/games/registry.ts).
 *  - planned:  listed in the catalog only. There is no gameplay code for it yet.
 * Keep this in step with the registry; scripts/verify-engines.ts fails if they disagree.
 */
export type GameStatus = 'playable' | 'planned'

export interface Game {
  id: GameId
  name: string
  tagline: string
  category: GameCategory
  minPlayers: number
  maxPlayers: number
  /** Hue (0-360) used to tint the game's tile and page. */
  hue: number
  status: GameStatus
}

/** What stands between a planned game and a playable one. Shown on its Game page. */
export interface GamePlan {
  /** Original game this one is modelled on, for the person building it. */
  inspiredBy: string
  /** One sentence on how a round plays. */
  howItPlays: string
  /** True when the real game needs a server (live sync between several people). */
  needsServer: boolean
  /** The pieces that must exist before it is playable. */
  needs: string[]
  /** The smallest useful first step. */
  firstStep: string
}

export type PresenceStatus = 'online' | 'in-game' | 'away' | 'offline'

export interface GameRecord {
  gameId: GameId
  played: number
  wins: number
}

export interface PlayerStats {
  matches: number
  wins: number
  losses: number
  draws: number
  currentStreak: number
  bestStreak: number
  /** Rating after each of the last N ranked matches, oldest first. */
  ratingHistory: number[]
  perGame: GameRecord[]
}

export interface Player {
  id: string
  username: string
  displayName: string
  bio: string
  rating: number
  level: number
  xp: number
  xpToNext: number
  status: PresenceStatus
  /** Shown under the name, e.g. "Playing Chess". */
  activity: string
  joinedLabel: string
  /** Rating gained (or lost) in the last 7 days. */
  weeklyDelta: number
  stats: PlayerStats
}

export interface LiveMatch {
  id: string
  gameId: GameId
  /** Players shown on the row (may be fewer than playerCount for party games). */
  playerIds: string[]
  playerCount: number
  /** Centre text on the row, e.g. "7 – 6" or "Round 4 of 8". */
  headline: string
  detail: string
  scores?: number[]
  /** Points needed to win (Pong). */
  target?: number
  spectators: number
  startedMinutesAgo: number
}

export type MatchResult = 'win' | 'loss' | 'draw'
export type MatchMode = 'Ranked' | 'Casual' | 'Private room'

export interface PlayedMatch {
  id: string
  gameId: GameId
  opponentIds: string[]
  result: MatchResult
  score: string
  ratingDelta: number
  mode: MatchMode
  durationLabel: string
  minutesAgo: number
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

// ---------------------------------------------------------------- chat

export type ChannelVisibility = 'public' | 'private' | 'protected'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface ChannelMember {
  playerId: string
  role: MemberRole
  /** Human label such as "1 hour". Undefined when not muted. */
  mutedFor?: string
}

export interface ChannelPermissions {
  membersCanSend: boolean
  membersCanInvite: boolean
  membersCanShareLinks: boolean
  slowModeSeconds: number
}

export interface Channel {
  id: string
  kind: 'channel'
  name: string
  topic: string
  visibility: ChannelVisibility
  /** Only the fact that a password exists is kept; a backend would store a hash. */
  hasPassword: boolean
  createdLabel: string
  members: ChannelMember[]
  bannedIds: string[]
  permissions: ChannelPermissions
}

export interface DirectThread {
  id: string
  kind: 'dm'
  playerId: string
}

export type Thread = Channel | DirectThread

export interface ChatMessage {
  id: string
  threadId: string
  kind: 'message' | 'system'
  authorId: string
  time: string
  text: string
}
