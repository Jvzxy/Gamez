import { Eye, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PongCanvas } from '../../components/pong/PongCanvas'
import { liveMatches } from '../../data/matches'
import { rankOf, totalRanked } from '../../data/players'
import { formatNumber } from '../../lib/format'
import { usePrefersReducedMotion } from '../../lib/hooks'
import { useCurrentPlayer, usePlayerLookup } from '../../state/user'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomeHero() {
  const me = useCurrentPlayer()
  const lookup = usePlayerLookup()
  const reducedMotion = usePrefersReducedMotion()

  const featured = [...liveMatches].filter((match) => match.gameId === 'pong').sort((a, b) => b.spectators - a.spectators)[0]
  const [first, second] = featured ? featured.playerIds.map((id) => lookup(id)) : []
  const streak = me.stats.currentStreak

  return (
    <section className="hero" aria-labelledby="home-title">
      <div className="hero__stage" aria-hidden="true">
        <PongCanvas
          running={!reducedMotion}
          transparent
          label="Demo Pong rally, not a live match"
        />
      </div>

      <div className="hero__copy">
        <h1 id="home-title">
          {greeting()}, {me.displayName.split(' ')[0]}
        </h1>
        <p className="hero__sub">
          You&rsquo;re ranked #{rankOf(me.id)} of {formatNumber(totalRanked)}
          {streak > 0 ? ` and on a ${streak}-win streak.` : '.'} Pick a game below, or jump straight into a Ping Pong match.
        </p>

        <div className="hero__actions">
          <Link to="/game/pong" className="btn btn--primary">
            Play Ping Pong
          </Link>
          <Link to="/chat" className="btn btn--ghost">
            <MessageSquare size={17} aria-hidden="true" />
            Open chat
          </Link>
        </div>

        {featured && first && second ? (
          <Link to={`/game/pong/${featured.id}`} className="hero__live">
            <span className="badge">Sample match</span>
            <span className="hero__live-text">
              {first.displayName.split(' ')[0]} vs {second.displayName.split(' ')[0]}, {featured.headline}
            </span>
            <span className="hero__live-viewers">
              <Eye size={15} aria-hidden="true" />
              {featured.spectators} watching
            </span>
          </Link>
        ) : null}
      </div>

      <span className="hero__demo">Demo rally, not a live match</span>
    </section>
  )
}
