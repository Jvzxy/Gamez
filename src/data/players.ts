import { hashString, seededRandom } from '../lib/format'
import type { GameId, GameRecord, Player, PresenceStatus } from '../types'

// SAMPLE DATA. Nothing here comes from a server. Stats beyond the headline
// numbers are generated deterministically from each player's seed so they look
// the same on every load.

export const currentUserId = 'me'

interface PlayerSeed {
  id: string
  username: string
  displayName: string
  bio: string
  rating: number
  level: number
  status: PresenceStatus
  activity: string
  joined: string
  weeklyDelta: number
  matches: number
  winRate: number
  streak: number
  bestStreak: number
  games: GameId[]
}

const seeds: PlayerSeed[] = [
  {
    id: 'me',
    username: 'kairo',
    displayName: 'Kairo Vance',
    bio: 'Paddle first, ask questions later. Chess on Sundays, drawing games when the lobby gets loud.',
    rating: 1962,
    level: 27,
    status: 'online',
    activity: 'Online',
    joined: 'Mar 2025',
    weeklyDelta: 48,
    matches: 412,
    winRate: 0.578,
    streak: 4,
    bestStreak: 9,
    games: ['pong', 'chess', 'sketch-guess', 'checkers'],
  },
  {
    id: 'yukis',
    username: 'yukis',
    displayName: 'Yuki Sato',
    bio: 'Two-time ladder champion. Bullet chess in the morning, Pong at night.',
    rating: 2312,
    level: 54,
    status: 'in-game',
    activity: 'Playing Chess',
    joined: 'Aug 2024',
    weeklyDelta: 31,
    matches: 1180,
    winRate: 0.71,
    streak: 7,
    bestStreak: 21,
    games: ['chess', 'pong', 'checkers'],
  },
  {
    id: 'dvolkov',
    username: 'dvolkov',
    displayName: 'Dmitri Volkov',
    bio: 'Spin-heavy serves and zero chill.',
    rating: 2266,
    level: 49,
    status: 'in-game',
    activity: 'Playing Ping Pong',
    joined: 'Sep 2024',
    weeklyDelta: -12,
    matches: 960,
    winRate: 0.68,
    streak: 0,
    bestStreak: 17,
    games: ['pong', 'chess', 'quiz-blitz'],
  },
  {
    id: 'aria',
    username: 'aria',
    displayName: 'Aria Lindqvist',
    bio: 'Runs the Friday ladder. Rematch requests always accepted.',
    rating: 2241,
    level: 47,
    status: 'in-game',
    activity: 'Playing Ping Pong',
    joined: 'Oct 2024',
    weeklyDelta: 66,
    matches: 884,
    winRate: 0.66,
    streak: 5,
    bestStreak: 14,
    games: ['pong', 'sketch-guess', 'map-guess'],
  },
  {
    id: 'meitan',
    username: 'meitan',
    displayName: 'Mei Tanaka',
    bio: 'Opening theory nerd.',
    rating: 2189,
    level: 44,
    status: 'online',
    activity: 'Online',
    joined: 'Nov 2024',
    weeklyDelta: 22,
    matches: 702,
    winRate: 0.64,
    streak: 2,
    bestStreak: 11,
    games: ['chess', 'checkers', 'puzzles'],
  },
  {
    id: 'sreyes',
    username: 'sreyes',
    displayName: 'Santiago Reyes',
    bio: 'Quiz night regular. Surprisingly good at geography.',
    rating: 2102,
    level: 39,
    status: 'away',
    activity: 'Away',
    joined: 'Dec 2024',
    weeklyDelta: -30,
    matches: 655,
    winRate: 0.61,
    streak: 0,
    bestStreak: 9,
    games: ['pong', 'quiz-blitz', 'map-guess'],
  },
  {
    id: 'elenap',
    username: 'elenap',
    displayName: 'Elena Petrova',
    bio: 'Community moderator.',
    rating: 2013,
    level: 36,
    status: 'online',
    activity: 'Online',
    joined: 'Jan 2025',
    weeklyDelta: 14,
    matches: 540,
    winRate: 0.6,
    streak: 3,
    bestStreak: 8,
    games: ['chess', 'pong', 'codewords'],
  },
  {
    id: 'zainab',
    username: 'zainab',
    displayName: 'Zainab Hussein',
    bio: 'Draws badly on purpose.',
    rating: 1934,
    level: 31,
    status: 'online',
    activity: 'Online',
    joined: 'Jan 2025',
    weeklyDelta: 40,
    matches: 477,
    winRate: 0.55,
    streak: 1,
    bestStreak: 7,
    games: ['sketch-guess', 'doodle-relay', 'pong'],
  },
  {
    id: 'lbrandt',
    username: 'lbrandt',
    displayName: 'Lukas Brandt',
    bio: 'King me.',
    rating: 1891,
    level: 28,
    status: 'in-game',
    activity: 'Playing Checkers',
    joined: 'Feb 2025',
    weeklyDelta: 9,
    matches: 430,
    winRate: 0.54,
    streak: 2,
    bestStreak: 6,
    games: ['checkers', 'pong', 'puzzles'],
  },
  {
    id: 'priyan',
    username: 'priyan',
    displayName: 'Priya Nair',
    bio: 'Hosts the weekend lobby.',
    rating: 1860,
    level: 26,
    status: 'online',
    activity: 'Online',
    joined: 'Feb 2025',
    weeklyDelta: -6,
    matches: 398,
    winRate: 0.53,
    streak: 0,
    bestStreak: 6,
    games: ['party-pack', 'card-chaos', 'pong'],
  },
  {
    id: 'tsilva',
    username: 'tsilva',
    displayName: 'Tomás Silva',
    bio: 'Casual player, competitive trash talker.',
    rating: 1822,
    level: 24,
    status: 'offline',
    activity: 'Last seen 2h ago',
    joined: 'Mar 2025',
    weeklyDelta: 4,
    matches: 351,
    winRate: 0.52,
    streak: 0,
    bestStreak: 5,
    games: ['pong', 'checkers', 'chess'],
  },
  {
    id: 'omarh',
    username: 'omarh',
    displayName: 'Omar Haddad',
    bio: 'Here for the puzzles.',
    rating: 1790,
    level: 22,
    status: 'offline',
    activity: 'Last seen yesterday',
    joined: 'Apr 2025',
    weeklyDelta: -18,
    matches: 310,
    winRate: 0.5,
    streak: 0,
    bestStreak: 5,
    games: ['puzzles', 'chess', 'quiz-blitz'],
  },
  {
    id: 'chloem',
    username: 'chloem',
    displayName: 'Chloe Martin',
    bio: 'Snap Roulette menace.',
    rating: 1745,
    level: 20,
    status: 'online',
    activity: 'Online',
    joined: 'Apr 2025',
    weeklyDelta: 27,
    matches: 288,
    winRate: 0.49,
    streak: 2,
    bestStreak: 4,
    games: ['snap-roulette', 'card-chaos', 'pong'],
  },
  {
    id: 'jbrooks',
    username: 'jbrooks',
    displayName: 'Jamal Brooks',
    bio: 'Learning the ropes.',
    rating: 1698,
    level: 17,
    status: 'offline',
    activity: 'Last seen 5h ago',
    joined: 'May 2025',
    weeklyDelta: 11,
    matches: 214,
    winRate: 0.47,
    streak: 0,
    bestStreak: 4,
    games: ['pong', 'checkers'],
  },
  {
    id: 'sofiar',
    username: 'sofiar',
    displayName: 'Sofia Rossi',
    bio: 'Codewords spymaster.',
    rating: 1655,
    level: 15,
    status: 'away',
    activity: 'Away',
    joined: 'Jun 2025',
    weeklyDelta: -4,
    matches: 190,
    winRate: 0.46,
    streak: 0,
    bestStreak: 3,
    games: ['codewords', 'party-pack'],
  },
  {
    id: 'noahk',
    username: 'noahk',
    displayName: 'Noah Kim',
    bio: 'New here.',
    rating: 1612,
    level: 11,
    status: 'online',
    activity: 'Online',
    joined: 'Aug 2025',
    weeklyDelta: 19,
    matches: 132,
    winRate: 0.44,
    streak: 1,
    bestStreak: 3,
    games: ['pong', 'quiz-blitz'],
  },
]

function buildRatingHistory(seed: PlayerSeed, rand: () => number): number[] {
  const points = [seed.rating]
  for (let i = 1; i < 24; i += 1) {
    const previous = points[0]
    // Slight upward bias, so walking backwards from today tends downwards.
    points.unshift(Math.max(900, previous + Math.round((rand() - 0.46) * 38)))
  }
  return points
}

function buildPerGame(seed: PlayerSeed, rand: () => number): GameRecord[] {
  const weights = [0.52, 0.26, 0.14, 0.08]
  const used = weights.slice(0, seed.games.length)
  const total = used.reduce((sum, weight) => sum + weight, 0)
  return seed.games.map((gameId, index) => {
    const played = Math.round((seed.matches * used[index]) / total)
    const rate = Math.min(0.95, Math.max(0.2, seed.winRate + (rand() - 0.5) * 0.12))
    return { gameId, played, wins: Math.round(played * rate) }
  })
}

function buildPlayer(seed: PlayerSeed): Player {
  const rand = seededRandom(hashString(seed.id))
  const wins = Math.round(seed.matches * seed.winRate)
  const draws = Math.round(seed.matches * 0.02)
  const xpToNext = 1000 + seed.level * 60
  return {
    id: seed.id,
    username: seed.username,
    displayName: seed.displayName,
    bio: seed.bio,
    rating: seed.rating,
    level: seed.level,
    xp: Math.round(xpToNext * (0.2 + rand() * 0.7)),
    xpToNext,
    status: seed.status,
    activity: seed.activity,
    joinedLabel: seed.joined,
    weeklyDelta: seed.weeklyDelta,
    stats: {
      matches: seed.matches,
      wins,
      losses: seed.matches - wins - draws,
      draws,
      currentStreak: seed.streak,
      bestStreak: seed.bestStreak,
      ratingHistory: buildRatingHistory(seed, rand),
      perGame: buildPerGame(seed, rand),
    },
  }
}

export const players: Player[] = seeds.map(buildPlayer)

const byId = new Map(players.map((player) => [player.id, player]))
const byUsername = new Map(players.map((player) => [player.username, player]))

export function getPlayer(id: string): Player | undefined {
  return byId.get(id)
}

export function getPlayerByUsername(username: string): Player | undefined {
  return byUsername.get(username)
}

/** Total ranked players on the (fictional) platform. */
export const totalRanked = 12480

export function leaderboardAllTime(): Player[] {
  return [...players].sort((a, b) => b.rating - a.rating)
}

export function leaderboardWeekly(): Player[] {
  return [...players].sort((a, b) => b.weeklyDelta - a.weeklyDelta)
}

export function rankOf(id: string): number {
  return leaderboardAllTime().findIndex((player) => player.id === id) + 1
}

export const friendIds = ['aria', 'dvolkov', 'meitan', 'sreyes', 'zainab', 'priyan', 'tsilva', 'chloem', 'omarh']
export const friendRequestIds = ['jbrooks', 'sofiar']
