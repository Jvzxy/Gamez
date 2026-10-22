import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useLatest } from '../hooks'
import type { GamePlayProps, Seat } from '../types'
import { PongBot } from './bot'
import { H, STEP, W, createPong, scoreText, stepPong, type PaddleInput } from './engine'
import { drawPong, setupCanvas } from './render'

/** Which paddle each key moves, by play mode. */
const KEYS: Record<string, { seat: 0 | 1; dir: number }> = {
  w: { seat: 0, dir: -1 },
  s: { seat: 0, dir: 1 },
  ArrowUp: { seat: 1, dir: -1 },
  ArrowDown: { seat: 1, dir: 1 },
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function describeSeat(seat: Seat): string {
  return `${seat.label}: ${seat.player.displayName}`
}

export function PongPlay({ seats, setup, paused, finished, onStatus, onFinish }: GamePlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const live = useLatest({ seats, setup, paused, finished, onStatus, onFinish })
  // Where each paddle is being steered by pointer or touch, in court units. null means "not steered".
  const pointerTargets = useRef<[number | null, number | null]>([null, null])
  const held = useRef<Set<string>>(new Set())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas)
    if (!ctx) return

    const target = Number(live.current.setup.options.target ?? 7)
    const state = createPong(target)
    const bots = live.current.seats.map((seat, index) => (seat.kind === 'bot' ? new PongBot(index === 0 ? 0 : 1, seat.difficulty) : null))
    const report = () => {
      live.current.onStatus({ headline: scoreText(state), detail: `First to ${target}`, activeSeat: null, scores: [...state.scores] })
    }
    report()

    const inputFor = (seat: 0 | 1): PaddleInput => {
      const bot = bots[seat]
      if (bot) return bot.think(state, STEP)
      let dir = 0
      for (const key of held.current) {
        const binding = KEYS[key]
        if (!binding) continue
        // Against a bot the human may use either key pair. On a shared device each player has their own.
        if (live.current.setup.mode === 'bot' || binding.seat === seat) dir += binding.dir
      }
      if (dir !== 0) return { dir: Math.sign(dir), targetY: null, speed: 1 }
      return { dir: 0, targetY: pointerTargets.current[seat], speed: 1 }
    }

    let frame = 0
    let last = performance.now()
    let accumulator = 0
    let finishedReported = false

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const current = live.current
      if (!current.paused && !current.finished) {
        accumulator += dt
        while (accumulator >= STEP && state.winner === null) {
          accumulator -= STEP
          const events = stepPong(state, [inputFor(0), inputFor(1)], STEP)
          if (events.includes('point-left') || events.includes('point-right')) report()
          if (events.includes('win') && !finishedReported) {
            finishedReported = true
            const winner = state.winner ?? 0
            current.onFinish({ winnerSeat: winner, reason: `Reached ${state.target} points`, scoreText: scoreText(state) })
          }
        }
      }
      drawPong(ctx, state, { showScore: true })
      frame = requestAnimationFrame(tick)
    }

    drawPong(ctx, state, { showScore: true })
    frame = requestAnimationFrame(tick)

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (!(key in KEYS) || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (live.current.seats.every((seat) => seat.kind === 'bot')) return
      event.preventDefault()
      held.current.add(key)
      // Keys take over from a stale pointer position.
      pointerTargets.current = [null, null]
    }
    const onKeyUp = (event: KeyboardEvent) => {
      held.current.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key)
    }
    const onBlur = () => held.current.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [live])

  const steer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { seats: current, setup: currentSetup } = live.current
    if (current.every((seat) => seat.kind === 'bot')) return
    const rect = event.currentTarget.getBoundingClientRect()
    const y = ((event.clientY - rect.top) / rect.height) * H
    const x = ((event.clientX - rect.left) / rect.width) * W
    // Against a bot you steer the left paddle from anywhere. On a shared device each half of the court is one player's.
    const seat: 0 | 1 = currentSetup.mode === 'bot' ? 0 : x < W / 2 ? 0 : 1
    if (current[seat].kind === 'human') pointerTargets.current[seat] = y
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    held.current.clear()
    steer(event)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    // A mouse steers on hover. Touch and pen steer only while pressed.
    if (event.pointerType === 'mouse' || event.buttons > 0) steer(event)
  }

  const human = seats.filter((seat) => seat.kind === 'human')
  const label =
    human.length === 0
      ? `Ping Pong: ${describeSeat(seats[0])} against ${describeSeat(seats[1])}, played by bots`
      : `Ping Pong court. ${describeSeat(seats[0])}, ${describeSeat(seats[1])}. First to ${setup.options.target ?? 7} points wins.`

  return (
    <canvas
      ref={canvasRef}
      className="pong-canvas pong-canvas--play"
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    />
  )
}
