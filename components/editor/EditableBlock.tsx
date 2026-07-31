'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Block, BlockType } from '@/lib/types';
import SlashMenu from '@/components/editor/SlashMenu';
import { FocusRequest } from '@/components/editor/BlockList';
import {
    PlusIcon,
    DragHandleIcon,
    CheckIcon,
    ChevronRightIcon,
} from '@/components/ui/Icons';

function setCaret(el: HTMLElement, pos: 'start' | 'end' | number) {
    const range = document.createRange();
    const sel = window.getSelection();
    const textNode = el.firstChild ?? el;
    const len = el.innerText.length;
    let offset = pos === 'start' ? 0 : pos === 'end' ? len : Math.min(pos, len);
    try {
        if (textNode.nodeType === Node.TEXT_NODE) {
            range.setStart(textNode, offset);
        } else {
            range.selectNodeContents(el);
        }
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
    } catch {
        // fall back silently
    }
}

const PLACEHOLDERS: Partial<Record<BlockType, string>> = {
    paragraph: "Type '/' for commands",
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bulleted: 'List',
    numbered: 'List',
    todo: 'To-do',
    toggle: 'Toggle',
    quote: 'Quote',
    callout: 'Callout',
    code: 'Code',
};

export default function EditableBlock({
    pageId,
    block,
    index,
    isLast,
    ordinal,
    focusRequest,
    setFocusRequest,
    dragId,
    setDragId,
}: {
    pageId: string;
    block: Block;
    index: number;
    isLast: boolean;
    ordinal?: number;
    focusRequest: FocusRequest;
    setFocusRequest: (f: FocusRequest) => void;
    dragId: string | null;
    setDragId: (id: string | null) => void;
}) {
    const updateBlock = useStore((s) => s.updateBlock);
    const deleteBlock = useStore((s) => s.deleteBlock);
    const addBlock = useStore((s) => s.addBlock);
    const changeBlockType = useStore((s) => s.changeBlockType);
    const toggleTodo = useStore((s) => s.toggleTodo);
    const toggleCollapsed = useStore((s) => s.toggleCollapsed);
    const reorderBlock = useStore((s) => s.reorderBlock);
    const pages = useStore((s) => s.pages);
    const blocks = pages[pageId]?.blocks ?? [];

    const ref = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const [slashOpen, setSlashOpen] = useState(false);
    const [slashQuery, setSlashQuery] = useState('');
    const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null);

    // initial mount content
    useEffect(() => {
        if (ref.current) ref.current.innerText = block.content;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // sync external content changes (e.g. merges) when not focused
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (document.activeElement !== el && el.innerText !== block.content) {
            el.innerText = block.content;
        }
    }, [block.content]);

    // handle focus requests from parent
    useEffect(() => {
        if (focusRequest && focusRequest.blockId === block.id && ref.current) {
            ref.current.focus();
            setCaret(ref.current, focusRequest.pos);
            setFocusRequest(null);
        }
    }, [focusRequest, block.id, setFocusRequest]);

    function handleInput(e: React.FormEvent<HTMLDivElement>) {
        const text = e.currentTarget.innerText;
        updateBlock(pageId, block.id, text);
        if (text.startsWith('/')) {
            setSlashOpen(true);
            setSlashQuery(text.slice(1));
        } else {
            setSlashOpen(false);
        }
    }

    function setContentImmediate(text: string) {
        if (ref.current) ref.current.innerText = text;
        updateBlock(pageId, block.id, text);
    }

    function handleSelectType(type: BlockType) {
        changeBlockType(pageId, block.id, type);
        setContentImmediate('');
        setSlashOpen(false);
        requestAnimationFrame(() => ref.current?.focus());
    }

    function getCaretOffset(): number {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return 0;
        return sel.getRangeAt(0).startOffset;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (
            slashOpen &&
            (e.key === 'Enter' ||
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'Escape')
        ) {
            // SlashMenu's own window listener handles these; just stop it from
            // also creating newlines / moving blocks.
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const continuesType: BlockType[] = [
                'bulleted',
                'numbered',
                'todo',
                'toggle',
            ];
            if (
                block.content.trim() === '' &&
                block.type !== 'paragraph' &&
                block.type !== 'code'
            ) {
                changeBlockType(pageId, block.id, 'paragraph');
                return;
            }
            const nextType = continuesType.includes(block.type)
                ? block.type
                : 'paragraph';
            const newId = addBlock(pageId, block.id, nextType, '');
            setFocusRequest({ blockId: newId, pos: 'start' });
            return;
        }

        if (e.key === 'Backspace') {
            const offset = getCaretOffset();
            const sel = window.getSelection();
            const collapsed = sel?.isCollapsed ?? true;
            if (offset === 0 && collapsed) {
                e.preventDefault();
                const prev = blocks[index - 1];
                if (block.content === '' && blocks.length > 1) {
                    deleteBlock(pageId, block.id);
                    if (prev) setFocusRequest({ blockId: prev.id, pos: 'end' });
                } else if (prev) {
                    const mergeAt = prev.content.length;
                    updateBlock(pageId, prev.id, prev.content + block.content);
                    deleteBlock(pageId, block.id);
                    setFocusRequest({ blockId: prev.id, pos: mergeAt });
                }
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            const prev = blocks[index - 1];
            if (prev) {
                e.preventDefault();
                setFocusRequest({ blockId: prev.id, pos: 'end' });
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            const next = blocks[index + 1];
            if (next) {
                e.preventDefault();
                setFocusRequest({ blockId: next.id, pos: 'start' });
            }
            return;
        }
    }

    function handleAddBelow() {
        const id = addBlock(pageId, block.id, 'paragraph', '');
        setFocusRequest({ blockId: id, pos: 'start' });
    }

    function handleDragStart(e: React.DragEvent) {
        e.dataTransfer.setData('text/block-id', block.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragId(block.id);
    }

    function handleDragOver(e: React.DragEvent) {
        if (!dragId || dragId === block.id) return;
        e.preventDefault();
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = e.clientY - rect.top;
        setDragOver(y < rect.height / 2 ? 'top' : 'bottom');
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/block-id');
        if (draggedId && draggedId !== block.id) {
            reorderBlock(
                pageId,
                draggedId,
                block.id,
                dragOver === 'bottom' ? 'after' : 'before',
            );
        }
        setDragOver(null);
        setDragId(null);
    }

    const commonEditableProps = {
        ref,
        id: `block-${block.id}`,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: handleInput,
        onKeyDown: handleKeyDown,
        'data-placeholder': PLACEHOLDERS[block.type] ?? '',
        className:
            'min-w-0 flex-1 whitespace-pre-wrap break-words outline-none',
    };

    return (
        <div
            ref={rowRef}
            className={`block-row group relative flex items-start gap-1 rounded px-1 py-0.5 transition-shadow ${
                dragOver === 'top' ? 'drag-over-top' : ''
            } ${dragOver === 'bottom' ? 'drag-over-bottom' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={() => setDragOver(null)}
        >
            <div className="mt-0.5 flex shrink-0 items-center gap-0.5 pt-0.5">
                <button
                    onClick={handleAddBelow}
                    className="drag-handle rounded p-0.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                    title="Add block below"
                    tabIndex={-1}
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                </button>
                <span
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDragId(null)}
                    className="drag-handle cursor-grab rounded p-0.5 text-muted-light hover:bg-hover-light active:cursor-grabbing dark:text-muted-dark dark:hover:bg-hover-dark"
                    title="Drag to move"
                >
                    <DragHandleIcon className="h-3.5 w-3.5" />
                </span>
            </div>

            <div className="relative min-w-0 flex-1 py-0.5">
                <BlockBody
                    block={block}
                    ordinal={ordinal}
                    editableProps={commonEditableProps}
                    onToggleTodo={() => toggleTodo(pageId, block.id)}
                    onToggleCollapsed={() => toggleCollapsed(pageId, block.id)}
                    onDeleteDivider={() => deleteBlock(pageId, block.id)}
                    onAddAfterDivider={handleAddBelow}
                />
                {slashOpen && (
                    <SlashMenu
                        query={slashQuery}
                        onSelect={handleSelectType}
                        onClose={() => setSlashOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}

function BlockBody({
    block,
    ordinal,
    editableProps,
    onToggleTodo,
    onToggleCollapsed,
    onDeleteDivider,
    onAddAfterDivider,
}: {
    block: Block;
    ordinal?: number;
    editableProps: any;
    onToggleTodo: () => void;
    onToggleCollapsed: () => void;
    onDeleteDivider: () => void;
    onAddAfterDivider: () => void;
}) {
    switch (block.type) {
        case 'heading1':
            return (
                <div
                    {...editableProps}
                    className={
                        editableProps.className + ' text-3xl font-bold pt-2'
                    }
                />
            );
        case 'heading2':
            return (
                <div
                    {...editableProps}
                    className={
                        editableProps.className +
                        ' text-2xl font-semibold pt-1.5'
                    }
                />
            );
        case 'heading3':
            return (
                <div
                    {...editableProps}
                    className={
                        editableProps.className + ' text-xl font-semibold pt-1'
                    }
                />
            );
        case 'bulleted':
            return (
                <div className="flex items-start gap-2">
                    <span className="mt-0.5 select-none leading-6">•</span>
                    <div
                        {...editableProps}
                        className={editableProps.className + ' leading-6'}
                    />
                </div>
            );
        case 'numbered':
            return (
                <div className="flex items-start gap-2">
                    <span className="mt-0.5 min-w-[1.2rem] select-none leading-6 text-ink-light dark:text-ink-dark">
                        {(ordinal ?? 1) + '.'}
                    </span>
                    <div
                        {...editableProps}
                        className={editableProps.className + ' leading-6'}
                    />
                </div>
            );
        case 'todo':
            return (
                <div className="flex items-start gap-2">
                    <button
                        onClick={onToggleTodo}
                        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            block.checked
                                ? 'border-accent bg-accent text-white'
                                : 'border-muted-light dark:border-muted-dark'
                        }`}
                    >
                        {block.checked && <CheckIcon className="h-3 w-3" />}
                    </button>
                    <div
                        {...editableProps}
                        className={
                            editableProps.className +
                            ` leading-6 ${block.checked ? 'text-muted-light line-through dark:text-muted-dark' : ''}`
                        }
                    />
                </div>
            );
        case 'toggle':
            return (
                <div className="flex items-start gap-1">
                    <button
                        onClick={onToggleCollapsed}
                        className="mt-1 shrink-0 rounded p-0.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                    >
                        <ChevronRightIcon
                            className={`h-3.5 w-3.5 transition-transform ${!block.collapsed ? 'rotate-90' : ''}`}
                        />
                    </button>
                    <div
                        {...editableProps}
                        className={editableProps.className + ' leading-6'}
                    />
                </div>
            );
        case 'quote':
            return (
                <div className="border-l-[3px] border-ink-light pl-3 dark:border-ink-dark">
                    <div
                        {...editableProps}
                        className={
                            editableProps.className + ' italic leading-6'
                        }
                    />
                </div>
            );
        case 'callout':
            return (
                <div className="flex items-start gap-3 rounded-md bg-[#f1f1ef] p-3 dark:bg-[#2c2c2c]">
                    <span className="select-none text-lg leading-6">💡</span>
                    <div
                        {...editableProps}
                        className={editableProps.className + ' leading-6'}
                    />
                </div>
            );
        case 'code':
            return (
                <div className="rounded-md bg-[#f7f6f3] p-3 font-mono text-sm dark:bg-[#2c2c2c]">
                    <div
                        {...editableProps}
                        className={
                            editableProps.className + ' whitespace-pre-wrap'
                        }
                    />
                </div>
            );
        case 'divider':
            return (
                <div
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' || e.key === 'Delete') {
                            e.preventDefault();
                            onDeleteDivider();
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            onAddAfterDivider();
                        }
                    }}
                    className="my-2 cursor-pointer rounded py-2 outline-none focus:ring-1 focus:ring-accent"
                >
                    <hr className="border-border-light dark:border-border-dark" />
                </div>
            );
        case 'paragraph':
        default:
            return (
                <div
                    {...editableProps}
                    className={editableProps.className + ' leading-6'}
                />
            );
    }
}
