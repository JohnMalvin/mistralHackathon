'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { normalizePageJson } from '@/lib/pageJson';
import { FileIcon } from '@/components/ui/Icons';

export default function SharedPageLoader({ dbId }: { dbId: string }) {
    const router = useRouter();
    const dbPageMap = useStore((s) => s.dbPageMap);
    const importDbPage = useStore((s) => s.importDbPage);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const existingLocalId = dbPageMap[dbId];
        if (existingLocalId) {
            router.replace(`/doc/${existingLocalId}`);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/pages/${dbId}`);
                if (!res.ok) {
                    throw new Error(
                        res.status === 404
                            ? 'Page not found'
                            : 'Failed to load page',
                    );
                }
                const raw = await res.json();
                if (cancelled) return;
                const normalized = normalizePageJson(raw);
                const localId = importDbPage(dbId, normalized);
                router.replace(`/doc/${localId}`);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load page',
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dbId]);

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-light dark:text-muted-dark">
            <FileIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">{error ? error : 'Loading shared page…'}</p>
        </div>
    );
}
