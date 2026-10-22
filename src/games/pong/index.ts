import type { GameModule } from '../types'
import { PongPlay } from './PongPlay'

export const pongModule: GameModule = {
  id: 'pong',
  Play: PongPlay,
  setupFields: [
    {
      key: 'target',
      label: 'Play to',
      default: '7',
      choices: [
        { value: '5', label: '5 points', hint: 'Quick' },
        { value: '7', label: '7 points' },
        { value: '11', label: '11 points', hint: 'Classic' },
      ],
    },
  ],
  rules: [
    'Bounce the ball past the other paddle to score a point.',
    'Where the ball hits your paddle sets its angle: the edges send it sharply.',
    'The ball speeds up with every return, then resets after each point.',
    'The first player to reach the target score wins.',
  ],
  controls: [
    'Mouse or touch: move over the court (drag on touch) to steer your paddle.',
    'Keyboard: W / S or the up / down arrow keys.',
    'Two players on one device: left player uses W / S, right player uses the arrow keys. On a touch screen each player drags in their own half.',
  ],
  mySeat: () => 0,
  seatLabels: () => ['Left paddle', 'Right paddle'],
  formatLabel: (setup) => `First to ${setup.options.target ?? '7'}`,
  pausable: true,
}
