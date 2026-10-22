import { ArrowLeft, CircleDashed, ListChecks, Server, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GameGlyph } from '../../components/ui/GameIcon'
import { gamePlans } from '../../data/gamePlans'
import { games, playersLabel } from '../../data/games'
import type { Game, LiveMatch } from '../../types'

interface PlannedGameProps {
  game: Game
  /** Set when the person followed a sample live-match link for this game. */
  live?: LiveMatch
}

/** What a planned game's address shows: an honest plan, never a fake playground. */
export function PlannedGame({ game, live }: PlannedGameProps) {
  const plan = gamePlans[game.id]
  const playable = games.filter((candidate) => candidate.status === 'playable')

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
        <span className="badge badge--gold">
          <CircleDashed size={13} aria-hidden="true" />
          Planned, not playable yet
        </span>
      </div>

      <div className="planned">
        <section className="panel planned__hero" aria-labelledby="planned-title">
          <div className="panel__body">
            <h2 id="planned-title">{game.name} isn&rsquo;t built yet</h2>
            <p className="muted">
              {game.tagline} There is no gameplay for it in this project yet: no rules, no board and no playfield. This page lists what it needs, so it can be
              built on its own later without changing the rest of the platform.
            </p>
            {live ? (
              <p className="notice notice--warn">
                The live match you opened ({live.detail}) is sample data for the layout of the Home page. There is no real match to watch.
              </p>
            ) : null}
            {plan ? (
              <>
                <p className="planned__how">
                  <strong>How it plays.</strong> {plan.howItPlays}
                </p>
                <p className="faint">Modelled on {plan.inspiredBy}. Use your own name, words and artwork in the finished game.</p>
              </>
            ) : null}
          </div>
        </section>

        {plan ? (
          <div className="planned__grid">
            <section className="panel" aria-labelledby="needs-title">
              <div className="panel__head">
                <h2 className="panel__title" id="needs-title">
                  <ListChecks size={18} aria-hidden="true" />
                  What it needs
                </h2>
              </div>
              <ul className="panel__body planned__list">
                {plan.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
            </section>

            <section className="panel" aria-labelledby="first-title">
              <div className="panel__head">
                <h2 className="panel__title" id="first-title">
                  <Sparkles size={18} aria-hidden="true" />
                  Suggested first step
                </h2>
              </div>
              <div className="panel__body">
                <p>{plan.firstStep}</p>
                <p className="planned__server">
                  <Server size={16} aria-hidden="true" />
                  {plan.needsServer ? 'Needs a server for real multiplayer.' : 'Can start as a solo game with no server.'}
                </p>
              </div>
            </section>
          </div>
        ) : null}

        <section className="panel" aria-labelledby="try-title">
          <div className="panel__head">
            <h2 className="panel__title" id="try-title">
              Playable now
            </h2>
          </div>
          <div className="panel__body planned__try">
            {playable.map((candidate) => (
              <Link key={candidate.id} to={`/game/${candidate.id}`} className="btn btn--secondary">
                Play {candidate.name}
              </Link>
            ))}
            <Link to="/games" className="btn btn--ghost">
              Browse all games
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
