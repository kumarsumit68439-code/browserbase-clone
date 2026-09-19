import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">BrowserBase</span>
          </div>
          <Link href="/login" className="text-sm bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 transition">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Give your agents access to the{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">whole web</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Cloud headless browsers, sessions, API keys — everything you need to build browser agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-medium px-8 py-3 rounded-xl transition">
              Get started free
            </Link>
            <a href="https://docs.browserbase.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-8 py-3 rounded-xl transition">
              Documentation
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-600">
        Built with Next.js + Supabase + Vercel
      </footer>
    </div>
  )
}
