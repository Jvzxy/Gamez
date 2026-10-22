import type { GameModule } from '../types'
import { CheckersPlay } from './CheckersPlay'

export const checkersModule: GameModule = {
  id: 'checkers',
  Play: CheckersPlay,
  setupFields: [
    {
      key: 'side',
      label: 'Your colour',
      default: 'red',
      modes: ['bot'],
      choices: [
        { value: 'red', label: 'Red', hint: 'Moves first' },
        { value: 'black', label: 'Black' },
        { value: 'random', label: 'Random' },
      ],
    },
  ],
  rules: [
    'Move one square diagonally forward on the dark squares. Kings move one square in any diagonal direction.',
    'Jump over an opposing piece to capture it. Jumping is compulsory, and you must finish a multi-jump.',
    'Men reaching the far row become kings. A man crowned during a jump stops there.',
    'You win when your opponent has no pieces or no legal move. Forty moves each without a capture or man move is a draw, as is a third repetition.',
  ],
  controls: [
    'Click a piece, then a highlighted square. For a multi-jump, click each landing square in turn.',
    'Keyboard: Tab to the board, arrow keys to move between squares, Enter or Space to select.',
    'Escape cancels a selection.',
  ],
  mySeat: (setup) => (setup.options.side === 'black' ? 1 : 0),
  seatLabels: () => ['Red', 'Black'],
  formatLabel: () => 'English draughts, 8×8',
  resignable: true,
}
