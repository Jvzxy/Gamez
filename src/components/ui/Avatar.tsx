import type { CSSProperties } from 'react'
import { hueFor, initials } from '../../lib/format'
import type { PresenceStatus } from '../../types'

interface AvatarProps {
  name: string
  /** Stable value used to pick the colour. Defaults to the name. */
  seed?: string
  size?: number
  status?: PresenceStatus
  /** Colour of the ring around the presence dot (match the surface behind). */
  ring?: string
}

/** Decorative: always shown next to the person's name, so it is hidden from assistive tech. */
export function Avatar({ name, seed, size = 36, status, ring }: AvatarProps) {
  const style = {
    '--size': `${size}px`,
    '--h': hueFor(seed ?? name),
    ...(ring ? { '--ring': ring } : {}),
  } as CSSProperties
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initials(name)}
      {status ? <span className={`presence presence--${status}`} /> : null}
    </span>
  )
}

interface AvatarStackProps {
  people: Array<{ id: string; name: string }>
  total?: number
  size?: number
  ring?: string
}

export function AvatarStack({ people, total, size = 32, ring }: AvatarStackProps) {
  const extra = (total ?? people.length) - people.length
  const style = (ring ? { '--ring': ring } : undefined) as CSSProperties | undefined
  return (
    <span className="avatar-stack" style={style}>
      {people.map((person) => (
        <Avatar key={person.id} name={person.name} seed={person.id} size={size} />
      ))}
      {extra > 0 ? <span className="avatar-more">+{extra}</span> : null}
    </span>
  )
}
