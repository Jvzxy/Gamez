import type { MemberRole } from '../types'

// Channel permission rules, kept in one place so the UI and (later) the API
// client agree on them. The server must enforce the same rules.
//
//   owner  – everything, except acting on themselves
//   admin  – moderate regular members, edit topic and member rules
//   member – no access to room settings

/** Mute, kick or ban a target member. */
export function canModerate(actor: MemberRole, target: MemberRole): boolean {
  if (actor === 'owner') return target !== 'owner'
  if (actor === 'admin') return target === 'member'
  return false
}

/** Promote a member to admin or demote an admin. */
export function canChangeRole(actor: MemberRole, target: MemberRole): boolean {
  return actor === 'owner' && target !== 'owner'
}

export function canOpenRoomSettings(actor: MemberRole): boolean {
  return actor === 'owner' || actor === 'admin'
}

/** Name, visibility, password and deletion. */
export function canEditCore(actor: MemberRole): boolean {
  return actor === 'owner'
}

/** Topic and the member permission toggles. */
export function canEditRules(actor: MemberRole): boolean {
  return actor === 'owner' || actor === 'admin'
}

export function roleLabel(role: MemberRole): string {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'admin':
      return 'Admin'
    default:
      return 'Member'
  }
}
