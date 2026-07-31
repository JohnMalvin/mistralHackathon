'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface WorkspaceHeaderProps {
  workspaceName?: string;
  onSyncSuccess?: () => void;
}

export default function WorkspaceHeader({
  workspaceName = 'My Workspace',
  onSyncSuccess,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncJira = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      const res = await fetch('/api/sync-jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Sync failed');
      setSyncStatus('success');
      if (onSyncSuccess) onSyncSuccess();
      router.refresh();
    } catch (error) {
      console.error('Jira sync error:', error);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="relative w-full p-2" ref={menuRef}>
      {/* Clickable Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-sm font-medium transition-colors hover:bg-hover-light dark:hover:bg-hover-dark"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-[11px] font-bold text-white shadow-sm">
            N
          </div>
          <span className="truncate font-semibold text-ink-light dark:text-ink-dark">
            {workspaceName}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-light transition-transform duration-200 dark:text-muted-dark ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-2 top-full z-50 mt-1 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-light uppercase dark:text-muted-dark">
            Workspace Actions
          </div>

          <button
            onClick={handleSyncJira}
            disabled={syncing}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`h-3.5 w-3.5 text-sky-500 ${
                  syncing ? 'animate-spin' : ''
                }`}
              />
              <span>{syncing ? 'Syncing Jira...' : 'Sync Jira Workspace'}</span>
            </div>
            {syncStatus === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            {syncStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
          >
            {logoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            <span>{logoutLoading ? 'Logging out...' : 'Log out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}