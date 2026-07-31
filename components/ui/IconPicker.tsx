'use client';

const EMOJIS = [
    '📄',
    '📝',
    '📌',
    '📎',
    '📅',
    '📚',
    '📁',
    '🗂️',
    '💡',
    '🔥',
    '⭐',
    '🚀',
    '🎯',
    '🎨',
    '🎬',
    '🎧',
    '💻',
    '🧠',
    '🛠️',
    '🔬',
    '🌱',
    '🌍',
    '🌙',
    '☀️',
    '❤️',
    '✅',
    '⚡',
    '🔑',
    '🏆',
    '📊',
    '💬',
    '🗓️',
    '👋',
    '🙌',
    '🤔',
    '🧩',
    '📦',
    '🧭',
    '🍀',
    '🎉',
];

export default function IconPicker({
    onSelect,
    onClose,
}: {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}) {
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-fadeIn rounded-md border border-border-light bg-canvas-light p-2 shadow-popover dark:border-border-dark dark:bg-[#252525]">
                <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                        <button
                            key={e}
                            onClick={() => {
                                onSelect(e);
                                onClose();
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-hover-light dark:hover:bg-hover-dark"
                        >
                            {e}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => {
                        onSelect('');
                        onClose();
                    }}
                    className="mt-2 w-full rounded px-2 py-1 text-left text-xs text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                >
                    Remove icon
                </button>
            </div>
        </>
    );
}
