import { Check, Users } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GameGlyph, GameIcon } from '../../components/ui/GameIcon'
import { gameCategories, games, playersLabel } from '../../data/games'
import type { GameCategory, GameId } from '../../types'

export function GameSelector() {
  const [category, setCategory] = useState<'All' | GameCategory>('All')
  // Start on a game that can actually be played.
  const [selectedId, setSelectedId] = useState<GameId>('pong')

  const visible = games.filter((game) => category === 'All' || game.category === category)
  const selected = games.find((game) => game.id === selectedId) ?? games[0]

  return (
    <section aria-labelledby="games-title">
      <div className="section-head">
        <h2 id="games-title">Choose a game</h2>
        <div className="segmented-scroll">
          <div className="segmented" role="group" aria-label="Filter games by category">
            {gameCategories.map((name) => (
              <button
                key={name}
                type="button"
                className="segmented__btn"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="tiles">
        {visible.map((game) => {
          const isSelected = game.id === selectedId
          return (
            <li key={game.id}>
              <button
                type="button"
                className="tile"
                aria-pressed={isSelected}
                style={{ '--hue': game.hue } as CSSProperties}
                onClick={() => setSelectedId(game.id)}
              >
                <span className="tile__art">
                  <GameIcon gameId={game.id} size={38} />
                  {isSelected ? (
                    <span className="tile__check">
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : null}
                </span>
                <span className="tile__body">
                  <span className="tile__name">{game.name}</span>
                  <span className="tile__tagline">{game.tagline}</span>
                  <span className="tile__meta">
                    <Users size={14} aria-hidden="true" />
                    {playersLabel(game)}
                    {game.status === 'playable' ? <span className="badge badge--ok">Playable</span> : <span className="badge badge--gold">Planned</span>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="play-bar" style={{ '--hue': selected.hue } as CSSProperties} aria-live="polite">
        <GameGlyph gameId={selected.id} hue={selected.hue} size={24} box={48} />
        <div className="play-bar__text">
          <strong>{selected.name}</strong>
          <span className="muted">
            {selected.status === 'playable'
              ? 'Playable now: against a bot, with two players on one device, or watch two bots play.'
              : 'Planned. There is no gameplay for this one yet.'}
          </span>
        </div>
        {selected.status === 'playable' ? (
          <Link to={`/game/${selected.id}`} className="btn btn--primary">
            Play {selected.name}
          </Link>
        ) : (
          <Link to={`/game/${selected.id}`} className="btn btn--secondary">
            View plan
          </Link>
        )}
        <Link to="/games" className="btn btn--ghost">
          All games
        </Link>
      </div>
    </section>
  )
}
