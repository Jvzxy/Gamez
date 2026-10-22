import { History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MatchTable } from '../../components/MatchTable'
import { getMatchHistory } from '../../data/matches'
import { useDocumentTitle } from '../../lib/hooks'
import { GameSelector } from './GameSelector'
import { HomeHero } from './HomeHero'
import { Leaderboard } from './Leaderboard'
import { LiveMatches } from './LiveMatches'
import { Scorecard } from './Scorecard'
import './home.css'

export function HomePage() {
  useDocumentTitle('Home')
  const recent = getMatchHistory('me').slice(0, 6)

  return (
    <div className="page home">
      <HomeHero />
      <Scorecard />
      <GameSelector />

      <div className="home-grid">
        <LiveMatches />
        <Leaderboard />
      </div>

      <section className="panel" aria-labelledby="recent-title">
        <div className="panel__head">
          <h2 className="panel__title" id="recent-title">
            <History size={18} aria-hidden="true" />
            Last played matches
          </h2>
          <Link to="/profile" className="link">
            See full history
          </Link>
        </div>
        <div className="panel__body panel__body--flush">
          <MatchTable matches={recent} caption="Your six most recent matches" />
        </div>
      </section>
    </div>
  )
}
