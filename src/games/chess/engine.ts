// Chess rules. Pure TypeScript, no React or DOM, so it can be tested in Node.
//
// Squares are numbered 0..63 with a1 = 0, b1 = 1, ... h1 = 7, a2 = 8, ... h8 = 63.
// Pieces are signed numbers: white positive, black negative, type = abs(value).

export const EMPTY = 0
export const PAWN = 1
export const KNIGHT = 2
export const BISHOP = 3
export const ROOK = 4
export const QUEEN = 5
export const KING = 6

export type Side = 1 | -1 // 1 = white, -1 = black

export const CASTLE_WK = 1
export const CASTLE_WQ = 2
export const CASTLE_BK = 4
export const CASTLE_BQ = 8

export const F_CAPTURE = 1
export const F_EP = 2
export const F_DOUBLE = 4
export const F_KCASTLE = 8
export const F_QCASTLE = 16
export const F_PROMO = 32

export interface Position {
  board: Int8Array
  turn: Side
  /** Bit set of CASTLE_* rights still available. */
  castling: number
  /** En passant target square, or -1. */
  ep: number
  /** Plies since the last capture or pawn move (fifty-move rule counter). */
  halfmove: number
  fullmove: number
  /** King squares: [white, black]. */
  kings: [number, number]
}

export interface Move {
  from: number
  to: number
  /** Signed piece that moves. */
  piece: number
  /** Signed captured piece, or 0. For en passant this is the captured pawn. */
  captured: number
  /** Unsigned promotion type (QUEEN, ROOK, BISHOP, KNIGHT), or 0. */
  promotion: number
  flags: number
}

export interface Undo {
  castling: number
  ep: number
  halfmove: number
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// ---------------------------------------------------------------- geometry

const fileOf = (sq: number): number => sq & 7
const rankOf = (sq: number): number => sq >> 3

export const squareName = (sq: number): string => `${'abcdefgh'[fileOf(sq)]}${rankOf(sq) + 1}`
export const squareFromName = (name: string): number => (name.charCodeAt(0) - 97) + (Number(name[1]) - 1) * 8

const DIRS: Array<[number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
]

const KNIGHT_JUMPS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
]

const KNIGHT_TARGETS: number[][] = []
const KING_TARGETS: number[][] = []
/** RAYS[sq][dir] lists the squares met travelling from sq in DIRS[dir]. */
const RAYS: number[][][] = []

for (let sq = 0; sq < 64; sq++) {
  const f = fileOf(sq)
  const r = rankOf(sq)
  KNIGHT_TARGETS.push(
    KNIGHT_JUMPS.map(([df, dr]) => [f + df, r + dr] as const)
      .filter(([nf, nr]) => nf >= 0 && nf < 8 && nr >= 0 && nr < 8)
      .map(([nf, nr]) => nr * 8 + nf),
  )
  KING_TARGETS.push(
    DIRS.map(([df, dr]) => [f + df, r + dr] as const)
      .filter(([nf, nr]) => nf >= 0 && nf < 8 && nr >= 0 && nr < 8)
      .map(([nf, nr]) => nr * 8 + nf),
  )
  RAYS.push(
    DIRS.map(([df, dr]) => {
      const ray: number[] = []
      let nf = f + df
      let nr = r + dr
      while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        ray.push(nr * 8 + nf)
        nf += df
        nr += dr
      }
      return ray
    }),
  )
}

/** Castling rights that survive a move touching each square. */
const CASTLE_KEEP = new Int8Array(64).fill(15)
CASTLE_KEEP[0] = 15 & ~CASTLE_WQ
CASTLE_KEEP[4] = 15 & ~(CASTLE_WK | CASTLE_WQ)
CASTLE_KEEP[7] = 15 & ~CASTLE_WK
CASTLE_KEEP[56] = 15 & ~CASTLE_BQ
CASTLE_KEEP[60] = 15 & ~(CASTLE_BK | CASTLE_BQ)
CASTLE_KEEP[63] = 15 & ~CASTLE_BK

// ------------------------------------------------------------------- FEN

const PIECE_LETTERS = '.PNBRQK'

export function parseFen(fen: string): Position {
  const [placement, turn = 'w', castle = '-', ep = '-', half = '0', full = '1'] = fen.trim().split(/\s+/)
  const board = new Int8Array(64)
  const kings: [number, number] = [-1, -1]
  const rows = placement.split('/')
  if (rows.length !== 8) throw new Error(`Bad FEN (needs 8 ranks): ${fen}`)
  rows.forEach((row, index) => {
    const rank = 7 - index
    let file = 0
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch)
        continue
      }
      const type = PIECE_LETTERS.indexOf(ch.toUpperCase())
      if (type < 1) throw new Error(`Bad FEN piece "${ch}": ${fen}`)
      const sq = rank * 8 + file
      const side = ch === ch.toUpperCase() ? 1 : -1
      board[sq] = side * type
      if (type === KING) kings[side === 1 ? 0 : 1] = sq
      file++
    }
    if (file !== 8) throw new Error(`Bad FEN rank width: ${fen}`)
  })
  if (kings[0] < 0 || kings[1] < 0) throw new Error(`Bad FEN (a king is missing): ${fen}`)
  let castling = 0
  if (castle.includes('K')) castling |= CASTLE_WK
  if (castle.includes('Q')) castling |= CASTLE_WQ
  if (castle.includes('k')) castling |= CASTLE_BK
  if (castle.includes('q')) castling |= CASTLE_BQ
  return {
    board,
    turn: turn === 'b' ? -1 : 1,
    castling,
    ep: ep === '-' ? -1 : squareFromName(ep),
    halfmove: Number(half),
    fullmove: Number(full),
    kings,
  }
}

export function toFen(pos: Position): string {
  const rows: string[] = []
  for (let rank = 7; rank >= 0; rank--) {
    let row = ''
    let gap = 0
    for (let file = 0; file < 8; file++) {
      const piece = pos.board[rank * 8 + file]
      if (piece === EMPTY) {
        gap++
        continue
      }
      if (gap) row += gap
      gap = 0
      const letter = PIECE_LETTERS[Math.abs(piece)]
      row += piece > 0 ? letter : letter.toLowerCase()
    }
    if (gap) row += gap
    rows.push(row)
  }
  let castle = ''
  if (pos.castling & CASTLE_WK) castle += 'K'
  if (pos.castling & CASTLE_WQ) castle += 'Q'
  if (pos.castling & CASTLE_BK) castle += 'k'
  if (pos.castling & CASTLE_BQ) castle += 'q'
  return `${rows.join('/')} ${pos.turn === 1 ? 'w' : 'b'} ${castle || '-'} ${pos.ep < 0 ? '-' : squareName(pos.ep)} ${pos.halfmove} ${pos.fullmove}`
}

export function startPosition(): Position {
  return parseFen(START_FEN)
}

export function clonePosition(pos: Position): Position {
  return {
    board: pos.board.slice(),
    turn: pos.turn,
    castling: pos.castling,
    ep: pos.ep,
    halfmove: pos.halfmove,
    fullmove: pos.fullmove,
    kings: [pos.kings[0], pos.kings[1]],
  }
}

/** Identity of a position for repetition counting: pieces, side to move, castling and en passant. */
export function positionKey(pos: Position): string {
  return toFen(pos).split(' ').slice(0, 4).join(' ')
}

// --------------------------------------------------------------- attacks

/** True if any piece of colour `by` attacks `sq`. */
export function isAttacked(board: Int8Array, sq: number, by: Side): boolean {
  const f = fileOf(sq)
  const r = rankOf(sq)

  // Pawns: a white pawn attacks diagonally upward, so it sits one rank below the target.
  const pawnRank = r - by
  if (pawnRank >= 0 && pawnRank < 8) {
    if (f > 0 && board[pawnRank * 8 + f - 1] === by * PAWN) return true
    if (f < 7 && board[pawnRank * 8 + f + 1] === by * PAWN) return true
  }

  const knight = by * KNIGHT
  for (const target of KNIGHT_TARGETS[sq]) if (board[target] === knight) return true

  const king = by * KING
  for (const target of KING_TARGETS[sq]) if (board[target] === king) return true

  const rays = RAYS[sq]
  for (let dir = 0; dir < 8; dir++) {
    const straight = dir < 4
    for (const target of rays[dir]) {
      const piece = board[target]
      if (piece === EMPTY) continue
      if (piece * by > 0) {
        const type = Math.abs(piece)
        if (type === QUEEN || (straight ? type === ROOK : type === BISHOP)) return true
      }
      break
    }
  }
  return false
}

export function isInCheck(pos: Position, side: Side): boolean {
  return isAttacked(pos.board, pos.kings[side === 1 ? 0 : 1], (-side) as Side)
}

// ------------------------------------------------------------ generation

const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT]

function pushMove(moves: Move[], from: number, to: number, piece: number, captured: number, flags: number) {
  moves.push({ from, to, piece, captured, promotion: 0, flags })
}

/**
 * Pseudo-legal moves: they follow piece movement rules but may leave the mover's
 * own king in check. Use legalMoves() when you need only fully legal moves.
 */
export function generateMoves(pos: Position, capturesOnly = false): Move[] {
  const moves: Move[] = []
  const { board, turn } = pos

  for (let from = 0; from < 64; from++) {
    const piece = board[from]
    if (piece === EMPTY || piece * turn < 0) continue
    const type = Math.abs(piece)
    const f = fileOf(from)
    const r = rankOf(from)

    if (type === PAWN) {
      const lastRank = turn === 1 ? 7 : 0
      const startRank = turn === 1 ? 1 : 6
      const forward = from + turn * 8
      const push = (to: number, captured: number, flags: number) => {
        if (rankOf(to) === lastRank) {
          for (const promotion of PROMOTIONS) {
            moves.push({ from, to, piece, captured, promotion, flags: flags | F_PROMO })
          }
        } else {
          pushMove(moves, from, to, piece, captured, flags)
        }
      }
      for (const df of [-1, 1]) {
        const nf = f + df
        if (nf < 0 || nf > 7) continue
        const to = forward + df
        const target = board[to]
        if (target !== EMPTY && target * turn < 0) push(to, target, F_CAPTURE)
        else if (to === pos.ep && target === EMPTY) push(to, -turn * PAWN, F_CAPTURE | F_EP)
      }
      if (!capturesOnly || rankOf(forward) === lastRank) {
        if (board[forward] === EMPTY) {
          push(forward, 0, 0)
          if (r === startRank && board[forward + turn * 8] === EMPTY) {
            pushMove(moves, from, forward + turn * 8, piece, 0, F_DOUBLE)
          }
        }
      }
      continue
    }

    if (type === KNIGHT || type === KING) {
      const targets = type === KNIGHT ? KNIGHT_TARGETS[from] : KING_TARGETS[from]
      for (const to of targets) {
        const target = board[to]
        if (target === EMPTY) {
          if (!capturesOnly) pushMove(moves, from, to, piece, 0, 0)
        } else if (target * turn < 0) {
          pushMove(moves, from, to, piece, target, F_CAPTURE)
        }
      }
      if (type === KING && !capturesOnly) generateCastling(pos, from, moves)
      continue
    }

    const startDir = type === BISHOP ? 4 : 0
    const endDir = type === ROOK ? 4 : 8
    for (let dir = startDir; dir < endDir; dir++) {
      for (const to of RAYS[from][dir]) {
        const target = board[to]
        if (target === EMPTY) {
          if (!capturesOnly) pushMove(moves, from, to, piece, 0, 0)
          continue
        }
        if (target * turn < 0) pushMove(moves, from, to, piece, target, F_CAPTURE)
        break
      }
    }
  }
  return moves
}

function generateCastling(pos: Position, from: number, moves: Move[]) {
  const { board, turn } = pos
  const home = turn === 1 ? 4 : 60
  if (from !== home) return
  const them = (-turn) as Side
  const kingRight = turn === 1 ? CASTLE_WK : CASTLE_BK
  const queenRight = turn === 1 ? CASTLE_WQ : CASTLE_BQ
  const king = turn * KING
  const rook = turn * ROOK
  if (!(pos.castling & (kingRight | queenRight))) return
  if (isAttacked(board, home, them)) return

  if (pos.castling & kingRight && board[home + 3] === rook && board[home + 1] === EMPTY && board[home + 2] === EMPTY) {
    if (!isAttacked(board, home + 1, them) && !isAttacked(board, home + 2, them)) {
      pushMove(moves, home, home + 2, king, 0, F_KCASTLE)
    }
  }
  if (
    pos.castling & queenRight &&
    board[home - 4] === rook &&
    board[home - 1] === EMPTY &&
    board[home - 2] === EMPTY &&
    board[home - 3] === EMPTY
  ) {
    if (!isAttacked(board, home - 1, them) && !isAttacked(board, home - 2, them)) {
      pushMove(moves, home, home - 2, king, 0, F_QCASTLE)
    }
  }
}

// ------------------------------------------------------------- make/undo

/** Plays a move on `pos` in place. Pair with unmakeMove() to restore it. */
export function makeMove(pos: Position, move: Move): Undo {
  const { board } = pos
  const us = pos.turn
  const undo: Undo = { castling: pos.castling, ep: pos.ep, halfmove: pos.halfmove }

  board[move.from] = EMPTY
  if (move.flags & F_EP) board[move.to - us * 8] = EMPTY
  board[move.to] = move.promotion ? us * move.promotion : move.piece

  if (move.flags & F_KCASTLE) {
    board[move.to + 1] = EMPTY
    board[move.to - 1] = us * ROOK
  } else if (move.flags & F_QCASTLE) {
    board[move.to - 2] = EMPTY
    board[move.to + 1] = us * ROOK
  }

  pos.castling &= CASTLE_KEEP[move.from] & CASTLE_KEEP[move.to]
  pos.ep = move.flags & F_DOUBLE ? move.from + us * 8 : -1
  pos.halfmove = Math.abs(move.piece) === PAWN || move.captured !== EMPTY ? 0 : pos.halfmove + 1
  if (Math.abs(move.piece) === KING) pos.kings[us === 1 ? 0 : 1] = move.to
  if (us === -1) pos.fullmove++
  pos.turn = (-us) as Side
  return undo
}

export function unmakeMove(pos: Position, move: Move, undo: Undo): void {
  const { board } = pos
  pos.turn = (-pos.turn) as Side
  const us = pos.turn
  pos.castling = undo.castling
  pos.ep = undo.ep
  pos.halfmove = undo.halfmove
  if (us === -1) pos.fullmove--

  board[move.from] = move.piece
  if (move.flags & F_EP) {
    board[move.to] = EMPTY
    board[move.to - us * 8] = -us * PAWN
  } else {
    board[move.to] = move.captured
  }

  if (move.flags & F_KCASTLE) {
    board[move.to - 1] = EMPTY
    board[move.to + 1] = us * ROOK
  } else if (move.flags & F_QCASTLE) {
    board[move.to + 1] = EMPTY
    board[move.to - 2] = us * ROOK
  }
  if (Math.abs(move.piece) === KING) pos.kings[us === 1 ? 0 : 1] = move.from
}

/** Returns a new position with the move played. The input is not changed. */
export function applyMove(pos: Position, move: Move): Position {
  const next = clonePosition(pos)
  makeMove(next, move)
  return next
}

/** Fully legal moves for the side to move. */
export function legalMoves(pos: Position): Move[] {
  const us = pos.turn
  const legal: Move[] = []
  for (const move of generateMoves(pos)) {
    const undo = makeMove(pos, move)
    if (!isAttacked(pos.board, pos.kings[us === 1 ? 0 : 1], (-us) as Side)) legal.push(move)
    unmakeMove(pos, move, undo)
  }
  return legal
}

/** Counts leaf nodes of the legal move tree. The standard way to test a move generator. */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1
  const us = pos.turn
  let nodes = 0
  for (const move of generateMoves(pos)) {
    const undo = makeMove(pos, move)
    if (!isAttacked(pos.board, pos.kings[us === 1 ? 0 : 1], (-us) as Side)) {
      nodes += depth === 1 ? 1 : perft(pos, depth - 1)
    }
    unmakeMove(pos, move, undo)
  }
  return nodes
}

// ------------------------------------------------------------ game state

export type ChessResult =
  | { over: false }
  | { over: true; kind: 'checkmate'; winner: Side }
  | { over: true; kind: 'stalemate' | 'insufficient' | 'fifty' | 'repetition'; winner: null }

export function hasInsufficientMaterial(pos: Position): boolean {
  const minors: Array<{ type: number; shade: number }> = []
  for (let sq = 0; sq < 64; sq++) {
    const type = Math.abs(pos.board[sq])
    if (type === EMPTY || type === KING) continue
    if (type === PAWN || type === ROOK || type === QUEEN) return false
    minors.push({ type, shade: (fileOf(sq) + rankOf(sq)) & 1 })
  }
  if (minors.length <= 1) return true
  // Only bishops, all on squares of one colour: neither side can ever mate.
  return minors.every((m) => m.type === BISHOP && m.shade === minors[0].shade)
}

/**
 * Works out whether the game is over. `seenCount` is how many times the current
 * position has occurred in the game so far (including now); pass 1 if unknown.
 * Draws by repetition and the fifty-move rule are applied automatically.
 */
export function evaluateResult(pos: Position, seenCount = 1): ChessResult {
  if (legalMoves(pos).length === 0) {
    return isInCheck(pos, pos.turn)
      ? { over: true, kind: 'checkmate', winner: (-pos.turn) as Side }
      : { over: true, kind: 'stalemate', winner: null }
  }
  if (hasInsufficientMaterial(pos)) return { over: true, kind: 'insufficient', winner: null }
  if (pos.halfmove >= 100) return { over: true, kind: 'fifty', winner: null }
  if (seenCount >= 3) return { over: true, kind: 'repetition', winner: null }
  return { over: false }
}

export function resultReason(result: ChessResult): string {
  if (!result.over) return ''
  switch (result.kind) {
    case 'checkmate':
      return 'Checkmate'
    case 'stalemate':
      return 'Stalemate: the side to move has no legal move and is not in check'
    case 'insufficient':
      return 'Draw: not enough pieces left to checkmate'
    case 'fifty':
      return 'Draw: fifty moves without a capture or pawn move'
    case 'repetition':
      return 'Draw: the same position occurred three times'
  }
}

// ----------------------------------------------------------------- notation

/** Standard algebraic notation for `move`, played from `pos` (which is not changed). */
export function toSan(pos: Position, move: Move, legal: Move[] = legalMoves(pos)): string {
  let san: string
  const type = Math.abs(move.piece)
  if (move.flags & F_KCASTLE) san = 'O-O'
  else if (move.flags & F_QCASTLE) san = 'O-O-O'
  else {
    const target = squareName(move.to)
    if (type === PAWN) {
      san = move.flags & F_CAPTURE ? `${'abcdefgh'[fileOf(move.from)]}x${target}` : target
      if (move.promotion) san += `=${PIECE_LETTERS[move.promotion]}`
    } else {
      const rivals = legal.filter((other) => other.to === move.to && other.piece === move.piece && other.from !== move.from)
      let disambiguation = ''
      if (rivals.length > 0) {
        const sameFile = rivals.some((other) => fileOf(other.from) === fileOf(move.from))
        const sameRank = rivals.some((other) => rankOf(other.from) === rankOf(move.from))
        if (!sameFile) disambiguation = 'abcdefgh'[fileOf(move.from)]
        else if (!sameRank) disambiguation = String(rankOf(move.from) + 1)
        else disambiguation = squareName(move.from)
      }
      san = `${PIECE_LETTERS[type]}${disambiguation}${move.flags & F_CAPTURE ? 'x' : ''}${target}`
    }
  }

  const probe = clonePosition(pos)
  makeMove(probe, move)
  if (isInCheck(probe, probe.turn)) san += legalMoves(probe).length === 0 ? '#' : '+'
  return san
}

/** Finds the legal move matching a from/to pair (and promotion type), or undefined. */
export function findMove(legal: Move[], from: number, to: number, promotion = 0): Move | undefined {
  return legal.find((move) => move.from === from && move.to === to && move.promotion === promotion)
}

/** Parses a move written in SAN against the position's legal moves. Used by tests. */
export function parseSan(pos: Position, text: string): Move | undefined {
  const legal = legalMoves(pos)
  const wanted = text.replace(/[+#?!]/g, '')
  return legal.find((move) => toSan(pos, move, legal).replace(/[+#]/g, '') === wanted)
}
