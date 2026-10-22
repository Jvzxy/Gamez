import type { GameId } from '../types'
import { checkersModule } from './checkers'
import { chessModule } from './chess'
import { pongModule } from './pong'
import type { PlayableGameId } from './playable'
import type { GameModule } from './types'

// The one place a new game is plugged in. Add its module here, add its id to
// playable.ts, and flip its status to 'playable' in data/games.ts.
// Typed as a full Record over PlayableGameId so TypeScript fails the build if
// playable.ts and this table drift apart.
const modules: Record<PlayableGameId, GameModule> = {
  pong: pongModule,
  checkers: checkersModule,
  chess: chessModule,
}

export function getGameModule(id: GameId): GameModule | undefined {
  return (modules as Partial<Record<GameId, GameModule>>)[id]
}
