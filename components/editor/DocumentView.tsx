'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { PageData } from '@/lib/types';
import Breadcrumb from '@/components/editor/Breadcrumb';
import BlockList from '@/components/editor/BlockList';
import IconPicker from '@/components/ui/IconPicker';
import {
    StarIcon,
    MoreHorizontalIcon,
    ImageIcon,
    TrashIcon,
    CopyIcon,
} from '@/components/ui/Icons';

const COVER_OPTIONS = [
    'linear-gradient(135deg,#ffd9a0,#ff9770)',
    'linear-gradient(135deg,#a0e7e5,#61c0bf)',
    'linear-gradient(135deg,#b8c6ff,#7f8fff)',
    'linear-gradient(135deg,#ffb6d9,#ff6fa8)',
    'linear-gradient(135deg,#c9f2a0,#8fd45a)',
    'linear-gradient(135deg,#37352f,#191919)',
];

export default function DocumentView({ page }: { page: PageData }) {
    const router = useRouter();
    const updateTitle = useStore((s) => s.updatePageTitle);
    const updateIcon = useStore((s) => s.updatePageIcon);
    const updateCover = useStore((s) => s.updatePageCover);
    const toggleFavorite = useStore((s) => s.toggleFavorite);
    const deletePage = useStore((s) => s.deletePage);
    const duplicatePage = useStore((s) => s.duplicatePage);

    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [coverPickerOpen, setCoverPickerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const titleRef = useRef<HTMLTextAreaElement>(null);

    function autosize() {
        const el = titleRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    return (
        <div className="min-h-full pb-40">
            <div className="flex items-center justify-between">
                <Breadcrumb page={page} />
                <div className="flex items-center gap-1 px-4">
                    <button
                        onClick={() => toggleFavorite(page.id)}
                        className="rounded p-1.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                        title={
                            page.isFavorite
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                        }
                    >
                        <StarIcon
                            className="h-4 w-4"
                            filled={page.isFavorite}
                        />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="rounded p-1.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                        >
                            <MoreHorizontalIcon className="h-4 w-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-8 z-50 w-48 animate-fadeIn rounded-md border border-border-light bg-canvas-light py-1 shadow-popover dark:border-border-dark dark:bg-[#252525]">
                                    <button
                                        onClick={() => {
                                            duplicatePage(page.id);
                                            setMenuOpen(false);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-hover-light dark:hover:bg-hover-dark"
                                    >
                                        <CopyIcon className="h-3.5 w-3.5" />{' '}
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={() => {
                                            deletePage(page.id);
                                            setMenuOpen(false);
                                            router.push('/');
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-500 hover:bg-hover-light dark:hover:bg-hover-dark"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />{' '}
                                        Move to trash
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {page.coverColor && (
                <div
                    className="group relative h-40 w-full"
                    style={{ background: page.coverColor }}
                >
                    <div className="absolute bottom-3 right-3 hidden gap-2 group-hover:flex">
                        <div className="relative">
                            <button
                                onClick={() => setCoverPickerOpen((v) => !v)}
                                className="rounded bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
                            >
                                Change cover
                            </button>
                            {coverPickerOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() =>
                                            setCoverPickerOpen(false)
                                        }
                                    />
                                    <div className="absolute right-0 top-8 z-50 flex w-56 flex-wrap gap-2 rounded-md border border-border-light bg-canvas-light p-2 shadow-popover dark:border-border-dark dark:bg-[#252525]">
                                        {COVER_OPTIONS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => {
                                                    updateCover(page.id, c);
                                                    setCoverPickerOpen(false);
                                                }}
                                                className="h-8 w-8 rounded"
                                                style={{ background: c }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => updateCover(page.id, undefined)}
                            className="rounded bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-3xl px-12">
                <div
                    className={`group flex items-center gap-2 ${page.coverColor ? '-mt-8' : 'pt-8'}`}
                >
                    <div className="relative">
                        <button
                            onClick={() => setIconPickerOpen((v) => !v)}
                            className="rounded-md text-6xl leading-none hover:bg-hover-light dark:hover:bg-hover-dark"
                        >
                            {page.icon || '📄'}
                        </button>
                        {iconPickerOpen && (
                            <IconPicker
                                onSelect={(emoji) => updateIcon(page.id, emoji)}
                                onClose={() => setIconPickerOpen(false)}
                            />
                        )}
                    </div>
                </div>

                <div className="mb-1 mt-2 hidden gap-3 text-sm text-muted-light group-hover:flex dark:text-muted-dark">
                    {!page.icon && (
                        <button
                            onClick={() => setIconPickerOpen(true)}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-hover-light dark:hover:bg-hover-dark"
                        >
                            Add icon
                        </button>
                    )}
                    {!page.coverColor && (
                        <button
                            onClick={() => setCoverPickerOpen(true)}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-hover-light dark:hover:bg-hover-dark"
                        >
                            <ImageIcon className="h-3.5 w-3.5" /> Add cover
                        </button>
                    )}
                </div>

                <textarea
                    ref={titleRef}
                    value={page.title}
                    onChange={(e) => {
                        updateTitle(page.id, e.target.value);
                        autosize();
                    }}
                    onInput={autosize}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            document
                                .getElementById(`block-${page.blocks[0]?.id}`)
                                ?.focus();
                        }
                    }}
                    placeholder="Untitled"
                    rows={1}
                    className="w-full resize-none overflow-hidden bg-transparent text-4xl font-bold leading-tight text-ink-light outline-none placeholder:text-muted-light/60 dark:text-ink-dark dark:placeholder:text-muted-dark/60"
                />

                <div className="mt-6">
                    <BlockList page={page} />
                </div>
            </div>
        </div>
    );
}
