import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, generateProjectId } from '@/lib/keys'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const { data: existing } = await supabase
        .from('bb_projects')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1)
        .maybeSingle()

      if (!existing) {
        const projectId = generateProjectId()
        const { fullKey, prefix, hash } = generateApiKey()

        await supabase.from('bb_projects').insert({
          id: projectId,
          user_id: data.user.id,
          name: 'Default Project',
        })

        await supabase.from('bb_api_keys').insert({
          id: `key_${Date.now()}`,
          project_id: projectId,
          user_id: data.user.id,
          key_prefix: prefix,
          key_hash: hash,
          full_key: fullKey,
          name: 'Default',
          active: true,
        })
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
