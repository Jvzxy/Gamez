import { Award, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAchievements } from '../../data/achievements'
import { formatNumber } from '../../lib/format'
import { useUser } from '../../state/user'
import type { Player } from '../../types'

export function AchievementsPanel({ player, isSelf }: { player: Player; isSelf: boolean }) {
  const { twoFactor } = useUser()
  const achievements = getAchievements(player.id, twoFactor.enabled)
  const unlocked = achievements.filter((achievement) => achievement.unlocked)
  // Unlocked first, then the ones closest to completion.
  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return b.current / b.target - a.current / a.target
  })

  return (
    <section className="panel" aria-labelledby="ach-title">
      <div className="panel__head">
        <h2 className="panel__title" id="ach-title">
          <Award size={18} aria-hidden="true" />
          Achievements
        </h2>
        <span className="badge badge--gold">
          {unlocked.length} of {achievements.length} unlocked
        </span>
      </div>

      <ul className="panel__body ach-list">
        {sorted.map((achievement) => (
          <li key={achievement.id} className={`ach ach--${achievement.rarity}${achievement.unlocked ? '' : ' is-locked'}`}>
            <span className="ach__icon">
              {achievement.unlocked ? <achievement.icon size={20} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
            </span>
            <span className="ach__text">
              <span className="ach__name">
                {achievement.name}
                <span className="ach__rarity">{achievement.rarity}</span>
              </span>
              <span className="ach__desc">{achievement.description}</span>
              {achievement.unlocked ? null : (
                <span className="ach__progress">
                  <span
                    className="meter"
                    role="progressbar"
                    aria-label={`${achievement.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={achievement.target}
                    aria-valuenow={achievement.current}
                  >
                    <span className="meter__fill" style={{ width: `${Math.min(100, (achievement.current / achievement.target) * 100)}%` }} />
                  </span>
                  <span className="faint">
                    {formatNumber(achievement.current)} / {formatNumber(achievement.target)}
                  </span>
                </span>
              )}
              {isSelf && achievement.id === 'locked-in' && !achievement.unlocked ? (
                <Link to="/settings/security" className="link ach__cta">
                  Set up two-factor authentication
                </Link>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
