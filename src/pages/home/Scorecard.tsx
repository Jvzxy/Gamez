import { Sparkline } from '../../components/ui/charts'
import { rankOf, totalRanked } from '../../data/players'
import { formatNumber, formatPercent, signed } from '../../lib/format'
import { useCurrentPlayer } from '../../state/user'

/** The signed-in player's headline numbers as one strip rather than five separate cards. */
export function Scorecard() {
  const me = useCurrentPlayer()
  const { stats } = me
  const winRate = stats.wins / stats.matches
  const recent = stats.ratingHistory.slice(-16)
  const weekly = me.weeklyDelta
  const weeklyClass = weekly > 0 ? 'delta--up' : weekly < 0 ? 'delta--down' : 'delta--flat'

  return (
    <section aria-label="Your statistics">
      <dl className="scorecard">
        <div className="scorecard__cell scorecard__cell--wide">
          <dt>Rating</dt>
          <dd>
            <span className="scorecard__value num">{formatNumber(me.rating)}</span>
            <span className="scorecard__note">
              <span className={`delta ${weeklyClass}`}>{signed(weekly)}</span> this week
            </span>
          </dd>
          <Sparkline values={recent} label={`Rating over your last ${recent.length} matches, now ${me.rating}`} />
        </div>
        <div className="scorecard__cell">
          <dt>Win rate</dt>
          <dd>
            <span className="scorecard__value num">{formatPercent(winRate)}</span>
            <span className="scorecard__note">
              {stats.wins} wins, {stats.losses} losses
            </span>
          </dd>
        </div>
        <div className="scorecard__cell">
          <dt>Matches played</dt>
          <dd>
            <span className="scorecard__value num">{formatNumber(stats.matches)}</span>
            <span className="scorecard__note">{stats.draws} draws</span>
          </dd>
        </div>
        <div className="scorecard__cell">
          <dt>Win streak</dt>
          <dd>
            <span className="scorecard__value num">{stats.currentStreak}</span>
            <span className="scorecard__note">Best: {stats.bestStreak}</span>
          </dd>
        </div>
        <div className="scorecard__cell">
          <dt>Global rank</dt>
          <dd>
            <span className="scorecard__value num">#{rankOf(me.id)}</span>
            <span className="scorecard__note">of {formatNumber(totalRanked)}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
