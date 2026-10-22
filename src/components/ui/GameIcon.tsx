import {
  Brush,
  Camera,
  Castle,
  CircleDot,
  Fingerprint,
  Globe,
  Lightbulb,
  PartyPopper,
  Puzzle,
  Spade,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import type { GameId } from '../../types'
import { PongIcon } from '../icons/PongIcon'

const icons: Record<Exclude<GameId, 'pong'>, LucideIcon> = {
  checkers: CircleDot,
  chess: Castle,
  'sketch-guess': Brush,
  'doodle-relay': Waypoints,
  codewords: Fingerprint,
  'party-pack': PartyPopper,
  'map-guess': Globe,
  'card-chaos': Spade,
  'snap-roulette': Camera,
  'quiz-blitz': Lightbulb,
  puzzles: Puzzle,
}

interface GameIconProps {
  gameId: GameId
  size?: number
}

export function GameIcon({ gameId, size = 20 }: GameIconProps) {
  if (gameId === 'pong') return <PongIcon size={size} />
  const Icon = icons[gameId]
  return <Icon size={size} aria-hidden="true" />
}

interface GameGlyphProps extends GameIconProps {
  hue: number
  /** Outer square size in px. */
  box?: number
}

/** Game icon in a rounded square tinted with the game's hue. */
export function GameGlyph({ gameId, hue, size = 20, box = 36 }: GameGlyphProps) {
  const style = { '--hue': hue, width: box, height: box } as CSSProperties
  return (
    <span className="game-glyph" style={style}>
      <GameIcon gameId={gameId} size={size} />
    </span>
  )
}
