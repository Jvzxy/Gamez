import { FlipVertical2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Board8, type SquareInfo } from '../Board8'
import { useBotTurn, useLatest } from '../hooks'
import type { GamePlayProps } from '../types'
import { chooseMove } from './bot'
import { countPieces, isDark, legalMoves, resultReason, squareLabel } from './engine'
import { movesMatching, newGame, playMove, resolveClick, type Selection } from './game'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function Checker({ side, king }: { side: 1 | -1; king: boolean }) {
  return (
    <span className={`checker ${side === 1 ? 'checker--red' : 'checker--black'}${king ? ' is-king' : ''}`} aria-hidden="true">
      {king ? <span className="checker__crown">♛{'︎'}</span> : null}
    </span>
  )
}

export function CheckersPlay({ seats, setup, finished, onStatus, onFinish }: GamePlayProps) {
  const [game, setGame] = useState(newGame)
  const [selection, setSelection] = useState<Selection | null>(null)
  const humans = seats.filter((seat) => seat.kind === 'human')
  // Seat 0 is Red and starts at the bottom; a lone human playing Black sees the board from their side.
  const [flipped, setFlipped] = useState(humans.length === 1 && humans[0].index === 1)
  const moveListRef = useRef<HTMLOListElement>(null)
  const callbacks = useLatest({ onStatus, onFinish })

  const { pos, result } = game
  const over = result.over || finished
  const seat = seats[pos.turn === 1 ? 0 : 1]
  const humanTurn = seat.kind === 'human' && !over
  const legal = useMemo(() => legalMoves(pos), [pos])
  const mustCapture = legal.length > 0 && legal[0].captures.length > 0
  const lastMove = game.moves.length > 0 ? game.moves[game.moves.length - 1].move : null

  const movableFrom = useMemo(() => new Set(legal.map((move) => move.from)), [legal])
  const candidates = useMemo(() => (selection ? movesMatching(legal, selection) : []), [legal, selection])
  // Squares the selected piece can reach next: the next landing of every matching move.
  const nextSquares = useMemo(() => {
    const map = new Map<number, boolean>()
    if (!selection) return map
    for (const move of candidates) map.set(move.path[selection.hops.length], move.captures.length > 0)
    return map
  }, [candidates, selection])

  useBotTurn({
    active: seat.kind === 'bot' && !over,
    delayMs: setup.mode === 'spectate' ? 650 : 450,
    turnKey: game.moves.length,
    choose: () => chooseMove(pos, { difficulty: seat.difficulty, seen: game.seen }),
    play: (move) => setGame((current) => playMove(current, move)),
  })

  const counts = { red: countPieces(pos, 1), black: countPieces(pos, -1) }
  const sideName = pos.turn === 1 ? 'Red' : 'Black'
  const headline = result.over ? (result.winner === null ? 'Draw' : `${result.winner === 1 ? 'Red' : 'Black'} wins`) : `${sideName} to move`
  const detail = result.over
    ? resultReason(result).replace(/^Draw: ?/, '')
    : mustCapture
      ? 'Capture is compulsory'
      : `Red ${counts.red.men + counts.red.kings}, Black ${counts.black.men + counts.black.kings}`
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

  const onSquare = (square: number) => {
    if (!humanTurn) return
    const outcome = resolveClick(legal, selection, square)
    if (outcome.kind === 'play') {
      setGame((current) => playMove(current, outcome.move))
      setSelection(null)
    } else if (outcome.kind === 'select') setSelection(outcome.selection)
    else setSelection(null)
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setSelection(null)
  }

  const order = useMemo(
    () => Array.from({ length: 64 }, (_, cell) => (flipped ? 63 - cell : cell)),
    [flipped],
  )
  const files = flipped ? [...FILES].reverse() : FILES
  const ranks = (flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(String)

  const describe = (square: number): SquareInfo => {
    const piece = pos.board[square]
    const isKing = Math.abs(piece) === 2
    const capture = nextSquares.get(square)
    const hint = capture === undefined ? undefined : capture ? 'capture' : 'move'
    const parts = [squareLabel(square)]
    if (!isDark(square)) parts.push('light square, not used')
    else if (piece === 0) parts.push('empty')
    else parts.push(`${piece > 0 ? 'red' : 'black'} ${isKing ? 'king' : 'man'}`)
    if (hint) parts.push(hint === 'capture' ? 'jump here' : 'legal move')
    if (selection?.from === square) parts.push('selected')
    const path = lastMove ? [lastMove.from, ...lastMove.path] : []
    return {
      label: parts.join(', '),
      piece: piece === 0 ? undefined : <Checker side={piece > 0 ? 1 : -1} king={isKing} />,
      selected: selection?.from === square || selection?.hops.includes(square),
      hint,
      last: path.includes(square),
      movable: humanTurn && !selection && movableFrom.has(square),
    }
  }

  let statusText: string
  if (finished && !result.over) statusText = 'Game over'
  else if (result.over) statusText = resultReason(result)
  else if (seat.kind === 'bot') statusText = `${seat.player.displayName} is thinking…`
  else if (setup.mode === 'bot') statusText = mustCapture ? 'Your move. You must jump.' : 'Your move.'
  else statusText = mustCapture ? `${sideName} to move. A jump is compulsory.` : `${sideName} to move.`

  return (
    <div className="play-area" onKeyDown={cancelOnEscape}>
      <div className="play-area__board">
        <p className="board-status" role="status" aria-live="polite">
          <span className={`board-status__dot${seat.kind === 'bot' && !over ? ' is-thinking' : ''}`} aria-hidden="true" />
          {statusText}
        </p>
        <Board8
          label="Checkers board"
          order={order}
          files={files}
          ranks={ranks}
          describe={describe}
          onSquare={onSquare}
          inactive={!humanTurn && !result.over}
        />
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
            <h2 className="panel__title">Pieces left</h2>
          </div>
          <dl className="panel__body tally">
            <div>
              <dt>
                <Checker side={1} king={false} /> Red
              </dt>
              <dd className="num">
                {counts.red.men + counts.red.kings}
                {counts.red.kings > 0 ? <span className="faint"> ({counts.red.kings} kings)</span> : null}
              </dd>
            </div>
            <div>
              <dt>
                <Checker side={-1} king={false} /> Black
              </dt>
              <dd className="num">
                {counts.black.men + counts.black.kings}
                {counts.black.kings > 0 ? <span className="faint"> ({counts.black.kings} kings)</span> : null}
              </dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Moves</h2>
            <span className="badge">{game.moves.length}</span>
          </div>
          {game.moves.length > 0 ? (
            <ol className="movelist movelist--single" ref={moveListRef} aria-label="Moves played">
              {game.moves.map((entry, index) => (
                <li key={index}>
                  <span className="movelist__n">{index + 1}.</span>
                  <span className={index % 2 === 0 ? 'movelist__red' : 'movelist__black'}>{entry.label}</span>
                  <span className="faint">{index % 2 === 0 ? 'Red' : 'Black'}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="panel__body muted">No moves yet. Red starts.</p>
          )}
        </section>
      </aside>
    </div>
  )
}
