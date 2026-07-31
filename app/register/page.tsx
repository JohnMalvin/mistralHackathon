'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isBusiness = accountType === 'business';

  // The landing page links straight to the business tab.
  useEffect(() => {
    if (searchParams.get('type') === 'business') {
      setAccountType('business');
    }
  }, [searchParams]);

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
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Redirect to login page upon successful account creation
      router.push('/login?registered=true');
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
    <AuthShell
      eyebrow="Create account"
      title="Start a workspace"
      intro={
        isBusiness
          ? 'Register under your company name, then share the workspace with the rest of the team.'
          : 'Import the Jira projects you work on and keep your notes beside them.'
      }
      altHref="/login"
      altLabel="Sign in"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--ribbon)] underline underline-offset-4"
          >
            Sign in
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-white">Create an account</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Start syncing your Notion notes with live Jira issues
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Full Name
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
            {loading ? 'Creating account...' : 'Get Started'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-sky-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
