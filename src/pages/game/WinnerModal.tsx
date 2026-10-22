import { Handshake, LayoutGrid, RotateCcw, Trophy, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { formatNumber, signed } from '../../lib/format'
import type { Game, Player } from '../../types'

export interface RatingChange {
  player: Player
  before: number
  delta: number
}

interface WinnerModalProps {
  open: boolean
  onClose: () => void
  onRematch: () => void
  /** Go back to the setup screen. */
  onNewSetup?: () => void
  game: Game
  /** The winner, or null for a draw. */
  winner: Player | null
  winnerIsMe: boolean
  /** Why the game ended, e.g. "Checkmate". */
  reason: string
  /** "11 – 9" or "34 moves". */
  scoreText?: string
  /** Rating before and after, for rated matches. Practice games leave this out. */
  ratingChanges?: RatingChange[]
  /** What to tell the person about whether this result was saved. */
  note: string
}

export function WinnerModal({ open, onClose, onRematch, onNewSetup, game, winner, winnerIsMe, reason, scoreText, ratingChanges, note }: WinnerModalProps) {
  const draw = winner === null
  return (
    <Modal open={open} onClose={onClose} label="Match result" size="sm">
      <div className="winner">
        <button type="button" className="btn btn--ghost btn--icon btn--sm winner__close" onClick={onClose} aria-label="Close result">
          <X size={16} aria-hidden="true" />
        </button>

        <span className={`winner__trophy${draw ? ' winner__trophy--draw' : ''}`}>
          {draw ? <Handshake size={34} aria-hidden="true" /> : <Trophy size={34} aria-hidden="true" />}
        </span>
        {winner ? <Avatar name={winner.displayName} seed={winner.id} size={64} /> : null}
        <h2 className="winner__title">{draw ? 'It’s a draw' : winnerIsMe ? 'You win!' : `${winner.displayName} wins`}</h2>
        <p className="muted">
          {reason}
          {scoreText ? `. Final: ${scoreText}.` : '.'}
          {` (${game.name})`}
        </p>

        {ratingChanges && ratingChanges.length > 0 ? (
          <ul className="winner__ratings">
            {ratingChanges.map((change) => (
              <li key={change.player.id}>
                <Avatar name={change.player.displayName} seed={change.player.id} size={28} />
                <span className="truncate">{change.player.id === 'me' ? 'You' : change.player.displayName}</span>
                <span className="faint">{formatNumber(change.before)}</span>
                <span className={`delta ${change.delta >= 0 ? 'delta--up' : 'delta--down'}`}>{signed(change.delta)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="winner__actions">
          <button type="button" className="btn btn--primary" onClick={onRematch}>
            <RotateCcw size={16} aria-hidden="true" />
            Rematch
          </button>
          {onNewSetup ? (
            <button type="button" className="btn btn--secondary" onClick={onNewSetup}>
              Change setup
            </button>
          ) : null}
          <Link to="/games" className="btn btn--ghost">
            <LayoutGrid size={16} aria-hidden="true" />
            All games
          </Link>
        </div>
        <p className="faint winner__note">{note}</p>
      </div>
    </Modal>
  )
}
