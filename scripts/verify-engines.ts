// Rule tests for the game engines. No test framework needed:
//   npx tsx scripts/verify-engines.ts
// Exits with code 1 if anything fails.

import {
  applyMove,
  evaluateResult,
  findMove,
  isInCheck,
  legalMoves,
  parseFen,
  parseSan,
  perft,
  positionKey,
  squareFromName,
  startPosition,
  toFen,
  toSan,
  type Position,
} from '../src/games/chess/engine'
import * as ck from '../src/games/checkers/engine'
import * as chessBot from '../src/games/chess/bot'
import * as ckBot from '../src/games/checkers/bot'
import * as pong from '../src/games/pong/engine'
import { PongBot } from '../src/games/pong/bot'
import { seededRandom } from '../src/lib/format'
import { games } from '../src/data/games'
import { gamePlans } from '../src/data/gamePlans'
import { playableGameIds } from '../src/games/playable'
import type { Difficulty } from '../src/games/types'

let passed = 0
const failures: string[] = []
const section = (title: string) => console.log(`\n${title}`)

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++
    console.log(`  ok   ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name}${detail ? `  (${detail})` : ''}`)
  }
}

function equal<T>(name: string, actual: T, expected: T) {
  check(name, actual === expected, `expected ${String(expected)}, got ${String(actual)}`)
}

// ================================================================== chess
section('Chess: move generation (perft, published reference counts)')

const perftCases: Array<{ name: string; fen: string; counts: number[] }> = [
  { name: 'start position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', counts: [20, 400, 8902, 197281] },
  { name: 'Kiwipete (castling, pins, ep)', fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', counts: [48, 2039, 97862] },
  { name: 'rook endgame (ep + discovered check)', fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', counts: [14, 191, 2812, 43238] },
  { name: 'promotions and castling out of check', fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', counts: [6, 264, 9467] },
  { name: 'promotion with capture', fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', counts: [44, 1486, 62379] },
  { name: 'middlegame, many pieces', fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', counts: [46, 2079, 89890] },
]
for (const testCase of perftCases) {
  const pos = parseFen(testCase.fen)
  const before = toFen(pos)
  testCase.counts.forEach((expected, index) => {
    equal(`${testCase.name}, depth ${index + 1}`, perft(pos, index + 1), expected)
  })
  equal(`${testCase.name}: position restored after search`, toFen(pos), before)
}

section('Chess: FEN round trip')
for (const fen of ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R b Kq e3 4 12']) {
  equal(`round trip ${fen.slice(0, 20)}...`, toFen(parseFen(fen)), fen)
}

section('Chess: game results')
function playSan(pos: Position, moves: string): Position {
  let current = pos
  for (const text of moves.split(/\s+/).filter(Boolean)) {
    const move = parseSan(current, text)
    if (!move) throw new Error(`Illegal or unknown move "${text}" in ${toFen(current)}`)
    current = applyMove(current, move)
  }
  return current
}

const fools = playSan(startPosition(), 'f3 e5 g4 Qh4')
const foolsResult = evaluateResult(fools)
check("fool's mate is checkmate, black wins", foolsResult.over && foolsResult.kind === 'checkmate' && foolsResult.winner === -1)
check("fool's mate: white is in check", isInCheck(fools, 1))

const scholars = playSan(startPosition(), 'e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7')
const scholarsResult = evaluateResult(scholars)
check("scholar's mate is checkmate, white wins", scholarsResult.over && scholarsResult.kind === 'checkmate' && scholarsResult.winner === 1)

const stalemate = parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
const stalemateResult = evaluateResult(stalemate)
check('king and queen stalemate is a draw', stalemateResult.over && stalemateResult.kind === 'stalemate')
check('stalemated king is not in check', !isInCheck(stalemate, -1))

check('king vs king is insufficient material', (() => { const r = evaluateResult(parseFen('8/8/4k3/8/8/3K4/8/8 w - - 0 1')); return r.over && r.kind === 'insufficient' })())
check('king+bishop vs king is insufficient material', (() => { const r = evaluateResult(parseFen('8/8/4k3/8/8/3KB3/8/8 w - - 0 1')); return r.over && r.kind === 'insufficient' })())
check('king+rook vs king is NOT insufficient', !evaluateResult(parseFen('8/8/4k3/8/8/3KR3/8/8 w - - 0 1')).over)
check('fifty-move rule at 100 plies', (() => { const r = evaluateResult(parseFen('8/8/4k3/8/8/3KR3/8/8 w - - 100 80')); return r.over && r.kind === 'fifty' })())
check('threefold repetition is a draw', (() => { const r = evaluateResult(startPosition(), 3); return r.over && r.kind === 'repetition' })())

section('Chess: special moves')
{
  const pos = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
  const legal = legalMoves(pos)
  check('white can castle king side', legal.some((m) => toSan(pos, m, legal) === 'O-O'))
  check('white can castle queen side', legal.some((m) => toSan(pos, m, legal) === 'O-O-O'))
  const after = playSan(pos, 'O-O')
  equal('castling places king and rook', toFen(after).split(' ')[0], 'r3k2r/8/8/8/8/8/8/R4RK1')
  equal('castling removes white rights only', toFen(after).split(' ')[2], 'kq')
}
{
  const blocked = parseFen('r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1')
  const legal = legalMoves(blocked)
  check('cannot castle through an attacked square', !legal.some((m) => toSan(blocked, m, legal) === 'O-O'))
  const inCheck = parseFen('r3k2r/8/8/8/4r3/8/8/R3K2R w KQkq - 0 1')
  const legal2 = legalMoves(inCheck)
  check('cannot castle out of check', !legal2.some((m) => m.flags & (8 | 16)))
}
{
  const pos = parseFen('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3')
  const ep = findMove(legalMoves(pos), squareFromName('e5'), squareFromName('f6'))
  check('en passant capture is offered', Boolean(ep))
  if (ep) {
    const after = applyMove(pos, ep)
    equal('en passant removes the captured pawn', toFen(after).split(' ')[0], 'rnbqkbnr/ppp1p1pp/5P2/3p4/8/8/PPPP1PPP/RNBQKBNR')
  }
  const late = parseFen('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3')
  check('en passant is only available right after the double step', !findMove(legalMoves(late), squareFromName('e5'), squareFromName('f6')))
}
{
  const pos = parseFen('7k/P7/8/8/8/8/7K/8 w - - 0 1')
  const promos = legalMoves(pos).filter((m) => m.from === squareFromName('a7'))
  equal('a pawn on the 7th has four promotion choices', promos.length, 4)
  const sans = promos.map((m) => toSan(pos, m)).sort().join(' ')
  equal('promotions are notated =Q+ (checks along the 8th rank), =R+, =B, =N', sans, 'a8=B a8=N a8=Q+ a8=R+')
}
{
  // The pinned knight on e2 cannot move: it shields its king from the rook on e8.
  const pos = parseFen('4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1')
  check('a pinned piece cannot leave the pin line', !legalMoves(pos).some((m) => m.from === squareFromName('e2')))
}
{
  const pos = parseFen('4k3/8/8/8/8/8/3q4/4K3 w - - 0 1')
  const moves = legalMoves(pos)
  check('king may capture an undefended checking queen', moves.some((m) => m.from === squareFromName('e1') && m.to === squareFromName('d2')))
  equal('king in check has the right number of replies', moves.length, 2)
}
{
  const pos = parseFen('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
  const legal = legalMoves(pos)
  check('SAN disambiguates by file when two rooks can reach a square', (() => {
    const p = parseFen('4k3/8/8/8/8/8/4K3/R6R w - - 0 1')
    const l = legalMoves(p)
    return l.some((m) => toSan(p, m, l) === 'Rad1') && l.some((m) => toSan(p, m, l) === 'Rhd1')
  })())
  check('SAN disambiguates by rank when the files match', (() => {
    const p = parseFen('4k3/8/8/R7/8/8/4K3/R7 w - - 0 1')
    const l = legalMoves(p)
    return l.some((m) => toSan(p, m, l) === 'R1a3') && l.some((m) => toSan(p, m, l) === 'R5a3')
  })())
  check('SAN for a plain pawn push', legal.length > 0 && toSan(startPosition(), parseSan(startPosition(), 'e4')!) === 'e4')
}

// ================================================================ checkers
section('Checkers: move generation (perft, published English draughts counts)')
{
  const start = ck.startPosition()
  const expected = [7, 49, 302, 1469, 7361, 36768, 179740]
  expected.forEach((count, index) => equal(`start position, depth ${index + 1}`, ck.perft(start, index + 1), count))
}

section('Checkers: rules')
{
  const start = ck.startPosition()
  equal('both sides start with 12 men', `${ck.countPieces(start, 1).men}/${ck.countPieces(start, -1).men}`, '12/12')
  equal('red moves first', start.turn, 1)
  check('every piece starts on a dark square', Array.from(start.board).every((p, sq) => p === 0 || ck.isDark(sq)))
}
{
  // Red man at row 4, col 1 can jump the black man at row 3, col 2. A quiet move also exists, but jumping is compulsory.
  const pos = ck.positionFromRows(['........', '........', '........', '..b.....', '.r......', '........', '........', 'r.......'])
  const moves = ck.legalMoves(pos)
  check('a jump is compulsory: only capture moves are offered', moves.length > 0 && moves.every((m) => m.captures.length > 0))
}
{
  // Red man jumps two black men in a single turn and must finish the sequence.
  const pos = ck.positionFromRows(['........', '........', '..b.....', '........', '..b.....', '.r......', '........', '........'])
  const moves = ck.legalMoves(pos)
  equal('a double jump is offered as one move', moves.length, 1)
  equal('the double jump captures two pieces', moves[0].captures.length, 2)
  equal('the double jump ends on row 1, col 1', ck.destination(moves[0]), 1 * 8 + 1)
  equal('both captured pieces are removed', ck.countPieces(ck.applyMove(pos, moves[0]), -1).men, 0)
}
{
  // English draughts has no "take the most pieces" rule: any capture sequence is allowed.
  const pos = ck.positionFromRows(['........', '........', '........', '..b.b...', '...r....', '........', '........', '........'])
  equal('with two different single jumps available, both are legal', ck.legalMoves(pos).length, 2)
}
{
  const pos = ck.positionFromRows(['........', '..r.....', '........', '........', '........', '........', '........', '........'])
  const crowning = ck.legalMoves(pos).filter((m) => m.crowns)
  equal('a man one step from the far row has two crowning moves', crowning.length, 2)
  equal('a crowned man becomes a red king', ck.applyMove(pos, crowning[0]).board[ck.destination(crowning[0])], ck.RED_KING)
}
{
  // After jumping the b at row 1, col 2 the red man lands on row 0 and is crowned. A king could then jump the b at
  // row 1, col 4, but the rules end the move at crowning, so only one piece is captured.
  const pos = ck.positionFromRows(['........', '..b.b...', '.r......', '........', '........', '........', '........', '........'])
  const moves = ck.legalMoves(pos)
  equal('crowning ends the move: one move is offered', moves.length, 1)
  equal('it captures a single piece', moves[0].captures.length, 1)
  check('and the man is crowned', moves[0].crowns)
}
{
  // Red men move up the board, so a black man on the row below is "behind" a red man.
  const behind = ck.positionFromRows(['........', '........', '........', '..r.....', '...b....', '........', '........', '........'])
  check('a man cannot jump backwards', ck.legalMoves(behind).every((m) => m.captures.length === 0))
  const king = ck.positionFromRows(['........', '........', '........', '..R.....', '...b....', '........', '........', '........'])
  check('a king can jump backwards', ck.legalMoves(king).some((m) => m.captures.length === 1))
}
{
  // Black man in the corner is boxed in by two red men.
  const stuck = ck.positionFromRows(['b.......', '.r......', '..r.....', '........', '........', '........', '........', '........'], -1)
  const result = ck.evaluateResult(stuck)
  check('a side with no legal move loses', result.over && result.kind === 'no-moves' && result.winner === 1)
  const nothing = ck.positionFromRows(['........', '........', '........', '........', '........', '........', '........', 'r.......'], -1)
  const lost = ck.evaluateResult(nothing)
  check('a side with no pieces loses', lost.over && lost.kind === 'no-pieces' && lost.winner === 1)
}
{
  const quiet = ck.startPosition()
  quiet.quiet = 80
  const result = ck.evaluateResult(quiet)
  check('80 plies without progress is a draw', result.over && result.kind === 'quiet')
  const repeated = ck.evaluateResult(ck.startPosition(), 3)
  check('threefold repetition is a draw', repeated.over && repeated.kind === 'repetition')
}

// ================================================================ bots
section('Chess bot')
{
  const mateIn1 = parseFen('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1')
  const move = chessBot.chooseMove(mateIn1, { difficulty: 'hard', timeMs: 400 })
  check('hard bot finds a back-rank mate in one (Ra8#)', move !== null && toSan(mateIn1, move) === 'Ra8#', move ? toSan(mateIn1, move) : 'no move')

  const hanging = parseFen('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1')
  for (const difficulty of ['medium', 'hard'] as const) {
    const capture = chessBot.chooseMove(hanging, { difficulty, timeMs: 300, random: seededRandom(5) })
    check(`${difficulty} bot takes a free queen`, capture !== null && toSan(hanging, capture) === 'Rxd5', capture ? toSan(hanging, capture) : 'no move')
  }

  const before = toFen(startPosition())
  const start = startPosition()
  const started = performance.now()
  const opening = chessBot.chooseMove(start, { difficulty: 'hard' })
  const elapsed = performance.now() - started
  check('hard bot answers within its time budget (under 1.6 s)', elapsed < 1600, `${elapsed.toFixed(0)} ms`)
  check('the bot leaves the position it was given untouched', toFen(start) === before)
  check('the bot returns a legal move from the start position', opening !== null && Boolean(findMove(legalMoves(start), opening.from, opening.to, opening.promotion)))

  const checkmated = parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
  equal('the bot returns null when there is no legal move', chessBot.chooseMove(checkmated, { difficulty: 'hard' }), null)

  // Whole games: every move must be legal, games must end by the rules, and the stronger bot should do better.
  function playGame(white: Difficulty, black: Difficulty, seed: number): { result: string; plies: number; legal: boolean } {
    const random = seededRandom(seed)
    let pos = startPosition()
    const seen = new Map<string, number>([[positionKey(pos), 1]])
    let legal = true
    for (let ply = 0; ply < 300; ply++) {
      const move = chessBot.chooseMove(pos, { difficulty: pos.turn === 1 ? white : black, seen, timeMs: 40, random })
      if (!move) break
      if (!findMove(legalMoves(pos), move.from, move.to, move.promotion)) legal = false
      pos = applyMove(pos, move)
      const key = positionKey(pos)
      seen.set(key, (seen.get(key) ?? 0) + 1)
      const result = evaluateResult(pos, seen.get(key))
      if (result.over) return { result: result.kind === 'checkmate' ? (result.winner === 1 ? 'white' : 'black') : 'draw', plies: ply + 1, legal }
    }
    return { result: 'unfinished', plies: 300, legal }
  }
  let allLegal = true
  let strongScore = 0
  const games = 4
  const outcomes: string[] = []
  for (let i = 0; i < games; i++) {
    const asWhite = playGame('medium', 'easy', 10 + i)
    const asBlack = playGame('easy', 'medium', 20 + i)
    allLegal &&= asWhite.legal && asBlack.legal
    outcomes.push(`${asWhite.result}/${asBlack.result}`)
    if (asWhite.result === 'white') strongScore += 1
    else if (asWhite.result === 'draw' || asWhite.result === 'unfinished') strongScore += 0.5
    if (asBlack.result === 'black') strongScore += 1
    else if (asBlack.result === 'draw' || asBlack.result === 'unfinished') strongScore += 0.5
  }
  check('every move the bots play in whole games is legal', allLegal)
  check('the medium bot outscores the easy bot over 8 games', strongScore >= 5.5, `${strongScore}/8 (${outcomes.join(' ')})`)
}

section('Checkers bot')
{
  const start = ck.startPosition()
  const before = ck.positionKey(start)
  const t0 = performance.now()
  const opening = ckBot.chooseMove(start, { difficulty: 'hard' })
  const elapsed = performance.now() - t0
  check('hard bot answers within its time budget (under 1.4 s)', elapsed < 1400, `${elapsed.toFixed(0)} ms`)
  check('the bot leaves the position it was given untouched', ck.positionKey(start) === before)
  check('the bot returns a legal opening move', opening !== null && ck.legalMoves(start).some((m) => ck.moveLabel(m) === ck.moveLabel(opening)))
  const none = ck.positionFromRows(['b.......', '.r......', '..r.....', '........', '........', '........', '........', '........'], -1)
  equal('the bot returns null when it has no legal move', ckBot.chooseMove(none, { difficulty: 'hard' }), null)

  // A capture it must take: the only legal move is a jump, so the bot has to play it.
  const forced = ck.positionFromRows(['........', '........', '..b.....', '........', '..b.....', '.r......', '........', '........'])
  const jump = ckBot.chooseMove(forced, { difficulty: 'hard', timeMs: 100 })
  check('the bot plays the compulsory double jump', jump !== null && jump.captures.length === 2)

  function playGame(red: Difficulty, black: Difficulty, seed: number): { result: string; legal: boolean } {
    const random = seededRandom(seed)
    let pos = ck.startPosition()
    const seen = new Map<string, number>([[ck.positionKey(pos), 1]])
    let legal = true
    for (let ply = 0; ply < 400; ply++) {
      const move = ckBot.chooseMove(pos, { difficulty: pos.turn === 1 ? red : black, seen, timeMs: 25, random })
      if (!move) break
      if (!ck.legalMoves(pos).some((m) => ck.moveLabel(m) === ck.moveLabel(move))) legal = false
      pos = ck.applyMove(pos, move)
      const key = ck.positionKey(pos)
      seen.set(key, (seen.get(key) ?? 0) + 1)
      const result = ck.evaluateResult(pos, seen.get(key))
      if (result.over) return { result: result.winner === 1 ? 'red' : result.winner === -1 ? 'black' : 'draw', legal }
    }
    return { result: 'unfinished', legal }
  }
  let allLegal = true
  let strongScore = 0
  const games = 4
  const outcomes: string[] = []
  for (let i = 0; i < games; i++) {
    const asRed = playGame('hard', 'easy', 30 + i)
    const asBlack = playGame('easy', 'hard', 40 + i)
    allLegal &&= asRed.legal && asBlack.legal
    outcomes.push(`${asRed.result}/${asBlack.result}`)
    if (asRed.result === 'red') strongScore += 1
    else if (asRed.result === 'draw' || asRed.result === 'unfinished') strongScore += 0.5
    if (asBlack.result === 'black') strongScore += 1
    else if (asBlack.result === 'draw' || asBlack.result === 'unfinished') strongScore += 0.5
  }
  check('every move the bots play in whole games is legal', allLegal)
  check('the hard bot outscores the easy bot over 8 games', strongScore >= 6, `${strongScore}/8 (${outcomes.join(' ')})`)
}

// ==================================================================== pong
section('Pong: physics and rules')
const noInput: [pong.PaddleInput, pong.PaddleInput] = [pong.idleInput(), pong.idleInput()]
const stepsFor = (seconds: number) => Math.round(seconds / pong.STEP)

{
  const state = pong.createPong(5, seededRandom(1))
  let inBounds = true
  let walls = 0
  state.vx = 0 // keep the ball bouncing vertically only
  state.vy = 300
  state.serveTimer = 0
  for (let i = 0; i < stepsFor(10); i++) {
    walls += pong.stepPong(state, noInput, pong.STEP).filter((e) => e === 'wall').length
    if (state.y < pong.BALL_R - 1e-6 || state.y > pong.H - pong.BALL_R + 1e-6) inBounds = false
  }
  check('the ball never leaves the court vertically', inBounds)
  check('the ball bounces off the top and bottom walls', walls >= 4, `walls=${walls}`)
}
{
  // Ball heading right, right paddle parked out of the way: the left player scores and the ball is served back at the right player.
  const state = pong.createPong(5, seededRandom(2))
  state.serveTimer = 0
  state.x = 600
  state.y = 100
  state.vx = pong.BASE_SPEED
  state.vy = 0
  state.paddles = [pong.H / 2, pong.H - pong.HALF]
  let events: pong.PongEvent[] = []
  for (let i = 0; i < stepsFor(2) && !events.includes('point-left'); i++) events = pong.stepPong(state, noInput, pong.STEP, seededRandom(3))
  check('a missed ball gives the other side a point', events.includes('point-left') && state.scores[0] === 1 && state.scores[1] === 0)
  check('the ball is re-served towards the player who lost the point', state.vx > 0 && state.serveTimer > 0, `vx=${state.vx}`)
  equal('the ball waits at the centre during the serve delay', `${state.x},${state.y}`, `${pong.W / 2},${pong.H / 2}`)
}
{
  const state = pong.createPong(5, seededRandom(4))
  state.serveTimer = 0
  state.x = 600
  state.y = pong.H / 2
  state.vx = pong.BASE_SPEED
  state.vy = 0
  state.paddles = [pong.H / 2, pong.H / 2]
  let hit = false
  for (let i = 0; i < stepsFor(1) && !hit; i++) hit = pong.stepPong(state, noInput, pong.STEP).includes('hit')
  check('a paddle returns the ball', hit && state.vx < 0)
  check('the rally speeds the ball up by 4.5%', Math.abs(state.speed - pong.BASE_SPEED * 1.045) < 1e-6, `speed=${state.speed}`)
  equal('no point is scored on a return', state.scores[0] + state.scores[1], 0)
}
{
  // Top speed must not tunnel through the paddle (the ball moves ~6.5 px per step; the paddle plus ball is 28 px).
  const state = pong.createPong(5, seededRandom(5))
  state.serveTimer = 0
  state.x = 600
  state.y = pong.H / 2
  state.speed = pong.MAX_SPEED
  state.vx = pong.MAX_SPEED
  state.vy = 0
  state.paddles = [pong.H / 2, pong.H / 2]
  let hit = false
  for (let i = 0; i < stepsFor(1) && !hit; i++) hit = pong.stepPong(state, noInput, pong.STEP).includes('hit')
  check('a ball at maximum speed still cannot tunnel through a paddle', hit)
  let capped = true
  for (let i = 0; i < 40; i++) {
    state.x = 600
    state.vx = pong.MAX_SPEED
    state.y = pong.H / 2
    state.paddles = [pong.H / 2, pong.H / 2]
    for (let j = 0; j < stepsFor(0.4); j++) pong.stepPong(state, noInput, pong.STEP)
    if (state.speed > pong.MAX_SPEED + 1e-6) capped = false
  }
  check('ball speed is capped', capped)
}
{
  // Hitting off the paddle edge sends the ball at an angle; the centre sends it straight back.
  const edge = pong.createPong(5, seededRandom(6))
  edge.serveTimer = 0
  edge.x = 600
  edge.y = pong.H / 2 + pong.HALF
  edge.vx = pong.BASE_SPEED
  edge.vy = 0
  edge.paddles = [pong.H / 2, pong.H / 2]
  for (let i = 0; i < stepsFor(0.6); i++) pong.stepPong(edge, noInput, pong.STEP)
  check('hitting with the paddle edge deflects the ball downward', edge.vy > 50, `vy=${edge.vy}`)
}
{
  // Paddle controls: keyboard direction and pointer targets, both clamped to the court.
  const state = pong.createPong(5, seededRandom(7))
  state.serveTimer = 5
  const down: pong.PaddleInput = { dir: 1, targetY: null, speed: 1 }
  for (let i = 0; i < stepsFor(3); i++) pong.stepPong(state, [down, pong.idleInput()], pong.STEP)
  equal('holding down stops at the bottom wall', state.paddles[0], pong.H - pong.HALF)
  const pointer: pong.PaddleInput = { dir: 0, targetY: 120, speed: 1 }
  for (let i = 0; i < stepsFor(3); i++) pong.stepPong(state, [pointer, pong.idleInput()], pong.STEP)
  equal('a pointer target is reached', Math.round(state.paddles[0]), 120)
  const farTarget: pong.PaddleInput = { dir: 0, targetY: -500, speed: 1 }
  for (let i = 0; i < stepsFor(3); i++) pong.stepPong(state, [farTarget, pong.idleInput()], pong.STEP)
  equal('a target above the court is clamped at the top wall', state.paddles[0], pong.HALF)
  const slow = pong.createPong(5, seededRandom(8))
  slow.serveTimer = 5
  pong.stepPong(slow, [{ dir: 1, targetY: null, speed: 0.5 }, pong.idleInput()], 0.1)
  check('a speed handicap slows the paddle', Math.abs(slow.paddles[0] - (pong.H / 2 + pong.PADDLE_SPEED * 0.5 * 0.1)) < 1e-6)
}
{
  const state = pong.createPong(3, seededRandom(9))
  state.scores = [1, 2]
  state.serveTimer = 0
  state.x = 100
  state.y = 60
  state.vx = -pong.BASE_SPEED
  state.vy = 0
  state.paddles = [pong.H - pong.HALF, pong.H / 2]
  let events: pong.PongEvent[] = []
  for (let i = 0; i < stepsFor(2) && !events.includes('win'); i++) events = pong.stepPong(state, noInput, pong.STEP)
  check('reaching the target score ends the match', events.includes('win') && state.winner === 1 && state.scores[1] === 3)
  const frozen = JSON.stringify(state)
  for (let i = 0; i < 100; i++) pong.stepPong(state, noInput, pong.STEP)
  equal('nothing changes after the match is won', JSON.stringify(state), frozen)
}
{
  const state = pong.createPong(5, seededRandom(10))
  state.serveTimer = 0
  state.x = 400
  state.y = 90
  state.vx = pong.BASE_SPEED
  state.vy = 260
  const predicted = pong.predictY(state, 700)
  let landed = NaN
  state.paddles = [pong.HALF, pong.H - pong.HALF] // paddles far from the ball so nothing interferes before x = 700
  for (let i = 0; i < stepsFor(2); i++) {
    pong.stepPong(state, noInput, pong.STEP)
    if (state.x >= 700) {
      landed = state.y
      break
    }
  }
  check('the bot\'s ball prediction matches where the ball actually goes', Math.abs(predicted - landed) < 6, `predicted ${predicted.toFixed(1)}, actual ${landed.toFixed(1)}`)
}

section('Pong: bots play whole matches')
function playMatch(left: Difficulty, right: Difficulty, seed: number, target = 7): pong.PongState {
  const random = seededRandom(seed)
  const state = pong.createPong(target, random)
  const leftBot = new PongBot(0, left, random)
  const rightBot = new PongBot(1, right, random)
  for (let i = 0; i < stepsFor(900) && state.winner === null; i++) {
    pong.stepPong(state, [leftBot.think(state, pong.STEP), rightBot.think(state, pong.STEP)], pong.STEP, random)
  }
  return state
}
{
  let allFinished = true
  let valid = true
  let hardWins = 0
  const games = 12
  for (let seed = 1; seed <= games; seed++) {
    const asLeft = playMatch('hard', 'easy', seed)
    const asRight = playMatch('easy', 'hard', seed + 100)
    for (const result of [asLeft, asRight]) {
      if (result.winner === null) allFinished = false
      if (![result.x, result.y, result.vx, result.vy].every(Number.isFinite)) valid = false
    }
    if (asLeft.winner === 0) hardWins++
    if (asRight.winner === 1) hardWins++
  }
  check('every bot match finishes with a winner', allFinished)
  check('physics values stay finite through full matches', valid)
  check('the hard bot clearly beats the easy bot (at least 70% of matches)', hardWins >= games * 2 * 0.7, `${hardWins}/${games * 2}`)
  let mediumBeatsEasy = 0
  for (let seed = 1; seed <= games; seed++) if (playMatch('medium', 'easy', seed).winner === 0) mediumBeatsEasy++
  check('the medium bot usually beats the easy bot', mediumBeatsEasy >= games * 0.6, `${mediumBeatsEasy}/${games}`)
  const a = playMatch('medium', 'medium', 42)
  const b = playMatch('medium', 'medium', 42)
  equal('a seeded match is reproducible', `${a.scores}`, `${b.scores}`)

  // Regression: bots that never missed made Medium vs Medium and Hard vs Hard rallies last forever,
  // so a "watch bots" match never ended. Every pairing must finish, for several seeds.
  const levels: Difficulty[] = ['easy', 'medium', 'hard']
  const stuck: string[] = []
  for (const left of levels) {
    for (const right of levels) {
      for (let seed = 1; seed <= 8; seed++) {
        if (playMatch(left, right, seed * 31, 5).winner === null) stuck.push(`${left} vs ${right} (seed ${seed * 31})`)
      }
    }
  }
  check('every pairing of bot levels finishes a first-to-5 match within 15 minutes of game time', stuck.length === 0, stuck.join(', '))
  // Regression: a bot that kept its bad read between serves lost every point after its first miss (always 5-0).
  let competitive = 0
  for (let seed = 1; seed <= 20; seed++) if (Math.min(...playMatch('medium', 'medium', seed * 17, 5).scores) > 0) competitive++
  check('equal bots trade points instead of one side always winning 5-0', competitive >= 14, `${competitive}/20 matches had both sides score`)
  let hardBeatsMedium = 0
  for (let seed = 1; seed <= 40; seed++) {
    const asLeft = seed % 2 === 0
    const result = asLeft ? playMatch('hard', 'medium', seed * 53, 5) : playMatch('medium', 'hard', seed * 53, 5)
    if (result.winner === (asLeft ? 0 : 1)) hardBeatsMedium++
  }
  check('the hard bot beats the medium bot more often than not', hardBeatsMedium >= 24, `${hardBeatsMedium}/40`)
}

// ============================================================== catalog
section('Catalog: game status matches what is really implemented')
{
  const playableIds = new Set<string>(playableGameIds)
  const mismatched = games.filter((game) => (game.status === 'playable') !== playableIds.has(game.id)).map((game) => game.id)
  check('every game marked playable has a module, and every module is marked playable', mismatched.length === 0, mismatched.join(', '))
  equal('there are 12 catalog entries', games.length, 12)
  const planned = games.filter((game) => game.status === 'planned')
  check('every planned game has a written plan', planned.every((game) => gamePlans[game.id] !== undefined), planned.filter((g) => !gamePlans[g.id]).map((g) => g.id).join(', '))
  check('no playable game still has a plan entry', games.filter((game) => game.status === 'playable').every((game) => gamePlans[game.id] === undefined))
  equal('exactly pong, checkers and chess are playable', games.filter((game) => game.status === 'playable').map((game) => game.id).sort().join(','), 'checkers,chess,pong')
}

// ---------------------------------------------------------------- summary
console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) {
  console.log(`Failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`)
  process.exit(1)
}
