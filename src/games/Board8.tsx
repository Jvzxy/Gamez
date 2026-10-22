import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface SquareInfo {
  /** Spoken description, e.g. "e4, white knight" or "d5, empty". */
  label: string
  piece?: ReactNode
  selected?: boolean
  /** A square the selected piece can move to. */
  hint?: 'move' | 'capture'
  /** Part of the last move played. */
  last?: boolean
  /** A king that is in check. */
  danger?: boolean
  /** A piece that can be picked up right now. */
  movable?: boolean
}

interface Board8Props {
  label: string
  /** Engine square index for each of the 64 cells, row by row from the top left as displayed. */
  order: number[]
  /** Column labels in display order. */
  files: string[]
  /** Row labels from top to bottom. */
  ranks: string[]
  describe: (square: number) => SquareInfo
  onSquare: (square: number) => void
  /** Dims the board and ignores clicks. */
  inactive?: boolean
  children?: ReactNode
}

/**
 * A square-by-square 8x8 board shared by Chess and Checkers. It only draws:
 * rules live in the engines and the interaction state lives in the game.
 * Every square is a button, and arrow keys move between squares.
 */
export function Board8({ label, order, files, ranks, describe, onSquare, inactive, children }: Board8Props) {
  const [focusCell, setFocusCell] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    const delta = step[event.key]
    if (!delta) return
    event.preventDefault()
    const row = Math.min(7, Math.max(0, (focusCell >> 3) + delta[0]))
    const col = Math.min(7, Math.max(0, (focusCell & 7) + delta[1]))
    const next = row * 8 + col
    setFocusCell(next)
    gridRef.current?.querySelectorAll<HTMLButtonElement>('button[data-cell]')[next]?.focus()
  }

  return (
    <div className={`board8${inactive ? ' is-inactive' : ''}`}>
      <div ref={gridRef} className="board8__grid" role="group" aria-label={label} onKeyDown={move}>
        {order.map((square, cell) => {
          const row = cell >> 3
          const col = cell & 7
          const info = describe(square)
          const classes = [
            'sq',
            (row + col) % 2 === 1 ? 'sq--dark' : 'sq--light',
            info.selected ? 'is-selected' : '',
            info.last ? 'is-last' : '',
            info.danger ? 'is-danger' : '',
            info.movable ? 'is-movable' : '',
            info.hint ? `has-hint has-hint--${info.hint}` : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={square}
              type="button"
              data-cell={cell}
              className={classes}
              tabIndex={cell === focusCell ? 0 : -1}
              aria-label={info.label}
              aria-pressed={info.selected ? true : undefined}
              onFocus={() => setFocusCell(cell)}
              onClick={() => onSquare(square)}
            >
              {col === 0 ? (
                <span className="sq__rank" aria-hidden="true">
                  {ranks[row]}
                </span>
              ) : null}
              {row === 7 ? (
                <span className="sq__file" aria-hidden="true">
                  {files[col]}
                </span>
              ) : null}
              {info.piece}
              {info.hint ? <span className="sq__hint" aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
      {children}
    </div>
  )
}
