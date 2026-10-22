// Game-level checkers state: position, history, repetition tracking and the
// move-selection helpers the board UI needs. Pure functions, no React.

import {
  applyMove,
  destination,
  evaluateResult,
  legalMoves,
  moveLabel,
  positionKey,
  startPosition,
  type CheckersResult,
  type Move,
  type Position,
} from './engine'

export interface PlayedMove {
  move: Move
  label: string
}

export interface CheckersGame {
  pos: Position
  moves: PlayedMove[]
  seen: ReadonlyMap<string, number>
  result: CheckersResult
}

export function newGame(): CheckersGame {
  const pos = startPosition()
  return { pos, moves: [], seen: new Map([[positionKey(pos), 1]]), result: { over: false } }
}

const samePath = (a: number[], b: number[]): boolean => a.length === b.length && a.every((sq, i) => sq === b[i])

/** Plays a move if it is legal in the current position. Returns the same game object if it is not. */
export function playMove(game: CheckersGame, move: Move): CheckersGame {
  if (game.result.over) return game
  const match = legalMoves(game.pos).find((candidate) => candidate.from === move.from && samePath(candidate.path, move.path))
  if (!match) return game
  const pos = applyMove(game.pos, match)
  const key = positionKey(pos)
  const seen = new Map(game.seen)
  seen.set(key, (seen.get(key) ?? 0) + 1)
  return {
    pos,
    moves: [...game.moves, { move: match, label: moveLabel(match) }],
    seen,
    result: evaluateResult(pos, seen.get(key)),
  }
}

export interface Selection {
  from: number
  /** Landing squares already chosen on the way through a multi-jump. */
  hops: number[]
}

/** The legal moves that start from `selection.from` and begin with the squares already hopped. */
export function movesMatching(legal: Move[], selection: Selection): Move[] {
  return legal.filter((move) => move.from === selection.from && selection.hops.every((sq, i) => move.path[i] === sq))
}

export type ClickOutcome =
  | { kind: 'play'; move: Move }
  | { kind: 'select'; selection: Selection }
  | { kind: 'clear' }

/**
 * Decides what clicking `square` does. Multi-jumps are entered one hop at a time,
 * like moving a real piece; clicking the final landing square directly also works
 * when only one move ends there.
 */
export function resolveClick(legal: Move[], selection: Selection | null, square: number): ClickOutcome {
  if (selection) {
    const candidates = movesMatching(legal, selection)
    const depth = selection.hops.length
    const next = candidates.filter((move) => move.path[depth] === square)
    if (next.length > 0) {
      const hops = [...selection.hops, square]
      const complete = next.find((move) => move.path.length === hops.length)
      if (complete) return { kind: 'play', move: complete }
      return { kind: 'select', selection: { from: selection.from, hops } }
    }
    const finals = candidates.filter((move) => destination(move) === square)
    if (finals.length === 1) return { kind: 'play', move: finals[0] }
  }
  if (legal.some((move) => move.from === square) && square !== selection?.from) {
    return { kind: 'select', selection: { from: square, hops: [] } }
  }
  return { kind: 'clear' }
}
