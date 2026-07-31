'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AccountTypeTabs from '@/components/auth/AccountTypeTabs';
import AuthShell from '@/components/auth/AuthShell';
import type { AccountType } from '@/models/User';
import { useStore } from '@/lib/store';
import { CompanyDetail, buildImportNode } from '@/lib/companyImport';
import { ImportNode } from '@/lib/types';

type Step = 'account' | 'jira' | 'done';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importTree = useStore((s) => s.importTree);
  const resetWorkspace = useStore((s) => s.resetWorkspace);

  const [accountType, setAccountType] = useState<AccountType>('individual');
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

  useEffect(() => {
    // The landing page links straight to the business tab.
    if (searchParams.get('type') === 'business') {
      setAccountType('business');
    }
  }, [searchParams]);

  const isBusiness = accountType === 'business';
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
        body: JSON.stringify({ ...formData, accountType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      // A different account may have been signed in on this browser before —
      // drop its cached pages/companies so this account starts clean.
      resetWorkspace();

      if (isBusiness) {
        setCompanyId(data.companyId);
        setStep('jira');
      } else {
        router.push('/companies');
      }
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

  const eyebrow =
    step === 'account' ? 'Create account' : step === 'jira' ? 'Connect Jira' : 'All set';
  const title =
    step === 'account' ? 'Start a workspace' : step === 'jira' ? 'Bring in your Jira' : "You're all set";
  const intro =
    step === 'account'
      ? isBusiness
        ? 'Register under your company name, then share the workspace with the rest of the team.'
        : 'Import the Jira projects you work on and keep your notes beside them.'
      : step === 'jira'
        ? `Paste a link and we'll turn it into an easy-to-read summary for ${formData.companyName}.`
        : 'Share this link with your team, or open it now.';

  return (
    <AuthShell
      eyebrow={eyebrow}
      title={title}
      intro={intro}
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
        </>
      }
    >
      {step === 'account' && (
        <>
          <AccountTypeTabs value={accountType} onChange={setAccountType} disabled={loading} />

          {error && <p className="gb-note gb-note--error">{error}</p>}

          <form onSubmit={handleCreateAccount}>
            <label className="gb-field">
              <span className="gb-label mb-2 block">Your name</span>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="gb-input"
              />
            </label>

            <label className="gb-field">
              <span className="gb-label mb-2 block">Email address</span>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="gb-input"
              />
            </label>

            <label className="gb-field">
              <span className="gb-label mb-2 block">Password</span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="gb-input"
              />
            </label>

            {isBusiness && (
              <label className="gb-field">
                <span className="gb-label mb-2 block">Company name</span>
                <input
                  type="text"
                  required
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="gb-input"
                />
              </label>
            )}

            <button type="submit" disabled={loading} className="gb-btn mt-2">
              {loading ? 'Creating account…' : 'Continue'}
            </button>
          </form>
        </>
      )}

      {step === 'jira' && (
        <div>
          {error && <p className="gb-note gb-note--error">{error}</p>}

          <label className="gb-field">
            <span className="gb-label mb-2 block">Jira link (optional)</span>
            <input
              type="text"
              placeholder="https://your-domain.atlassian.net/jira/software/projects/SC/boards/3/backlog"
              value={jiraLink}
              onChange={(e) => setJiraLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImportJira()}
              className="gb-input"
            />
          </label>

          <button
            onClick={handleImportJira}
            disabled={loading || !jiraLink.trim()}
            className="gb-btn"
          >
            {loading ? 'Importing…' : 'Import and continue'}
          </button>

          <button
            onClick={() => setStep('done')}
            disabled={loading}
            className="mt-4 w-full text-center text-sm text-[var(--ink)]/60 hover:text-[var(--ink)] disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}

      {step === 'done' && (
        <div>
          {error && <p className="gb-note gb-note--error">{error}</p>}

          <div className="mb-6 flex items-center gap-2 border border-[var(--rule)] px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--ink)]/80">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="shrink-0 border border-[var(--rule)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--bar)]"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <button onClick={handleOpenWorkspace} disabled={loading} className="gb-btn">
            {loading ? 'Opening…' : 'Open my workspace'}
          </button>
        </div>
      )}
    </AuthShell>
  );
}

// useSearchParams() opts the tree into client-side rendering, so the form
// needs a Suspense boundary for the page to prerender.
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="gb min-h-screen" />}>
      <RegisterForm />
    </Suspense>
  );
}
