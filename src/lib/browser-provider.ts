/**
 * Real browser session provider via Browserless Session API.
 * Set BROWSERLESS_TOKEN in env for real Chrome.
 * Docs: https://docs.browserless.io/baas/session-management
 */

export type RealSession = {
  providerSessionId: string
  connectUrl: string
  stopUrl?: string
  region: string
}

export async function createRealBrowserSession(options?: {
  region?: string
  ttlMs?: number
}): Promise<RealSession> {
  const token = process.env.BROWSERLESS_TOKEN
  if (!token) {
    throw new Error(
      'BROWSERLESS_TOKEN not set. Add it in Vercel env vars to enable real Chrome sessions. Get a free token at https://www.browserless.io'
    )
  }

  const regionHost: Record<string, string> = {
    'us-west-2': 'production-sfo.browserless.io',
    'us-east-1': 'production-sfo.browserless.io',
    'eu-west-1': 'production-lon.browserless.io',
    'eu-central-1': 'production-ams.browserless.io',
  }
  const region = options?.region || 'us-west-2'
  const host = regionHost[region] || regionHost['us-west-2']
  const ttl = options?.ttlMs ?? 15 * 60 * 1000

  const res = await fetch(`https://${host}/session?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ttl,
      stealth: true,
      headless: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Browserless session create failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  if (!data.connect) {
    throw new Error('Browserless did not return connect WebSocket URL')
  }

  return {
    providerSessionId: data.id || data.connect,
    connectUrl: data.connect,
    stopUrl: data.stop,
    region,
  }
}

export async function stopRealBrowserSession(stopUrl: string): Promise<void> {
  if (!stopUrl) return
  try {
    await fetch(stopUrl + (stopUrl.includes('?') ? '&' : '?') + 'force=true', {
      method: 'DELETE',
    })
  } catch {
    // best effort
  }
}
