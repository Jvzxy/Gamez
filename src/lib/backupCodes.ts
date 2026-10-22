// Sample backup codes for the 2FA preview. They are generated in the browser and
// are NOT connected to any account. A real implementation must create them on
// the server, store only hashes, and mark each one as used after a single login.

const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const values = crypto.getRandomValues(new Uint32Array(8))
    const chars = Array.from(values, (value) => alphabet[value % alphabet.length])
    return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
  })
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  if (user.length <= 2) return `${user[0] ?? ''}•@${domain}`
  return `${user[0]}${'•'.repeat(Math.min(6, user.length - 2))}${user.slice(-1)}@${domain}`
}
