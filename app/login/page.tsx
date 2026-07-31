'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AccountTypeTabs from '@/components/auth/AccountTypeTabs';
import AuthShell from '@/components/auth/AuthShell';
import type { AccountType } from '@/models/User';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created. Sign in to open your workspace.');
    }
    // /register sends the category it just created so the right tab opens.
    if (searchParams.get('type') === 'business') {
      setAccountType('business');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, accountType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'That email and password do not match.');
      }

      // Redirect user directly to authenticated workspace page where they search for the companies
      router.push('/companies');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      intro={
        accountType === 'business'
          ? 'Open your company workspace and pick up where the team left off.'
          : 'Open your workspace and pick up where you left off.'
      }
      altHref="/register"
      altLabel="Create account"
      footer={
        <>
          No account yet?{' '}
          <Link
            href="/register"
            className="text-[var(--ribbon)] underline underline-offset-4"
          >
            Create one
          </Link>
        </>
      }
    >
      <AccountTypeTabs
        value={accountType}
        onChange={setAccountType}
        disabled={loading}
      />

      {success && <p className="gb-note gb-note--ok">{success}</p>}
      {error && <p className="gb-note gb-note--error">{error}</p>}

      <form onSubmit={handleSubmit}>
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
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="gb-input"
          />
        </label>

        <button type="submit" disabled={loading} className="gb-btn mt-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

// useSearchParams() opts the tree into client-side rendering, so the form
// needs a Suspense boundary for the page to prerender.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="gb min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
