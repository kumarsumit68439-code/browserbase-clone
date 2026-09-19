import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('bb_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!session) notFound()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold">BrowserBase</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Session</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{session.status}</span>
          </div>
          <p className="font-mono text-sm text-zinc-400">{session.id}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm text-zinc-400 mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Region</dt><dd>{session.region}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Started</dt><dd>{session.started_at ? new Date(session.started_at).toLocaleString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Expires</dt><dd>{session.expires_at ? new Date(session.expires_at).toLocaleString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Keep Alive</dt><dd>{session.keep_alive ? 'Yes' : 'No'}</dd></div>
            </dl>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm text-zinc-400 mb-4">Connect URL</h2>
            <code className="block text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-violet-300 break-all">{session.connect_url || 'N/A'}</code>
            <p className="text-xs text-amber-500/80 mt-3">Real Chrome needs browser infra (not on Vercel serverless).</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm text-zinc-400 mb-4">Session Inspector (Mock)</h2>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg h-64 flex items-center justify-center text-zinc-600">
            <p className="text-sm">Live view not available in this demo</p>
          </div>
        </div>
      </main>
    </div>
  )
}
