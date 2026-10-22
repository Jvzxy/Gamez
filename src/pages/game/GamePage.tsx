import { ArrowLeft, Flag, Info, LogOut, Pause, Play as PlayIcon, RotateCcw, SearchX, Settings2, Trophy } from 'lucide-react'
import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { GameGlyph } from '../../components/ui/GameIcon'
import { getGame, playersLabel } from '../../data/games'
import { getLiveMatch } from '../../data/matches'
import { players as allPlayers } from '../../data/players'
import { getGameModule } from '../../games/registry'
import { difficultyLabel } from '../../games/players'
import type { GameModule, GameSetup, LiveStatus, MatchOutcome, Seat } from '../../games/types'
import { useDocumentTitle } from '../../lib/hooks'
import { useCurrentPlayer, usePlayerLookup } from '../../state/user'
import type { Game, LiveMatch, Player, PresenceStatus } from '../../types'
import { PlannedGame } from './PlannedGame'
import { PlayerCard } from './PlayerCard'
import { SetupPanel } from './SetupPanel'
import { SpectatorsPanel } from './SpectatorsPanel'
import { WinnerModal } from './WinnerModal'
import { buildSeats, defaultSetup, resolveSetup } from './setup'
import './game.css'

const presenceOrder: Record<PresenceStatus, number> = { online: 0, 'in-game': 1, away: 2, offline: 3 }

function isPlayer(value: Player | undefined): value is Player {
  return Boolean(value)
}

function MissingState({ title, children }: { title: string; children: string }) {
  return (
    <div className="page">
      <div className="panel">
        <EmptyState
          icon={SearchX}
          title={title}
          action={
            <Link to="/games" className="btn btn--primary">
              Browse games
            </Link>
          }
        >
          {children}
        </EmptyState>
      </div>
    </div>
  )
}

export function GamePage() {
  const { gameId, matchId } = useParams()
  const game = getGame(gameId)
  const live = matchId ? getLiveMatch(matchId) : undefined

  useDocumentTitle(game ? game.name : 'Game not found')

  if (!game) {
    return <MissingState title="Game not found">There is no game with that address. Pick one from the games list.</MissingState>
  }
  if (matchId && (!live || live.gameId !== game.id)) {
    return <MissingState title="This match isn't available">It may have ended, or the link is wrong. Sample live matches are listed on the Home page.</MissingState>
  }

  // A game is only playable when it is both marked playable and has a module registered.
  const module = game.status === 'playable' ? getGameModule(game.id) : undefined
  if (!module) return <PlannedGame key={game.id} game={game} live={live} />

  // Keyed so that switching game or match starts from a clean slate.
  return <PlayableGame key={`${game.id}/${matchId ?? 'practice'}`} game={game} module={module} live={live} />
}

interface MatchConfig {
  /** Changes for every new match so the playfield remounts from scratch. */
  id: number
  setup: GameSetup
  seats: Seat[]
}

interface PlayableGameProps {
  game: Game
  module: GameModule
  live?: LiveMatch
}

const modeBadge = {
  bot: 'Practice vs bot',
  local: 'Two players, one device',
  spectate: 'Bots playing',
} as const

function PlayableGame({ game, module, live }: PlayableGameProps) {
  const lookup = usePlayerLookup()
  const me = useCurrentPlayer()
  const liveTwo = useMemo(() => (live ? live.playerIds.slice(0, 2).map((id) => lookup(id)).filter(isPlayer) : undefined), [live, lookup])

  const [setup, setSetup] = useState<GameSetup>(() => defaultSetup(module, live ? 'spectate' : 'bot'))
  const [match, setMatch] = useState<MatchConfig | null>(() => {
    if (!live) return null
    const initial = defaultSetup(module, 'spectate')
    initial.difficulty = 'medium'
    return { id: 1, setup: initial, seats: buildSeats({ module, setup: initial, me, liveTwo }) }
  })

  const start = (choice: GameSetup) => {
    const resolved = resolveSetup(module, choice)
    setMatch((previous) => ({ id: (previous?.id ?? 0) + 1, setup: resolved, seats: buildSeats({ module, setup: resolved, me, liveTwo }) }))
  }

  // Sample audience only exists for sample live matches. Practice games are private.
  const pool = useMemo(
    () =>
      allPlayers
        .filter((person) => person.id !== 'me' && !(live?.playerIds ?? []).includes(person.id))
        .map((person) => lookup(person.id) ?? person)
        .sort((a, b) => presenceOrder[a.status] - presenceOrder[b.status]),
    [live, lookup],
  )
  const audience = live
    ? { spectators: [me, ...pool].slice(0, 12), total: live.spectators, meId: 'me', note: 'Sample data. These people aren’t really watching.' }
    : { spectators: [], total: 0, meId: undefined, note: undefined }
  const emptyText = 'Nobody is watching. Practice games are private, and sharing a match needs a server.'

  const badge = live ? (
    <span className="badge badge--gold">Sample match, simulated by bots</span>
  ) : match ? (
    <span className="badge badge--p2">{modeBadge[match.setup.mode]}</span>
  ) : (
    <span className="badge">Not started</span>
  )

  return (
    <div className="page game" style={{ '--hue': game.hue } as CSSProperties}>
      <div className="game-head">
        <Link to="/games" className="btn btn--ghost btn--icon btn--sm" aria-label="Back to all games">
          <ArrowLeft size={17} aria-hidden="true" />
        </Link>
        <GameGlyph gameId={game.id} hue={game.hue} size={22} box={44} />
        <div className="game-head__text">
          <h1>{game.name}</h1>
          <p className="muted">
            {game.category} game for {playersLabel(game)}
          </p>
        </div>
        {badge}
        <div className="game-head__actions">
          <Link to="/games" className="btn btn--ghost btn--sm">
            <LogOut size={15} aria-hidden="true" />
            {live ? 'Stop watching' : 'Leave'}
          </Link>
        </div>
      </div>

      {match ? (
        <MatchView
          key={match.id}
          game={game}
          module={module}
          match={match}
          live={live}
          audience={audience}
          emptyText={emptyText}
          onRematch={() => start(match.setup)}
          onNewSetup={live ? undefined : () => setMatch(null)}
        />
      ) : (
        <div className="game-grid">
          <div className="game-main">
            <SetupPanel module={module} setup={setup} onChange={setSetup} onStart={() => start(setup)} />
            <HowToPlay module={module} open />
          </div>
          <aside className="game-side" aria-label="Match sidebar">
            <SpectatorsPanel spectators={audience.spectators} total={audience.total} emptyText={emptyText} />
          </aside>
        </div>
      )}
    </div>
  )
}

function HowToPlay({ module, open }: { module: GameModule; open?: boolean }) {
  return (
    <details className="panel howto" open={open}>
      <summary className="panel__head howto__summary">
        <h2 className="panel__title">How to play</h2>
      </summary>
      <div className="panel__body howto__body">
        <div>
          <h3>Rules</h3>
          <ul>
            {module.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Controls</h3>
          <ul>
            {module.controls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  )
}

interface MatchViewProps {
  game: Game
  module: GameModule
  match: MatchConfig
  live?: LiveMatch
  audience: { spectators: Player[]; total: number; meId: string | undefined; note: string | undefined }
  emptyText: string
  onRematch: () => void
  onNewSetup?: () => void
}

function MatchView({ game, module, match, live, audience, emptyText, onRematch, onNewSetup }: MatchViewProps) {
  const { seats, setup } = match
  const [status, setStatus] = useState<LiveStatus | null>(null)
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null)
  const [paused, setPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [resigning, setResigning] = useState(false)

  const finished = outcome !== null
  const handleFinish = useCallback((result: MatchOutcome) => {
    setOutcome(result)
    setDismissed(false)
    setPaused(false)
  }, [])

  const Playfield = module.Play
  const isSpectate = setup.mode === 'spectate'
  const hasScores = Boolean(status?.scores)
  const winnerSeat = outcome && outcome.winnerSeat !== null ? seats[outcome.winnerSeat] : undefined

  // In a two-person game the side to move resigns; against a bot it is always the person.
  const mine = seats.find((seat) => seat.isMe)
  const resignSeat = setup.mode === 'local' ? seats[status?.activeSeat ?? 0] : mine
  const canResign = Boolean(module.resignable) && !isSpectate && !finished && resignSeat !== undefined

  const resign = () => {
    if (!resignSeat) return
    setResigning(false)
    const other = seats.find((seat) => seat.index !== resignSeat.index)
    setOutcome({ winnerSeat: other?.index ?? null, reason: `${resignSeat.label} resigned` })
    setDismissed(false)
  }

  const note = isSpectate
    ? 'Simulated match between bots. Nothing is saved.'
    : setup.mode === 'bot'
      ? 'Practice match against a bot. It isn’t rated and nothing is saved.'
      : 'Two-player match on this device. It isn’t rated and nothing is saved.'

  const modeText = {
    bot: `Practice vs ${difficultyLabel(setup.difficulty).toLowerCase()} bot`,
    local: 'Two players, one device',
    spectate: live ? 'Simulated by bots (sample match)' : 'Bots playing each other',
  }[setup.mode]

  const statusText = finished ? 'Finished' : paused ? 'Paused' : 'In progress'

  return (
    <div className="game-grid">
      <div className="game-main">
        <section className="scoreboard" aria-label="Players and score">
          <PlayerCard player={seats[0].player} isMe={seats[0].isMe} side="left" seat={seats[0]} active={status?.activeSeat === 0 && !finished} />
          <div className="scoreboard__mid">
            {hasScores && status?.scores ? (
              <p className="scoreboard__score" aria-label={`Score ${status.scores[0]} to ${status.scores[1]}`}>
                <span className="scoreboard__n scoreboard__n--left">{status.scores[0]}</span>
                <span className="scoreboard__sep" aria-hidden="true">
                  :
                </span>
                <span className="scoreboard__n scoreboard__n--right">{status.scores[1]}</span>
              </p>
            ) : (
              <p className="scoreboard__score scoreboard__score--text" aria-live="polite">
                {status?.headline ?? 'vs'}
              </p>
            )}
            <p className="faint scoreboard__sub">{status?.detail ?? module.formatLabel(setup)}</p>
          </div>
          <PlayerCard
            player={seats[1].player}
            isMe={seats[1].isMe}
            side="right"
            align="end"
            seat={seats[1]}
            active={status?.activeSeat === 1 && !finished}
          />
        </section>

        {isSpectate ? (
          <p className="notice">
            <Info size={16} aria-hidden="true" />
            <span>
              {live
                ? 'Simulated by bots. This is sample data, not the real match: there is no server to stream one.'
                : 'Two bots are playing each other. Nothing you do changes the game.'}
            </span>
          </p>
        ) : null}

        <div className="playfield">
          <Playfield seats={seats} setup={setup} paused={paused} finished={finished} onStatus={setStatus} onFinish={handleFinish} />
          {paused && !finished ? <span className="stage__paused">Paused</span> : null}
        </div>

        <div className="controls">
          {module.pausable && !finished ? (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setPaused((value) => !value)}>
              {paused ? <PlayIcon size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          {canResign ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setResigning(true)}>
              <Flag size={15} aria-hidden="true" />
              Resign
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRematch}>
            <RotateCcw size={15} aria-hidden="true" />
            {finished ? 'Play again' : 'Restart'}
          </button>
          {onNewSetup ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onNewSetup}>
              <Settings2 size={15} aria-hidden="true" />
              Change setup
            </button>
          ) : null}
          {finished && dismissed ? (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setDismissed(false)}>
              <Trophy size={15} aria-hidden="true" />
              Show result
            </button>
          ) : null}
        </div>

        <HowToPlay module={module} />
      </div>

      <aside className="game-side" aria-label="Match sidebar">
        <SpectatorsPanel
          spectators={audience.spectators}
          total={audience.total}
          meId={audience.meId}
          emptyText={emptyText}
          note={audience.note}
        />

        <section className="panel" aria-labelledby="details-title">
          <div className="panel__head">
            <h2 className="panel__title" id="details-title">
              Match details
            </h2>
          </div>
          <dl className="panel__body details">
            <div>
              <dt>Status</dt>
              <dd>{statusText}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{modeText}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{module.formatLabel(setup)}</dd>
            </div>
            <div>
              <dt>Now</dt>
              <dd>{status?.headline ?? 'Starting'}</dd>
            </div>
            <div>
              <dt>Your role</dt>
              <dd>{isSpectate ? 'Spectator' : setup.mode === 'local' ? 'Both players' : (mine?.label ?? 'Player')}</dd>
            </div>
            {live ? (
              <div>
                <dt>Sample match</dt>
                <dd>Started {live.startedMinutesAgo} minutes ago</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </aside>

      {outcome ? (
        <WinnerModal
          open={!dismissed}
          onClose={() => setDismissed(true)}
          onRematch={onRematch}
          onNewSetup={onNewSetup}
          game={game}
          winner={winnerSeat?.player ?? null}
          winnerIsMe={Boolean(winnerSeat?.isMe)}
          reason={outcome.reason}
          scoreText={outcome.scoreText}
          note={note}
        />
      ) : null}

      <Modal open={resigning} onClose={() => setResigning(false)} label="Resign this game" size="sm">
        <div className="resign">
          <h2>Resign this game?</h2>
          <p className="muted">
            {resignSeat ? `${resignSeat.label}` : 'You'} will lose, and the other side wins. This can&rsquo;t be undone.
          </p>
          <div className="resign__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setResigning(false)}>
              Keep playing
            </button>
            <button type="button" className="btn btn--danger" onClick={resign}>
              Resign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
