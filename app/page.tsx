// import Workspace from '@/components/Workspace';

// export default function Home() {
//     return <Workspace pageId={null} />;
// }

import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  Layers,
  Bot,
  ArrowRight,
  CheckCircle2,
  Lock,
  Kanban,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* 1. NAVIGATION BAR */}
      <nav className="fixed top-0 z-40 w-full border-b border-zinc-800/80 bg-[#121212]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Workspace AI
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-white">
              Workflow
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-36 pb-20">
        {/* Glowing Background Gradients */}
        <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Mistral AI & Jira Connector</span>
          </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
                Your Notion Workspace <br />
                <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-teal-300 bg-clip-text text-transparent">
                    Synced with Live Jira Intelligence
                </span>
            </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Organize pages, extract sprint deliverables, and ask AI contextual
            questions across your whole project—all in one unified workspace.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition-all hover:bg-blue-500 sm:w-auto"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white sm:w-auto"
            >
              Explore Features
            </a>
          </div>

          {/* APP PREVIEW CARD */}
          <div className="mt-16 rounded-2xl border border-zinc-800/80 bg-[#191919] p-3 shadow-2xl shadow-black/80">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto rounded-md bg-zinc-900 px-4 py-1 text-xs text-zinc-500">
                app.workspace.ai/projects
              </div>
            </div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-950 p-6 text-left">
              <div className="flex h-full gap-6">
                {/* Simulated Sidebar */}
                <div className="w-1/4 rounded-lg border border-zinc-800 bg-[#191919] p-3 text-xs text-zinc-400">
                  <div className="mb-3 font-semibold text-zinc-200">WORKSPACE</div>
                  <div className="space-y-2">
                    <div className="rounded bg-blue-600/20 px-2 py-1.5 text-blue-400">
                      🚀 Active Sprints
                    </div>
                    <div className="px-2 py-1.5 hover:text-zinc-200">
                      📄 Technical Roadmap
                    </div>
                    <div className="px-2 py-1.5 hover:text-zinc-200">
                      🛠️ Debt Backlog
                    </div>
                  </div>
                </div>
                {/* Simulated Content */}
                <div className="flex-1 space-y-4">
                  <div className="h-8 w-2/5 rounded bg-zinc-800" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 rounded border border-zinc-800/80 bg-zinc-900 p-3">
                      <div className="h-4 w-1/2 rounded bg-zinc-800" />
                      <div className="mt-3 h-3 w-4/5 rounded bg-zinc-800/50" />
                    </div>
                    <div className="h-24 rounded border border-zinc-800/80 bg-zinc-900 p-3">
                      <div className="h-4 w-1/2 rounded bg-zinc-800" />
                      <div className="mt-3 h-3 w-4/5 rounded bg-zinc-800/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE HIGHLIGHTS */}
      <section id="features" className="border-t border-zinc-800/80 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Engineered for Modern Engineering Teams
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Everything you need to sync workspace notes with live Jira issue tracking.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-zinc-800/80 bg-[#191919] p-6 transition-all hover:border-zinc-700">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Automated Jira Sync</h3>
              <p className="mt-2 text-sm text-zinc-400">
                One-click synchronization extracts Jira sprints, technical debt, and
                tasks into structured pages.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-zinc-800/80 bg-[#191919] p-6 transition-all hover:border-zinc-700">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Context-Aware AI Assistant</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Docked bottom-right chat widget that answers questions using your live
                workspace data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-zinc-800/80 bg-[#191919] p-6 transition-all hover:border-zinc-700">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Page Hierarchy</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Projects split seamlessly into pages, allowing modular organization for
                every release cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA FOOTER */}
      <footer className="border-t border-zinc-800/80 py-12 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Workspace AI
          </div>
          <p>© {new Date().getFullYear()} Workspace AI. All rights reserved.</p>
          <div className="flex gap-6 text-zinc-400">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}