import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Placeholder - later we will generate real API key + Project ID here
  const mockApiKey = 'bb_live_' + user.id.slice(0, 24)
  const mockProjectId = 'proj_' + user.id.slice(0, 12)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight">BrowserBase</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-zinc-400 hover:text-white transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Your cloud browser workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-400">API Key</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <code className="block text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-violet-300 break-all">
              {mockApiKey}
            </code>
            <p className="text-xs text-zinc-500 mt-3">
              Use this key in the <code className="text-zinc-400">x-bb-api-key</code> header
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Project ID</h2>
            <code className="block text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-indigo-300">
              {mockProjectId}
            </code>
            <p className="text-xs text-zinc-500 mt-3">Automatically generated on account creation</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm overflow-x-auto text-zinc-300">
{`import { Browserbase } from "@browserbasehq/sdk";

const bb = new Browserbase({
  apiKey: "${mockApiKey}"
});

const session = await bb.sessions.create();
console.log("Session ID:", session.id);
console.log("Connect URL:", session.connectUrl);`}
          </pre>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <button className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition">
              New Session
            </button>
          </div>
          <div className="text-center py-12 text-zinc-500">
            <p>No sessions yet</p>
            <p className="text-sm mt-1">Create your first browser session to get started</p>
          </div>
        </div>
      </main>
    </div>
  )
}
