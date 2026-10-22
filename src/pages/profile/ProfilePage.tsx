import { UserX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { getPlayerByUsername } from '../../data/players'
import { useDocumentTitle } from '../../lib/hooks'
import { useCurrentPlayer } from '../../state/user'
import { AchievementsPanel } from './AchievementsPanel'
import { FriendsPanel } from './FriendsPanel'
import { MatchHistory } from './MatchHistory'
import { ProfileHeader } from './ProfileHeader'
import { StatsPanel } from './StatsPanel'
import './profile.css'

export function ProfilePage() {
  const { username } = useParams()
  const me = useCurrentPlayer()

  // Anyone whose id is "me" is the signed-in player, with Settings edits applied.
  const found = username ? getPlayerByUsername(username) : me
  const player = found?.id === me.id ? me : found
  const isSelf = player?.id === me.id

  useDocumentTitle(player ? (isSelf ? 'Your profile' : player.displayName) : 'Player not found')

  if (!player) {
    return (
      <div className="page">
        <div className="panel">
          <EmptyState
            icon={UserX}
            title="Player not found"
            action={
              <Link to="/" className="btn btn--primary">
                Back to Home
              </Link>
            }
          >
            Nobody uses the username &ldquo;{username}&rdquo;. Check the spelling, or find the player on the leaderboard.
          </EmptyState>
        </div>
      </div>
    )
  }

  return (
    <div className="page profile">
      <ProfileHeader player={player} isSelf={isSelf} />

      <div className="profile-grid">
        <div className="profile-col">
          <StatsPanel player={player} />
          <MatchHistory player={player} />
        </div>
        <div className="profile-col">
          {isSelf ? <FriendsPanel /> : null}
          <AchievementsPanel player={player} isSelf={isSelf} />
        </div>
      </div>
    </div>
  )
}
