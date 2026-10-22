// A small chess engine: negamax with alpha-beta pruning, iterative deepening, a
// capture-only quiescence search and piece-square evaluation. It runs on the main
// thread under a time budget, so it is deliberately modest: "hard" plays sensible
// club-level chess, not like a modern engine.

import type { Difficulty } from '../types'
import {
  EMPTY,
  KING,
  PAWN,
  F_PROMO,
  generateMoves,
  isAttacked,
  isInCheck,
  legalMoves,
  makeMove,
  positionKey,
  unmakeMove,
  type Move,
  type Position,
  type Side,
} from './engine'

const MATE = 30000
const VALUE = [0, 100, 320, 330, 500, 900, 0]

// Piece-square tables, written the way a board looks (rank 8 first) from White's point of view.
const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5,
  10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
]
const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10,
  15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
]
const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10,
  10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
]
const PST_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
  0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
]
const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
]
const PST_KING_MID = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30,
  -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
]
const PST_KING_END = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30,
  -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
]

const PST: number[][] = [[], PST_PAWN, PST_KNIGHT, PST_BISHOP, PST_ROOK, PST_QUEEN, PST_KING_MID]

/** Static score in centipawns from the point of view of the side to move. */
export function evaluate(pos: Position): number {
  let score = 0
  let nonPawnMaterial = 0
  for (let sq = 0; sq < 64; sq++) {
    const piece = pos.board[sq]
    if (piece === EMPTY) continue
    const type = Math.abs(piece)
    if (type !== PAWN && type !== KING) nonPawnMaterial += VALUE[type]
  }
  const endgame = nonPawnMaterial <= 2600

  for (let sq = 0; sq < 64; sq++) {
    const piece = pos.board[sq]
    if (piece === EMPTY) continue
    const type = Math.abs(piece)
    const white = piece > 0
    const file = sq & 7
    const rank = sq >> 3
    const row = white ? 7 - rank : rank
    const table = type === KING && endgame ? PST_KING_END : PST[type]
    const value = VALUE[type] + table[row * 8 + file]
    score += white ? value : -value
  }
  return pos.turn === 1 ? score : -score
}

interface SearchContext {
  deadline: number
  nodes: number
  aborted: boolean
}

function orderScore(move: Move): number {
  let score = 0
  if (move.captured !== EMPTY) score += 10 * VALUE[Math.abs(move.captured)] - VALUE[Math.abs(move.piece)] / 10 + 1000
  if (move.flags & F_PROMO) score += VALUE[move.promotion] + 900
  return score
}

function quiesce(pos: Position, alpha: number, beta: number, ply: number, ctx: SearchContext): number {
  ctx.nodes++
  if ((ctx.nodes & 1023) === 0 && performance.now() > ctx.deadline) ctx.aborted = true
  if (ctx.aborted) return 0

  const standPat = evaluate(pos)
  if (standPat >= beta) return standPat
  if (ply >= 12) return standPat
  if (standPat > alpha) alpha = standPat

  const us = pos.turn
  const moves = generateMoves(pos, true).sort((a, b) => orderScore(b) - orderScore(a))
  for (const move of moves) {
    const undo = makeMove(pos, move)
    if (isAttacked(pos.board, pos.kings[us === 1 ? 0 : 1], (-us) as Side)) {
      unmakeMove(pos, move, undo)
      continue
    }
    const score = -quiesce(pos, -beta, -alpha, ply + 1, ctx)
    unmakeMove(pos, move, undo)
    if (ctx.aborted) return 0
    if (score >= beta) return score
    if (score > alpha) alpha = score
  }
  return alpha
}

function negamax(pos: Position, depth: number, alpha: number, beta: number, ply: number, ctx: SearchContext): number {
  ctx.nodes++
  if ((ctx.nodes & 1023) === 0 && performance.now() > ctx.deadline) ctx.aborted = true
  if (ctx.aborted) return 0
  if (pos.halfmove >= 100) return 0

  const us = pos.turn
  const inCheck = isInCheck(pos, us)
  if (inCheck && ply < 24) depth++
  if (depth <= 0) return quiesce(pos, alpha, beta, ply, ctx)

  const moves = generateMoves(pos).sort((a, b) => orderScore(b) - orderScore(a))
  let legalCount = 0
  let best = -Infinity
  for (const move of moves) {
    const undo = makeMove(pos, move)
    if (isAttacked(pos.board, pos.kings[us === 1 ? 0 : 1], (-us) as Side)) {
      unmakeMove(pos, move, undo)
      continue
    }
    legalCount++
    const score = -negamax(pos, depth - 1, -beta, -alpha, ply + 1, ctx)
    unmakeMove(pos, move, undo)
    if (ctx.aborted) return 0
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  if (legalCount === 0) return inCheck ? -MATE + ply : 0
  return best
}

interface Profile {
  maxDepth: number
  timeMs: number
  /** Random centipawns added to each root move, so weaker levels vary and blunder. */
  noise: number
  /** Chance of ignoring the search and playing a random legal move. */
  randomMove: number
}

const profiles: Record<Difficulty, Profile> = {
  easy: { maxDepth: 1, timeMs: 150, noise: 180, randomMove: 0.18 },
  medium: { maxDepth: 3, timeMs: 500, noise: 30, randomMove: 0 },
  hard: { maxDepth: 6, timeMs: 1000, noise: 0, randomMove: 0 },
}

export interface BotOptions {
  difficulty: Difficulty
  /** How many times each position has already occurred (keyed by positionKey from engine.ts). Lets the bot avoid repeating. */
  seen?: ReadonlyMap<string, number>
  /** Overrides the difficulty's time budget (tests use this). */
  timeMs?: number
  random?: () => number
}

/** Picks a move for the side to move, or null if there is none. */
export function chooseMove(position: Position, options: BotOptions): Move | null {
  const profile = profiles[options.difficulty]
  const random = options.random ?? Math.random
  // Work on a copy so the caller's position is never disturbed, even if a search is cut short.
  const pos: Position = { ...position, board: position.board.slice(), kings: [position.kings[0], position.kings[1]] }
  const root = legalMoves(pos)
  if (root.length === 0) return null
  if (root.length === 1) return root[0]
  if (random() < profile.randomMove) return root[Math.floor(random() * root.length)]

  const ctx: SearchContext = { deadline: performance.now() + (options.timeMs ?? profile.timeMs), nodes: 0, aborted: false }
  root.sort((a, b) => orderScore(b) - orderScore(a))
  let ordered = root
  let best: Move = root[0]

  for (let depth = 1; depth <= profile.maxDepth; depth++) {
    let alpha = -Infinity
    let iterationBest: Move | null = null
    let iterationScore = -Infinity
    const scored: Array<{ move: Move; score: number }> = []
    for (const move of ordered) {
      const undo = makeMove(pos, move)
      let score = -negamax(pos, depth - 1, -Infinity, -alpha, 1, ctx)
      unmakeMove(pos, move, undo)
      if (ctx.aborted) break
      if (profile.noise > 0) score += (random() * 2 - 1) * profile.noise
      scored.push({ move, score })
      if (score > iterationScore) {
        iterationScore = score
        iterationBest = move
      }
      if (profile.noise === 0 && score > alpha) alpha = score
    }
    if (ctx.aborted || !iterationBest) break
    best = iterationBest
    scored.sort((a, b) => b.score - a.score)
    ordered = scored.map((entry) => entry.move)
    if (iterationScore > MATE - 100) break
    if (performance.now() > ctx.deadline) break
  }

  // Never walk into a draw by repetition when the bot judges itself to be fine.
  if (options.seen && options.seen.size > 0) {
    const repeats = (move: Move): boolean => {
      const undo = makeMove(pos, move)
      const key = positionKey(pos)
      unmakeMove(pos, move, undo)
      return (options.seen?.get(key) ?? 0) >= 2
    }
    if (repeats(best)) {
      const alternative = ordered.find((move) => !repeats(move))
      if (alternative && evaluate(pos) > -50) best = alternative
    }
  }
  return best
}
