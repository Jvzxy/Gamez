import type { PresenceStatus } from '../types'

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** "+12", "−8" or "0" (with a real minus sign). */
export function signed(value: number): string {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function hueFor(seed: string): number {
  return hashString(seed) % 360
}

/** Small deterministic PRNG so sample data looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function presenceLabel(status: PresenceStatus): string {
  switch (status) {
    case 'online':
      return 'Online'
    case 'in-game':
      return 'In a game'
    case 'away':
      return 'Away'
    default:
      return 'Offline'
  }
}

/** Standard Elo adjustment for the winner; the loser loses the same amount. */
export function eloDelta(winnerRating: number, loserRating: number, k = 32): number {
  const expected = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400))
  return Math.max(1, Math.round(k * (1 - expected)))
}

export function clock(date = new Date()): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Turns what someone types into a valid channel name: lowercase letters, numbers and single hyphens. */
export function channelSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 24)
}
