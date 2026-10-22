import { Eye } from 'lucide-react'
import { PlayerChip } from '../../components/PlayerChip'
import { formatNumber } from '../../lib/format'
import type { Player } from '../../types'

interface SpectatorsPanelProps {
  spectators: Player[]
  total: number
  meId?: string
  /** Shown instead of "Nobody is watching yet." */
  emptyText?: string
  /** A caveat shown under the list, e.g. that the audience is sample data. */
  note?: string
}

export function SpectatorsPanel({ spectators, total, meId, emptyText = 'Nobody is watching yet.', note }: SpectatorsPanelProps) {
  const hidden = total - spectators.length

  return (
    <section className="panel" aria-labelledby="spectators-title">
      <div className="panel__head">
        <h2 className="panel__title" id="spectators-title">
          <Eye size={18} aria-hidden="true" />
          Watching
        </h2>
        <span className="badge">{formatNumber(total)}</span>
      </div>

      {spectators.length > 0 ? (
        <ul className="panel__body panel__body--flush spectators">
          {spectators.map((person) => (
            <li key={person.id}>
              <PlayerChip player={person} size={32} showStatus sub={person.id === meId ? 'You are watching' : undefined} />
            </li>
          ))}
          {hidden > 0 ? <li className="spectators__more faint">and {formatNumber(hidden)} more watching</li> : null}
        </ul>
      ) : (
        <p className="spectators__empty muted">{emptyText}</p>
      )}
      {note ? <p className="spectators__note faint">{note}</p> : null}
    </section>
  )
}
