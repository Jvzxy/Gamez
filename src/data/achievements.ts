import {
  Compass,
  Crown,
  Eye,
  Flame,
  Flag,
  Medal,
  ShieldCheck,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { hashString } from '../lib/format'
import type { Rarity } from '../types'
import { currentUserId } from './players'

// SAMPLE DATA. Progress for the current user is hand-written; for other
// players it is derived from their id so profiles are stable.

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  rarity: Rarity
  target: number
  /** Progress for the current user. */
  progress: number
}

export interface Achievement extends AchievementDef {
  current: number
  unlocked: boolean
}

export const achievementDefs: AchievementDef[] = [
  { id: 'first-serve', name: 'First serve', description: 'Win your first match.', icon: Flag, rarity: 'common', target: 1, progress: 1 },
  { id: 'hot-streak', name: 'Hot streak', description: 'Win 5 matches in a row.', icon: Flame, rarity: 'rare', target: 5, progress: 5 },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Win 10 matches in a row.', icon: Zap, rarity: 'epic', target: 10, progress: 9 },
  { id: 'century', name: 'Centurion', description: 'Play 100 matches.', icon: Medal, rarity: 'common', target: 100, progress: 100 },
  { id: 'veteran', name: 'Veteran', description: 'Play 500 matches.', icon: Shield, rarity: 'rare', target: 500, progress: 412 },
  { id: 'top-ten', name: 'Top ten', description: 'Reach the top 10 of the global leaderboard.', icon: Trophy, rarity: 'epic', target: 1, progress: 1 },
  { id: 'champion', name: 'Number one', description: 'Reach rank 1 on the global leaderboard.', icon: Crown, rarity: 'legendary', target: 1, progress: 0 },
  { id: 'social', name: 'Social butterfly', description: 'Add 10 friends.', icon: Users, rarity: 'common', target: 10, progress: 9 },
  { id: 'front-row', name: 'Front row', description: 'Watch 25 live matches.', icon: Eye, rarity: 'common', target: 25, progress: 25 },
  { id: 'comeback', name: 'Comeback', description: 'Win a match after trailing by 5 or more points.', icon: Target, rarity: 'rare', target: 1, progress: 1 },
  { id: 'game-hopper', name: 'Game hopper', description: 'Play 5 different games.', icon: Compass, rarity: 'rare', target: 5, progress: 4 },
  { id: 'shutout', name: 'Shutout', description: 'Win a Ping Pong match 11–0.', icon: Sparkles, rarity: 'epic', target: 1, progress: 0 },
  { id: 'locked-in', name: 'Locked in', description: 'Turn on two-factor authentication.', icon: ShieldCheck, rarity: 'common', target: 1, progress: 0 },
]

/**
 * @param twoFactorEnabled lets the "Locked in" achievement follow the real
 *   2FA toggle in Settings for the current user.
 */
export function getAchievements(playerId: string, twoFactorEnabled: boolean): Achievement[] {
  return achievementDefs.map((def) => {
    if (def.id === 'locked-in' && playerId === currentUserId) {
      return { ...def, current: twoFactorEnabled ? 1 : 0, unlocked: twoFactorEnabled }
    }
    if (playerId === currentUserId) {
      return { ...def, current: def.progress, unlocked: def.progress >= def.target }
    }
    const roll = hashString(`${playerId}:${def.id}`) % 100
    const unlocked = def.rarity === 'legendary' ? false : roll < (def.rarity === 'common' ? 80 : def.rarity === 'rare' ? 55 : 30)
    const current = unlocked ? def.target : Math.floor((def.target * (roll % 70)) / 100)
    return { ...def, current, unlocked }
  })
}
