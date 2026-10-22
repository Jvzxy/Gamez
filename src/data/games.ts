import type { Game, GameCategory, GameId } from '../types'

// SAMPLE DATA. Titles are deliberately generic: the comments note which familiar
// game each one is modelled on, so you can rename them without trademark worries.
export const games: Game[] = [
  {
    id: 'pong',
    name: 'Ping Pong',
    tagline: 'Classic paddle duel. First to 5, 7 or 11 takes the match.',
    category: 'Arcade',
    minPlayers: 2,
    maxPlayers: 2,
    hue: 28,
    status: 'playable',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    tagline: 'Jump, capture and crown your way across the board.',
    category: 'Board',
    minPlayers: 2,
    maxPlayers: 2,
    hue: 8,
    status: 'playable',
  },
  {
    id: 'chess',
    name: 'Chess',
    tagline: 'Checkmate the other king. Castling and en passant included.',
    category: 'Board',
    minPlayers: 2,
    maxPlayers: 2,
    hue: 212,
    status: 'playable',
  },
  {
    // Modelled on: Skribbl.io / Sketchful.io
    id: 'sketch-guess',
    name: 'Sketch & Guess',
    tagline: 'One draws, everyone else races to guess the word.',
    category: 'Creative',
    minPlayers: 3,
    maxPlayers: 12,
    hue: 330,
    status: 'planned',
  },
  {
    // Modelled on: Gartic Phone
    id: 'doodle-relay',
    name: 'Doodle Relay',
    tagline: 'Draw it, describe it, redraw it. Watch the story drift.',
    category: 'Creative',
    minPlayers: 4,
    maxPlayers: 14,
    hue: 272,
    status: 'planned',
  },
  {
    // Modelled on: Codenames
    id: 'codewords',
    name: 'Codewords',
    tagline: 'Two teams, one-word clues, and a grid full of traps.',
    category: 'Party',
    minPlayers: 4,
    maxPlayers: 10,
    hue: 176,
    status: 'planned',
  },
  {
    // Modelled on: Jackbox Party Packs
    id: 'party-pack',
    name: 'Party Pack',
    tagline: 'A rotating set of short games for the whole room.',
    category: 'Party',
    minPlayers: 2,
    maxPlayers: 8,
    hue: 46,
    status: 'planned',
  },
  {
    // Modelled on: GeoGuessr
    id: 'map-guess',
    name: 'Map Guess',
    tagline: 'Dropped somewhere on Earth. Pin where you think you are.',
    category: 'Trivia',
    minPlayers: 1,
    maxPlayers: 8,
    hue: 148,
    status: 'planned',
  },
  {
    // Modelled on: Cards Against Humanity
    id: 'card-chaos',
    name: 'Wild Cards',
    tagline: 'Play the funniest card and let the judge decide.',
    category: 'Party',
    minPlayers: 3,
    maxPlayers: 10,
    hue: 350,
    status: 'planned',
  },
  {
    // Modelled on: Photo Roulette
    id: 'snap-roulette',
    name: 'Snap Roulette',
    tagline: 'A photo appears. Guess whose it is.',
    category: 'Party',
    minPlayers: 3,
    maxPlayers: 10,
    hue: 300,
    status: 'planned',
  },
  {
    // Modelled on: Kahoot
    id: 'quiz-blitz',
    name: 'Quiz Blitz',
    tagline: 'Fast multiple-choice rounds. Speed counts as much as being right.',
    category: 'Trivia',
    minPlayers: 2,
    maxPlayers: 50,
    hue: 252,
    status: 'planned',
  },
  {
    id: 'puzzles',
    name: 'Puzzles',
    tagline: 'Race a friend to finish the same puzzle first.',
    category: 'Puzzle',
    minPlayers: 1,
    maxPlayers: 4,
    hue: 194,
    status: 'planned',
  },
]

export const gameCategories: Array<'All' | GameCategory> = [
  'All',
  'Arcade',
  'Board',
  'Creative',
  'Party',
  'Trivia',
  'Puzzle',
]

const byId = new Map<string, Game>(games.map((game) => [game.id, game]))

export function getGame(id: string | undefined): Game | undefined {
  return id ? byId.get(id) : undefined
}

/** For data that must reference a game; throws loudly if the id is wrong. */
export function requireGame(id: GameId): Game {
  const game = byId.get(id)
  if (!game) throw new Error(`Unknown game id: ${id}`)
  return game
}

export function playersLabel(game: Game): string {
  return game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} players`
    : `${game.minPlayers}–${game.maxPlayers} players`
}
