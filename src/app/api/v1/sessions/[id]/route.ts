import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

async function authByApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-bb-api-key')
  if (!apiKey) return null
  const hash = createHash('sha256').update(apiKey).digest('hex')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const client = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()
  const { data } = await client.from('bb_api_keys').select('user_id').eq('key_hash', hash).eq('active', true).maybeSingle()
  return data
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userId = user?.id
  if (!userId) {
    const keyAuth = await authByApiKey(req)
    if (!keyAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = keyAuth.user_id
  }
  const { data, error } = await supabase.from('bb_sessions').select('*').eq('id', id).eq('user_id', userId!).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json({
    id: data.id,
    projectId: data.project_id,
    status: data.status,
    connectUrl: data.connect_url,
    region: data.region,
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    endedAt: data.ended_at,
    keepAlive: data.keep_alive,
    proxyBytes: data.proxy_bytes,
  })
}
