'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { FileIcon } from '@/components/ui/Icons';

export default function EmptyState() {
    const router = useRouter();
    const createPage = useStore((s) => s.createPage);

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-light dark:text-muted-dark">
            <FileIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">Select a page from the sidebar, or</p>
            <button
                onClick={() => {
                    const id = createPage(null);
                    router.push(`/doc/${id}`);
                }}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
            >
                Create a new page
            </button>
        </div>
    );
}
