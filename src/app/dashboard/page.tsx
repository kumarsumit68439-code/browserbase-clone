import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('bb_projects')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data: apiKey } = await supabase
    .from('bb_api_keys')
    .select('full_key, key_prefix, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  const { data: sessions } = await supabase
    .from('bb_sessions')
    .select('id, status, region, started_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const displayKey = apiKey?.full_key || 'No key yet — login again to generate'
  const projectId = project?.id || 'No project'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold">BrowserBase</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-zinc-400 hover:text-white">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-zinc-400 mb-8">Your cloud browser workspace</p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between mb-3">
              <h2 className="text-sm text-zinc-400">API Key</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <code className="block text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-violet-300 break-all">{displayKey}</code>
            <p className="text-xs text-zinc-500 mt-3">Use in <code className="text-zinc-400">x-bb-api-key</code> header</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm text-zinc-400 mb-3">Project ID</h2>
            <code className="block text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-indigo-300">{projectId}</code>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm overflow-x-auto text-zinc-300">{`curl -X POST /api/v1/sessions -H "x-bb-api-key: ${displayKey}" -H "Content-Type: application/json" -d '{}'`}</pre>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Link href="/api/v1/sessions" className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg">API Docs</Link>
          </div>
          {!sessions?.length ? (
            <div className="text-center py-12 text-zinc-500">
              <p>No sessions yet</p>
              <p className="text-sm mt-1">POST /api/v1/sessions with your API key</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="pb-3">Session ID</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Region</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/50">
                    <td className="py-3 font-mono text-violet-300">{s.id.slice(0, 18)}...</td>
                    <td className="py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{s.status}</span></td>
                    <td className="py-3 text-zinc-400">{s.region}</td>
                    <td className="py-3 text-zinc-400">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="py-3"><Link href={`/sessions/${s.id}`} className="text-violet-400 text-xs">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
