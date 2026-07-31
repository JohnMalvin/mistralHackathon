'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AccountTypeTabs from '@/components/auth/AccountTypeTabs';
import AuthShell from '@/components/auth/AuthShell';
import type { AccountType } from '@/models/User';

const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–1000', '1000+'];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    website: '',
    teamSize: TEAM_SIZES[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isBusiness = accountType === 'business';

  // The landing page links straight to the business tab.
  useEffect(() => {
    if (searchParams.get('type') === 'business') {
      setAccountType('business');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Only send the business fields on a business signup so an individual
    // account never carries a half-filled company profile.
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      accountType,
      ...(isBusiness
        ? {
            companyName: formData.companyName,
            website: formData.website,
            teamSize: formData.teamSize,
          }
        : {}),
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not create the account.');
      }

      // Redirect to login page upon successful account creation, keeping the
      // chosen category so the sign-in form opens on the matching tab.
      router.push(`/login?registered=true&type=${accountType}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        </>
      }
    >
      <AccountTypeTabs
        value={accountType}
        onChange={setAccountType}
        disabled={loading}
      />

      {error && <p className="gb-note gb-note--error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="gb-field">
          <span className="gb-label mb-2 block">
            {isBusiness ? 'Your name' : 'Full name'}
          </span>
          <input
            type="text"
            required
            placeholder="Ada Lovelace"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="gb-input"
          />
        </label>

        {isBusiness && (
          <>
            <label className="gb-field">
              <span className="gb-label mb-2 block">Company name</span>
              <input
                type="text"
                required
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="gb-input"
              />
            </label>

            <label className="gb-field">
              <span className="gb-label mb-2 block">
                Company website — optional
              </span>
              <input
                type="url"
                placeholder="https://acme.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="gb-input"
              />
            </label>

            <label className="gb-field">
              <span className="gb-label mb-2 block">Team size</span>
              <select
                value={formData.teamSize}
                onChange={(e) =>
                  setFormData({ ...formData, teamSize: e.target.value })
                }
                className="gb-input gb-select"
              >
                {TEAM_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} people
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label className="gb-field">
          <span className="gb-label mb-2 block">
            {isBusiness ? 'Work email address' : 'Email address'}
          </span>
          <input
            type="email"
            required
            placeholder={isBusiness ? 'you@acme.com' : 'you@example.com'}
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
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
