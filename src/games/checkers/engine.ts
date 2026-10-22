// Checkers (English / American draughts). Pure TypeScript, no React or DOM.
//
// Rules implemented:
//  - 8x8 board, play on the dark squares, 12 pieces each. Red moves first.
//  - Men move one square diagonally forward. Kings move one square diagonally either way.
//  - Capturing is compulsory. If you can jump, you must, and you must finish the
//    whole jump sequence. Men may only jump forward; kings jump both ways.
//  - A man that reaches the far row becomes a king and its move ends there, even
//    if more jumps would be available.
//  - You lose when it is your turn and you have no legal move.
//  - Draw after 80 plies (40 moves each) with no capture or man move, or on a
//    third repetition of a position (tracked by the UI).
//
// Squares are numbered row * 8 + col, with row 0 at the top (Black's side) and
// row 7 at the bottom (Red's side). Dark squares have (row + col) odd.

export type Side = 1 | -1 // 1 = Red, -1 = Black

export const RED_MAN = 1
export const RED_KING = 2
export const BLACK_MAN = -1
export const BLACK_KING = -2

export interface Position {
  board: Int8Array
  turn: Side
  /** Plies since the last capture or man move. */
  quiet: number
}

export interface Move {
  from: number
  /** Landing squares in order. One entry for a simple move, several for a multi-jump. */
  path: number[]
  /** Captured squares in order. Empty for a simple move. */
  captures: number[]
  /** True if the moving man is crowned at the end of this move. */
  crowns: boolean
}

export const rowOf = (sq: number): number => sq >> 3
export const colOf = (sq: number): number => sq & 7
export const isDark = (sq: number): boolean => ((sq >> 3) + (sq & 7)) % 2 === 1
export const destination = (move: Move): number => move.path[move.path.length - 1]

const DIAGONALS: Array<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

export function startPosition(): Position {
  const board = new Int8Array(64)
  for (let sq = 0; sq < 64; sq++) {
    if (!isDark(sq)) continue
    if (rowOf(sq) <= 2) board[sq] = BLACK_MAN
    else if (rowOf(sq) >= 5) board[sq] = RED_MAN
  }
  return { board, turn: 1, quiet: 0 }
}

export function clonePosition(pos: Position): Position {
  return { board: pos.board.slice(), turn: pos.turn, quiet: pos.quiet }
}

/** Builds a position from an 8-line picture. r/R = red man/king, b/B = black man/king, . = empty. */
export function positionFromRows(rows: string[], turn: Side = 1): Position {
  const board = new Int8Array(64)
  rows.forEach((row, r) => {
    const cells = row.replace(/\s+/g, '')
    for (let c = 0; c < 8; c++) {
      const ch = cells[c]
      board[r * 8 + c] = ch === 'r' ? RED_MAN : ch === 'R' ? RED_KING : ch === 'b' ? BLACK_MAN : ch === 'B' ? BLACK_KING : 0
    }
  })
  return { board, turn, quiet: 0 }
}

export function positionKey(pos: Position): string {
  let key = pos.turn === 1 ? 'R' : 'B'
  for (let i = 0; i < 64; i++) key += String.fromCharCode(pos.board[i] + 50)
  return key
}

/** Which row a man of this side must reach to be crowned. */
const crownRow = (side: Side): number => (side === 1 ? 0 : 7)

function jumpsFrom(board: Int8Array, origin: number, side: Side, out: Move[]) {
  const piece = board[origin]
  const isKing = Math.abs(piece) === 2
  const forward = side === 1 ? -1 : 1
  const path: number[] = []
  const captures: number[] = []

  // The moving piece leaves its square; captured pieces are lifted as they are jumped.
  board[origin] = 0

  const walk = (sq: number) => {
    let extended = false
    for (const [dr, dc] of DIAGONALS) {
      if (!isKing && dr !== forward) continue
      const r1 = rowOf(sq) + dr
      const c1 = colOf(sq) + dc
      const r2 = r1 + dr
      const c2 = c1 + dc
      if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue
      const over = r1 * 8 + c1
      const land = r2 * 8 + c2
      const target = board[over]
      if (target === 0 || target * side > 0 || board[land] !== 0) continue

      extended = true
      board[over] = 0
      path.push(land)
      captures.push(over)
      if (!isKing && r2 === crownRow(side)) {
        out.push({ from: origin, path: path.slice(), captures: captures.slice(), crowns: true })
      } else {
        walk(land)
      }
      path.pop()
      captures.pop()
      board[over] = target
    }
    if (!extended && path.length > 0) {
      out.push({ from: origin, path: path.slice(), captures: captures.slice(), crowns: false })
    }
  }

  walk(origin)
  board[origin] = piece
}

/** All legal moves for the side to move. Jumps are compulsory, so if any exist only jumps are returned. */
export function legalMoves(pos: Position): Move[] {
  const { board, turn } = pos
  const jumps: Move[] = []
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq] * turn > 0) jumpsFrom(board, sq, turn, jumps)
  }
  if (jumps.length > 0) return jumps

  const steps: Move[] = []
  const forward = turn === 1 ? -1 : 1
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq]
    if (piece * turn <= 0) continue
    const isKing = Math.abs(piece) === 2
    for (const [dr, dc] of DIAGONALS) {
      if (!isKing && dr !== forward) continue
      const r = rowOf(sq) + dr
      const c = colOf(sq) + dc
      if (r < 0 || r > 7 || c < 0 || c > 7) continue
      const to = r * 8 + c
      if (board[to] === 0) {
        steps.push({ from: sq, path: [to], captures: [], crowns: !isKing && r === crownRow(turn) })
      }
    }
  }
  return steps
}

/** Returns a new position with the move played. The input is not changed. */
export function applyMove(pos: Position, move: Move): Position {
  const board = pos.board.slice()
  const piece = board[move.from]
  board[move.from] = 0
  for (const sq of move.captures) board[sq] = 0
  board[destination(move)] = move.crowns ? piece * 2 : piece
  const quiet = move.captures.length > 0 || Math.abs(piece) === 1 ? 0 : pos.quiet + 1
  return { board, turn: (-pos.turn) as Side, quiet }
}

export function countPieces(pos: Position, side: Side): { men: number; kings: number } {
  let men = 0
  let kings = 0
  for (let sq = 0; sq < 64; sq++) {
    const piece = pos.board[sq]
    if (piece * side <= 0) continue
    if (Math.abs(piece) === 2) kings++
    else men++
  }
  return { men, kings }
}

/** Counts leaf nodes of the legal move tree (a whole jump sequence counts as one move). */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1
  const moves = legalMoves(pos)
  if (depth === 1) return moves.length
  let nodes = 0
  for (const move of moves) nodes += perft(applyMove(pos, move), depth - 1)
  return nodes
}

export type CheckersResult =
  | { over: false }
  | { over: true; kind: 'no-moves' | 'no-pieces'; winner: Side }
  | { over: true; kind: 'quiet' | 'repetition'; winner: null }

/** `seenCount` is how many times the current position has occurred so far (including now). */
export function evaluateResult(pos: Position, seenCount = 1): CheckersResult {
  const mine = countPieces(pos, pos.turn)
  if (mine.men + mine.kings === 0) return { over: true, kind: 'no-pieces', winner: (-pos.turn) as Side }
  if (legalMoves(pos).length === 0) return { over: true, kind: 'no-moves', winner: (-pos.turn) as Side }
  if (pos.quiet >= 80) return { over: true, kind: 'quiet', winner: null }
  if (seenCount >= 3) return { over: true, kind: 'repetition', winner: null }
  return { over: false }
}

export function resultReason(result: CheckersResult): string {
  if (!result.over) return ''
  switch (result.kind) {
    case 'no-pieces':
      return 'All of the opponent’s pieces were captured'
    case 'no-moves':
      return 'The opponent has no legal move'
    case 'quiet':
      return 'Draw: 40 moves each without a capture or a man moving'
    case 'repetition':
      return 'Draw: the same position occurred three times'
  }
}

/** Notation such as "22-18" or "22x15x8", counting dark squares 1 to 32 from Black's side. */
export function moveLabel(move: Move): string {
  const number = (sq: number) => {
    const r = rowOf(sq)
    return r * 4 + Math.floor(colOf(sq) / 2) + 1
  }
  const joiner = move.captures.length > 0 ? 'x' : '-'
  return [move.from, ...move.path].map(number).join(joiner)
}

export function squareLabel(sq: number): string {
  return `${'abcdefgh'[colOf(sq)]}${8 - rowOf(sq)}`
}
