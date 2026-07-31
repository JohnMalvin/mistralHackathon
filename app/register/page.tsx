'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  AlertCircle,
  Link as LinkIconLucide,
  Check,
  Copy,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { CompanyDetail, buildImportNode } from '@/lib/companyImport';
import { ImportNode } from '@/lib/types';

type Step = 'account' | 'jira' | 'done';

export default function RegisterPage() {
  const router = useRouter();
  const importTree = useStore((s) => s.importTree);
  const resetWorkspace = useStore((s) => s.resetWorkspace);

  const [step, setStep] = useState<Step>('account');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jiraLink, setJiraLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shareUrl =
    companyId && typeof window !== 'undefined'
      ? `${window.location.origin}/shared/company/${companyId}`
      : '';

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      // A different account may have been signed in on this browser before —
      // drop its cached pages/companies so this new company starts clean.
      resetWorkspace();

      setCompanyId(data.companyId);
      setStep('jira');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportJira() {
    if (!jiraLink.trim() || !companyId) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/jira-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: jiraLink.trim(), companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — nothing we can do, silently ignore
    }
  }

  async function handleOpenWorkspace() {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      const detail: CompanyDetail = await res.json();
      const node: ImportNode = await buildImportNode(detail);
      const localId = importTree(node, null);
      router.push(`/doc/${localId}`);
    } catch {
      setError('Failed to open your workspace.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0D12] px-4 py-12 selection:bg-sky-500 selection:text-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#12161F] p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white">Workspace AI</span>
          </Link>
          {step === 'account' && (
            <>
              <h2 className="mt-4 text-2xl font-bold text-white">Register your company</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Create your account and your company&apos;s workspace
              </p>
            </>
          )}
          {step === 'jira' && (
            <>
              <h2 className="mt-4 text-2xl font-bold text-white">Bring in your Jira (optional)</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Paste a link and we&apos;ll turn it into an easy-to-read summary for{' '}
                {formData.companyName}
              </p>
            </>
          )}
          {step === 'done' && (
            <>
              <h2 className="mt-4 text-2xl font-bold text-white">You&apos;re all set</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Share this link with your team, or open it now
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Company name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Your name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-black transition-all hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Continue'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        {step === 'jira' && (
          <div className="space-y-4">
            <div className="relative">
              <LinkIconLucide className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="https://your-domain.atlassian.net/jira/software/projects/SC/boards/3/backlog"
                value={jiraLink}
                onChange={(e) => setJiraLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImportJira()}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleImportJira}
              disabled={loading || !jiraLink.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-black transition-all hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import and continue'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setStep('done')}
              disabled={loading}
              className="w-full py-2 text-center text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{shareUrl}</span>
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-lg bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700"
                title="Copy link"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <button
              onClick={handleOpenWorkspace}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-black transition-all hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? 'Opening...' : 'Open my workspace'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}

        {step === 'account' && (
          <p className="mt-6 text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-sky-400 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
