// Checkers bot: negamax with alpha-beta pruning and iterative deepening under a
// time budget. Capturing is compulsory, which keeps the tree narrow, so "hard"
// searches deep enough to play a solid positional game. Runs on the main thread.

import type { Difficulty } from '../types'
import {
  applyMove,
  colOf,
  legalMoves,
  positionKey,
  rowOf,
  type Move,
  type Position,
} from './engine'

const WIN = 30000
const MAN = 100
const KING = 170

/** Static score from the point of view of the side to move, in centipawn-like units. */
export function evaluate(pos: Position): number {
  let score = 0
  for (let sq = 0; sq < 64; sq++) {
    const piece = pos.board[sq]
    if (piece === 0) continue
    const side = piece > 0 ? 1 : -1
    const row = rowOf(sq)
    const col = colOf(sq)
    let value: number
    if (Math.abs(piece) === 2) {
      value = KING
      // Kings are best kept off the edges, where they can be trapped.
      if (col > 1 && col < 6 && row > 1 && row < 6) value += 6
    } else {
      value = MAN
      // Reward advancing: red moves up the board (towards row 0), black down.
      const advance = side === 1 ? 7 - row : row
      value += advance * 3
      // Back-row men guard against enemy kings.
      if (advance === 0 && (col === 2 || col === 6 || col === 1 || col === 5)) value += 6
      // Centre control.
      if (col >= 2 && col <= 5 && row >= 2 && row <= 5) value += 3
      // Edge men are less flexible.
      if (col === 0 || col === 7) value -= 2
    }
    score += side === 1 ? value : -value
  }
  return pos.turn === 1 ? score : -score
}

interface SearchContext {
  deadline: number
  nodes: number
  aborted: boolean
}

function orderScore(move: Move): number {
  return move.captures.length * 10 + (move.crowns ? 5 : 0)
}

function search(pos: Position, depth: number, alpha: number, beta: number, ply: number, extensions: number, ctx: SearchContext): number {
  ctx.nodes++
  if ((ctx.nodes & 1023) === 0 && performance.now() > ctx.deadline) ctx.aborted = true
  if (ctx.aborted) return 0
  if (pos.quiet >= 80) return 0

  const moves = legalMoves(pos)
  if (moves.length === 0) return -WIN + ply
  // At the horizon, keep going while a capture is forced so we never stop mid-exchange.
  if (depth <= 0) {
    if (moves[0].captures.length === 0 || extensions >= 6) return evaluate(pos)
    depth = 1
    extensions++
  }

  moves.sort((a, b) => orderScore(b) - orderScore(a))
  let best = -Infinity
  for (const move of moves) {
    const score = -search(applyMove(pos, move), depth - 1, -beta, -alpha, ply + 1, extensions, ctx)
    if (ctx.aborted) return 0
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  return best
}

interface Profile {
  maxDepth: number
  timeMs: number
  noise: number
  randomMove: number
}

const profiles: Record<Difficulty, Profile> = {
  easy: { maxDepth: 2, timeMs: 150, noise: 70, randomMove: 0.2 },
  medium: { maxDepth: 5, timeMs: 400, noise: 8, randomMove: 0 },
  hard: { maxDepth: 14, timeMs: 900, noise: 0, randomMove: 0 },
}

export interface BotOptions {
  difficulty: Difficulty
  /** Times each position (by positionKey from engine.ts) has occurred so far, to avoid repeating. */
  seen?: ReadonlyMap<string, number>
  timeMs?: number
  random?: () => number
}

/** Picks a move for the side to move, or null if there is none. */
export function chooseMove(pos: Position, options: BotOptions): Move | null {
  const profile = profiles[options.difficulty]
  const random = options.random ?? Math.random
  const root = legalMoves(pos)
  if (root.length === 0) return null
  if (root.length === 1) return root[0]
  if (random() < profile.randomMove) return root[Math.floor(random() * root.length)]

  const ctx: SearchContext = { deadline: performance.now() + (options.timeMs ?? profile.timeMs), nodes: 0, aborted: false }
  root.sort((a, b) => orderScore(b) - orderScore(a))
  let ordered = root
  let best = root[0]

  for (let depth = 1; depth <= profile.maxDepth; depth++) {
    let alpha = -Infinity
    let iterationBest: Move | null = null
    let iterationScore = -Infinity
    const scored: Array<{ move: Move; score: number }> = []
    for (const move of ordered) {
      let score = -search(applyMove(pos, move), depth - 1, -Infinity, -alpha, 1, 0, ctx)
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
    if (Math.abs(iterationScore) > WIN - 100) break
    if (performance.now() > ctx.deadline) break
  }

  if (options.seen && options.seen.size > 0) {
    const repeats = (move: Move): boolean => (options.seen?.get(positionKey(applyMove(pos, move))) ?? 0) >= 2
    if (repeats(best) && evaluate(pos) > -30) {
      const alternative = ordered.find((move) => !repeats(move))
      if (alternative) best = alternative
    }
  }
  return best
}

