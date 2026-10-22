import { useEffect, useRef } from 'react'

interface BotTurnOptions<M> {
  /** True when it is a bot's turn and the match is still going. */
  active: boolean
  /** Pause before the bot answers, so its move is easy to follow. */
  delayMs: number
  /** Works out the bot's move. May take a while for strong bots. */
  choose: () => M | null
  /** Plays the chosen move. */
  play: (move: M) => void
  /** Changes whenever a new turn starts, so a fresh timer is scheduled. */
  turnKey: number
}

/**
 * Runs a bot's turn for turn-based games: wait a moment (so the UI can show
 * "thinking"), compute a move, play it. `choose` and `play` may change every
 * render; the latest versions are used when the timer fires.
 */
export function useBotTurn<M>({ active, delayMs, choose, play, turnKey }: BotTurnOptions<M>): void {
  const latest = useRef({ choose, play })
  useEffect(() => {
    latest.current = { choose, play }
  })

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => {
      const move = latest.current.choose()
      if (move) latest.current.play(move)
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [active, delayMs, turnKey])
}

/** Keeps the latest value of a callback in a ref so effects can call it without re-running. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
