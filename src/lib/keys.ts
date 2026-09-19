import { createHash, randomBytes } from 'crypto'

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const raw = randomBytes(24).toString('hex')
  const fullKey = `bb_live_${raw}`
  const prefix = fullKey.slice(0, 12)
  const hash = createHash('sha256').update(fullKey).digest('hex')
  return { fullKey, prefix, hash }
}

export function generateProjectId(): string {
  return `proj_${randomBytes(8).toString('hex')}`
}

export function generateSessionId(): string {
  return `sess_${randomBytes(12).toString('hex')}`
}
