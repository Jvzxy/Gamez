import type { GameModule } from '../types'
import { ChessPlay } from './ChessPlay'

export const chessModule: GameModule = {
  id: 'chess',
  Play: ChessPlay,
  setupFields: [
    {
      key: 'side',
      label: 'Your colour',
      default: 'white',
      modes: ['bot'],
      choices: [
        { value: 'white', label: 'White', hint: 'Moves first' },
        { value: 'black', label: 'Black' },
        { value: 'random', label: 'Random' },
      ],
    },
  ],
  rules: [
    'Checkmate the opposing king to win: it is attacked and has no escape.',
    'Castling, en passant and pawn promotion are all supported.',
    'A game is drawn by stalemate, by not having enough pieces to mate, after fifty moves without a capture or pawn move, or when a position occurs three times. Draws are applied automatically.',
    'There is no clock in this version.',
  ],
  controls: [
    'Click a piece, then click a highlighted square to move it. Click the piece again to put it down.',
    'Keyboard: Tab to the board, arrow keys to move between squares, Enter or Space to select.',
    'Escape cancels a selection.',
  ],
  mySeat: (setup) => (setup.options.side === 'black' ? 1 : 0),
  seatLabels: () => ['White', 'Black'],
  formatLabel: () => 'Standard rules, no clock',
  resignable: true,
}
