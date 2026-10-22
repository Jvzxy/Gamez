import type { GameId } from '../types'

/**
 * Games that have working gameplay. This list has no React in it so scripts and
 * tests can import it. It must match `status: 'playable'` in data/games.ts
 * (scripts/verify-engines.ts checks) and the modules in registry.ts (TypeScript checks).
 */
export const playableGameIds = ['pong', 'checkers', 'chess'] as const satisfies readonly GameId[]

export type PlayableGameId = (typeof playableGameIds)[number]
