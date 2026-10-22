import { ArrowRight, Bot, CircleDashed, Eye, Globe, Play, Server, Users } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GameGlyph } from '../../components/ui/GameIcon'
import { gamePlans } from '../../data/gamePlans'
import { gameCategories, games, playersLabel } from '../../data/games'
import { useDocumentTitle } from '../../lib/hooks'
import type { Game, GameCategory } from '../../types'
import './games.css'

type StatusFilter = 'all' | 'playable' | 'planned'

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'playable', label: 'Playable now' },
  { value: 'planned', label: 'Planned' },
]

function PlayableCard({ game }: { game: Game }) {
  return (
    <li className="gcard gcard--playable" style={{ '--hue': game.hue } as CSSProperties}>
      <div className="gcard__top">
        <GameGlyph gameId={game.id} hue={game.hue} size={26} box={52} />
        <span className="badge badge--ok">Playable now</span>
      </div>
      <h3 className="gcard__name">{game.name}</h3>
      <p className="gcard__tagline">{game.tagline}</p>
      <p className="gcard__meta">
        <span>{game.category}</span>
        <span aria-hidden="true">·</span>
        <span>{playersLabel(game)}</span>
      </p>
      <ul className="gcard__modes" aria-label="Ways to play">
        <li>
          <Bot size={14} aria-hidden="true" />
          Play a bot
        </li>
        <li>
          <Users size={14} aria-hidden="true" />
          Two players, one device
        </li>
        <li>
          <Eye size={14} aria-hidden="true" />
          Watch bots play
        </li>
        <li className="is-off">
          <Globe size={14} aria-hidden="true" />
          Online: needs a server
        </li>
      </ul>
      <Link to={`/game/${game.id}`} className="btn btn--primary gcard__cta">
        <Play size={16} aria-hidden="true" />
        Play {game.name}
      </Link>
    </li>
  )
}

function PlannedCard({ game }: { game: Game }) {
  const plan = gamePlans[game.id]
  return (
    <li className="gcard gcard--planned" style={{ '--hue': game.hue } as CSSProperties}>
      <div className="gcard__top">
        <GameGlyph gameId={game.id} hue={game.hue} size={26} box={52} />
        <span className="badge badge--gold">
          <CircleDashed size={12} aria-hidden="true" />
          Planned
        </span>
      </div>
      <h3 className="gcard__name">{game.name}</h3>
      <p className="gcard__tagline">{game.tagline}</p>
      <p className="gcard__meta">
        <span>{game.category}</span>
        <span aria-hidden="true">·</span>
        <span>{playersLabel(game)}</span>
      </p>
      <p className="gcard__status">Not playable yet. No gameplay is built for this game.</p>
      {plan ? (
        <p className="gcard__plan">
          <Server size={14} aria-hidden="true" />
          {plan.needsServer ? 'Needs a server for real multiplayer' : 'Could start as a solo game, no server needed'}
        </p>
      ) : null}
      <Link to={`/game/${game.id}`} className="btn btn--secondary gcard__cta">
        View plan
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </li>
  )
}

export function GamesCatalogPage() {
  useDocumentTitle('Games')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<'All' | GameCategory>('All')

  const matches = (game: Game) => category === 'All' || game.category === category
  const playable = games.filter((game) => game.status === 'playable' && matches(game))
  const planned = games.filter((game) => game.status === 'planned' && matches(game))
  const totalPlayable = games.filter((game) => game.status === 'playable').length
  const showPlayable = status !== 'planned'
  const showPlanned = status !== 'playable'
  const nothing = (showPlayable ? playable.length : 0) + (showPlanned ? planned.length : 0) === 0

  return (
    <div className="page catalog">
      <div className="page-head">
        <div>
          <h1>Games</h1>
          <p className="page-head__sub">
            {totalPlayable} of {games.length} games are playable today, against a bot or with two people on one device. The rest are planned: they&rsquo;re listed so the
            catalog is complete, but they have no gameplay yet.
          </p>
        </div>
      </div>

      <div className="catalog__filters">
        <div className="segmented" role="group" aria-label="Filter by status">
          {statusFilters.map((filter) => (
            <button key={filter.value} type="button" className="segmented__btn" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
        <div className="segmented-scroll">
          <div className="segmented" role="group" aria-label="Filter by category">
            {gameCategories.map((name) => (
              <button key={name} type="button" className="segmented__btn" aria-pressed={category === name} onClick={() => setCategory(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showPlayable && playable.length > 0 ? (
        <section aria-labelledby="playable-title" className="catalog__section">
          <div className="section-head">
            <h2 id="playable-title">Playable now</h2>
            <span className="badge badge--ok">{playable.length}</span>
          </div>
          <ul className="catalog__grid">
            {playable.map((game) => (
              <PlayableCard key={game.id} game={game} />
            ))}
          </ul>
        </section>
      ) : null}

      {showPlanned && planned.length > 0 ? (
        <section aria-labelledby="planned-title" className="catalog__section">
          <div className="section-head">
            <h2 id="planned-title">Planned</h2>
            <span className="badge badge--gold">{planned.length}</span>
          </div>
          <ul className="catalog__grid">
            {planned.map((game) => (
              <PlannedCard key={game.id} game={game} />
            ))}
          </ul>
        </section>
      ) : null}

      {nothing ? <p className="panel panel__body muted">No games match these filters.</p> : null}
    </div>
  )
}
