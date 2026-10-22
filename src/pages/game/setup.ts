import { makeBot, makeGuest } from '../../games/players'
import { difficulties, type GameModule, type GameSetup, type PlayMode, type Seat } from '../../games/types'
import type { Player } from '../../types'

export const modeLabels: Record<PlayMode, { title: string; hint: string }> = {
  bot: { title: 'Play a bot', hint: 'You against the computer.' },
  local: { title: 'Two players, one device', hint: 'Take turns, or play side by side.' },
  spectate: { title: 'Watch bots play', hint: 'Two bots play each other.' },
}

export function defaultSetup(module: GameModule, mode: PlayMode = 'bot'): GameSetup {
  const options: Record<string, string> = {}
  for (const field of module.setupFields) options[field.key] = field.default
  return { mode, difficulty: 'medium', options }
}

/** Turns "random" choices into real ones so the match has a fixed setup. */
export function resolveSetup(module: GameModule, setup: GameSetup, random: () => number = Math.random): GameSetup {
  const options = { ...setup.options }
  for (const field of module.setupFields) {
    if (options[field.key] !== 'random') continue
    const concrete = field.choices.filter((choice) => choice.value !== 'random')
    options[field.key] = concrete[Math.floor(random() * concrete.length)].value
  }
  return { ...setup, options }
}

interface SeatInputs {
  module: GameModule
  setup: GameSetup
  me: Player
  /** Players shown when spectating a sample live match, in seat order. */
  liveTwo?: Player[]
}

/** Fills each seat with a person or a bot according to the play mode. */
export function buildSeats({ module, setup, me, liveTwo }: SeatInputs): Seat[] {
  const labels = module.seatLabels(setup)
  const mine = module.mySeat(setup)
  return labels.map((label, index): Seat => {
    const base = { index, label, difficulty: setup.difficulty }
    if (setup.mode === 'spectate') {
      const player = liveTwo?.[index] ?? makeBot(setup.difficulty, index)
      return { ...base, player, kind: 'bot', isMe: false }
    }
    if (setup.mode === 'local') {
      return index === 0 ? { ...base, player: me, kind: 'human', isMe: true } : { ...base, player: makeGuest(), kind: 'human', isMe: false }
    }
    return index === mine
      ? { ...base, player: me, kind: 'human', isMe: true }
      : { ...base, player: makeBot(setup.difficulty, index), kind: 'bot', isMe: false }
  })
}

export const difficultyChoices = difficulties.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
  hint: { easy: 'Makes mistakes', medium: 'A fair game', hard: 'Plays carefully' }[value],
}))
