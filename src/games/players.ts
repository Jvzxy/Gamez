import type { Difficulty } from './types'
import type { Player } from '../types'

// Synthetic participants for local play. They are not accounts: they have no
// profile page, no rating and no history, and the UI treats them that way.

const botRating: Record<Difficulty, number> = { easy: 800, medium: 1300, hard: 1800 }

const emptyStats = { matches: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, bestStreak: 0, ratingHistory: [], perGame: [] }

function synthetic(id: string, displayName: string, username: string, rating: number, activity: string): Player {
  return {
    id,
    username,
    displayName,
    bio: '',
    rating,
    level: 1,
    xp: 0,
    xpToNext: 1,
    status: 'online',
    activity,
    joinedLabel: '',
    weeklyDelta: 0,
    stats: emptyStats,
  }
}

export function isSynthetic(player: Player): boolean {
  return player.id.startsWith('bot-') || player.id.startsWith('guest-')
}

const difficultyName: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export function makeBot(difficulty: Difficulty, slot: number): Player {
  const names = ['Bolt', 'Pixel']
  return synthetic(`bot-${difficulty}-${slot}`, `${names[slot % 2]} (${difficultyName[difficulty]} bot)`, `bot_${difficulty}`, botRating[difficulty], 'Computer player')
}

export function makeGuest(): Player {
  return synthetic('guest-1', 'Guest', 'guest', 0, 'Playing on this device')
}

export function difficultyLabel(difficulty: Difficulty): string {
  return difficultyName[difficulty]
}
