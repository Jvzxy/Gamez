// Game-level chess state: the position plus the history needed for notation,
// captured pieces and draw-by-repetition. Pure functions, no React.

import {
  applyMove,
  evaluateResult,
  findMove,
  legalMoves,
  positionKey,
  startPosition,
  toSan,
  type ChessResult,
  type Move,
  type Position,
} from './engine'

export interface PlayedMove {
  move: Move
  san: string
}

export interface ChessGame {
  pos: Position
  moves: PlayedMove[]
  /** How many times each position has occurred. */
  seen: ReadonlyMap<string, number>
  result: ChessResult
}

export function newGame(): ChessGame {
  const pos = startPosition()
  return { pos, moves: [], seen: new Map([[positionKey(pos), 1]]), result: { over: false } }
}

/** Plays a move if it is legal in the current position. Returns the same game object if it is not. */
export function playMove(game: ChessGame, move: Move): ChessGame {
  if (game.result.over) return game
  const legal = legalMoves(game.pos)
  const match = findMove(legal, move.from, move.to, move.promotion)
  if (!match) return game

  const san = toSan(game.pos, match, legal)
  const pos = applyMove(game.pos, match)
  const key = positionKey(pos)
  const seen = new Map(game.seen)
  seen.set(key, (seen.get(key) ?? 0) + 1)
  return {
    pos,
    moves: [...game.moves, { move: match, san }],
    seen,
    result: evaluateResult(pos, seen.get(key)),
  }
}

/** Pieces each side has captured, as unsigned piece types, in the order they were taken. */
export function capturedBy(game: ChessGame): { white: number[]; black: number[] } {
  const white: number[] = []
  const black: number[] = []
  for (const { move } of game.moves) {
    if (move.captured === 0) continue
    // A white piece moved, so white did the capturing.
    ;(move.piece > 0 ? white : black).push(Math.abs(move.captured))
  }
  const order = (a: number, b: number) => b - a
  return { white: white.sort(order), black: black.sort(order) }
}

const VALUES = [0, 1, 3, 3, 5, 9, 0]

/** Material lead in pawns for each side: positive means white is ahead. */
export function materialBalance(captured: { white: number[]; black: number[] }): number {
  const sum = (pieces: number[]) => pieces.reduce((total, type) => total + VALUES[type], 0)
  return sum(captured.white) - sum(captured.black)
}
