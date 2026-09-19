import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateSessionId } from '@/lib/keys'
import { createHash } from 'crypto'

async function authByApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-bb-api-key')
  if (!apiKey) return null
  const hash = createHash('sha256').update(apiKey).digest('hex')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const client = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()
  const { data } = await client.from('bb_api_keys').select('user_id, project_id, active').eq('key_hash', hash).eq('active', true).maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userId = user?.id
  if (!userId) {
    const keyAuth = await authByApiKey(req)
    if (!keyAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = keyAuth.user_id
  }
  let query = supabase.from('bb_sessions').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(50)
  const status = req.nextUrl.searchParams.get('status')
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userId = user?.id
  let projectId: string | null = null
  if (!userId) {
    const keyAuth = await authByApiKey(req)
    if (!keyAuth) return NextResponse.json({ error: 'Unauthorized. Provide x-bb-api-key' }, { status: 401 })
    userId = keyAuth.user_id
    projectId = keyAuth.project_id
  }
  if (!projectId) {
    const { data: project } = await supabase.from('bb_projects').select('id').eq('user_id', userId!).limit(1).maybeSingle()
    projectId = project?.id || null
  }
  if (!projectId) return NextResponse.json({ error: 'No project found' }, { status: 400 })
  let body: any = {}
  try { body = await req.json() } catch {}
  const sessionId = generateSessionId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000)
  const connectUrl = `wss://connect.example.com/sessions/${sessionId}`
  const session = {
    id: sessionId,
    project_id: projectId,
    user_id: userId!,
    status: 'RUNNING',
    region: body.region || 'us-west-2',
    connect_url: connectUrl,
    started_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    keep_alive: body.keepAlive || false,
    proxy_bytes: 0,
    user_metadata: body.userMetadata || {},
  }
  const { data, error } = await supabase.from('bb_sessions').insert(session).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id: data.id,
    projectId: data.project_id,
    status: data.status,
    connectUrl: data.connect_url,
    region: data.region,
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    keepAlive: data.keep_alive,
  }, { status: 201 })
}
