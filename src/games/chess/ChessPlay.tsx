import { FlipVertical2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Board8, type SquareInfo } from '../Board8'
import { useBotTurn, useLatest } from '../hooks'
import type { GamePlayProps } from '../types'
import { chooseMove } from './bot'
import { capturedBy, materialBalance, newGame, playMove } from './game'
import { BISHOP, KNIGHT, QUEEN, ROOK, isInCheck, legalMoves, resultReason, squareName, type Move } from './engine'

const GLYPHS = ['', '♟', '♞', '♝', '♜', '♛', '♚']
const NAMES = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT]

/** Filled glyphs for both colours; the variation selector (U+FE0E) asks for text, not emoji, rendering. */
function Piece({ type, white }: { type: number; white: boolean }) {
  return (
    <span className={`piece ${white ? 'piece--white' : 'piece--black'}`} aria-hidden="true">
      {GLYPHS[type]}
      {'︎'}
    </span>
  )
}

export function ChessPlay({ seats, setup, finished, onStatus, onFinish }: GamePlayProps) {
  const [game, setGame] = useState(newGame)
  const [selected, setSelected] = useState<number | null>(null)
  const [promotion, setPromotion] = useState<{ from: number; to: number } | null>(null)
  const humans = seats.filter((seat) => seat.kind === 'human')
  const [flipped, setFlipped] = useState(humans.length === 1 && humans[0].index === 1)
  const moveListRef = useRef<HTMLOListElement>(null)
  const callbacks = useLatest({ onStatus, onFinish })

  const { pos, result } = game
  const over = result.over || finished
  const seat = seats[pos.turn === 1 ? 0 : 1]
  const humanTurn = seat.kind === 'human' && !over
  const inCheck = isInCheck(pos, pos.turn)
  const legal = useMemo(() => legalMoves(pos), [pos])
  const lastMove = game.moves.length > 0 ? game.moves[game.moves.length - 1].move : null

  // Which squares hold a piece that can move, and where the selected piece may go.
  const movableFrom = useMemo(() => new Set(legal.map((move) => move.from)), [legal])
  const targets = useMemo(() => {
    const map = new Map<number, Move[]>()
    if (selected === null) return map
    for (const move of legal) if (move.from === selected) map.set(move.to, [...(map.get(move.to) ?? []), move])
    return map
  }, [legal, selected])

  useBotTurn({
    active: seat.kind === 'bot' && !over,
    delayMs: setup.mode === 'spectate' ? 650 : 400,
    turnKey: game.moves.length,
    choose: () => chooseMove(pos, { difficulty: seat.difficulty, seen: game.seen }),
    play: (move) => setGame((current) => playMove(current, move)),
  })

  // Report scoreboard text and the final outcome to the platform.
  const sideName = pos.turn === 1 ? 'White' : 'Black'
  const headline = result.over ? (result.kind === 'checkmate' ? 'Checkmate' : 'Draw') : `${sideName} to move`
  const detail = result.over ? resultReason(result).replace(/^(Checkmate|Draw): ?/, '') : inCheck ? 'Check!' : `Move ${pos.fullmove}`
  const activeSeat = result.over ? null : pos.turn === 1 ? 0 : 1
  useEffect(() => {
    callbacks.current.onStatus({ headline, detail, activeSeat })
  }, [callbacks, headline, detail, activeSeat])

  useEffect(() => {
    if (!result.over) return
    callbacks.current.onFinish({
      winnerSeat: result.winner === null ? null : result.winner === 1 ? 0 : 1,
      reason: resultReason(result),
      scoreText: `${Math.ceil(game.moves.length / 2)} moves`,
    })
  }, [callbacks, result, game.moves.length])

  useEffect(() => {
    const list = moveListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [game.moves.length])

  const play = (move: Move) => {
    setGame((current) => playMove(current, move))
    setSelected(null)
    setPromotion(null)
  }

  const onSquare = (square: number) => {
    if (!humanTurn || promotion) return
    if (selected !== null) {
      const options = targets.get(square)
      if (options && options.length === 1) return play(options[0])
      if (options && options.length > 1) return setPromotion({ from: selected, to: square })
    }
    setSelected(movableFrom.has(square) && square !== selected ? square : null)
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return
    setSelected(null)
    setPromotion(null)
  }

  const order = useMemo(
    () => Array.from({ length: 64 }, (_, cell) => (flipped ? (cell >> 3) * 8 + (7 - (cell & 7)) : (7 - (cell >> 3)) * 8 + (cell & 7))),
    [flipped],
  )
  const files = flipped ? [...FILES].reverse() : FILES
  const ranks = (flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(String)

  const describe = (square: number): SquareInfo => {
    const piece = pos.board[square]
    const type = Math.abs(piece)
    const options = targets.get(square)
    const hint = options ? (options[0].captured !== 0 ? 'capture' : 'move') : undefined
    const parts = [squareName(square), piece === 0 ? 'empty' : `${piece > 0 ? 'white' : 'black'} ${NAMES[type]}`]
    if (hint) parts.push(hint === 'capture' ? 'capture available' : 'legal move')
    if (square === selected) parts.push('selected')
    return {
      label: parts.join(', '),
      piece: piece === 0 ? undefined : <Piece type={type} white={piece > 0} />,
      selected: square === selected,
      hint,
      last: lastMove !== null && (square === lastMove.from || square === lastMove.to),
      danger: inCheck && piece === pos.turn * 6,
      movable: humanTurn && movableFrom.has(square),
    }
  }

  const captured = useMemo(() => capturedBy(game), [game])
  const balance = materialBalance(captured)

  let statusText: string
  if (finished && !result.over) statusText = 'Game over'
  else if (result.over) statusText = resultReason(result)
  else if (seat.kind === 'bot') statusText = `${seat.player.displayName} is thinking…`
  else if (setup.mode === 'bot') statusText = inCheck ? 'Check! Your move.' : 'Your move.'
  else statusText = inCheck ? `Check! ${sideName} to move.` : `${sideName} to move.`

  const rows: Array<{ number: number; white?: string; black?: string }> = []
  game.moves.forEach((entry, index) => {
    if (index % 2 === 0) rows.push({ number: index / 2 + 1, white: entry.san })
    else rows[rows.length - 1].black = entry.san
  })

  return (
    <div className="play-area" onKeyDown={cancelOnEscape}>
      <div className="play-area__board">
        <p className="board-status" role="status" aria-live="polite">
          <span className={`board-status__dot${seat.kind === 'bot' && !over ? ' is-thinking' : ''}`} aria-hidden="true" />
          {statusText}
        </p>
        <Board8
          label="Chess board"
          order={order}
          files={files}
          ranks={ranks}
          describe={describe}
          onSquare={onSquare}
          inactive={!humanTurn && !result.over}
        >
          {promotion ? (
            <div className="promo" role="group" aria-label="Choose a piece to promote to">
              <p className="promo__title">Promote to</p>
              <div className="promo__row">
                {PROMOTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="promo__btn"
                    aria-label={NAMES[type]}
                    onClick={() => {
                      const chosen = legal.find((move) => move.from === promotion.from && move.to === promotion.to && move.promotion === type)
                      if (chosen) play(chosen)
                    }}
                  >
                    <Piece type={type} white={pos.turn === 1} />
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPromotion(null)}>
                Cancel
              </button>
            </div>
          ) : null}
        </Board8>
        <div className="board-tools">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFlipped((value) => !value)}>
            <FlipVertical2 size={15} aria-hidden="true" />
            Flip board
          </button>
        </div>
      </div>

      <aside className="play-area__side" aria-label="Game record">
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Captured</h2>
            {balance !== 0 ? <span className="badge badge--p1">{balance > 0 ? `White +${balance}` : `Black +${-balance}`}</span> : <span className="badge">Even</span>}
          </div>
          <div className="panel__body captured">
            <p>
              <span className="captured__who">White took</span>
              <span className="captured__pieces">
                {captured.white.length > 0 ? captured.white.map((type, i) => <Piece key={i} type={type} white={false} />) : <span className="faint">nothing yet</span>}
              </span>
            </p>
            <p>
              <span className="captured__who">Black took</span>
              <span className="captured__pieces">
                {captured.black.length > 0 ? captured.black.map((type, i) => <Piece key={i} type={type} white />) : <span className="faint">nothing yet</span>}
              </span>
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Moves</h2>
            <span className="badge">{game.moves.length}</span>
          </div>
          {rows.length > 0 ? (
            <ol className="movelist" ref={moveListRef} aria-label="Moves played">
              {rows.map((row) => (
                <li key={row.number}>
                  <span className="movelist__n">{row.number}.</span>
                  <span>{row.white}</span>
                  <span>{row.black ?? ''}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="panel__body muted">No moves yet. White starts.</p>
          )}
        </section>
      </aside>
    </div>
  )
}
