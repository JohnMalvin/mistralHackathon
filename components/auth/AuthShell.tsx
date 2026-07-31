'use client';

import Link from 'next/link';

// Same masthead and paper as the landing page, so signing in reads as the
// next page of the same document rather than a different product.
export default function AuthShell({
    eyebrow,
    title,
    intro,
    altHref,
    altLabel,
    children,
    footer,
}: {
    eyebrow: string;
    title: string;
    intro: string;
    altHref: string;
    altLabel: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="gb flex min-h-screen flex-col">
            <header className="mx-auto flex w-full max-w-[1120px] items-baseline justify-between gap-6 px-6 py-6">
                <Link href="/" className="flex items-baseline gap-2.5">
                    <span className="gb-display text-[19px] uppercase">
                        Workspace AI
                    </span>
                    <span className="gb-label hidden sm:block">
                        Jira → pages
                    </span>
                </Link>
                <Link
                    href={altHref}
                    className="text-sm text-[var(--ink)]/70 underline-offset-4 hover:text-[var(--ink)] hover:underline"
                >
                    {altLabel}
                </Link>
            </header>

            <hr className="gb-rule" />

            <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-14 sm:py-20">
                <div className="max-w-[420px]">
                    <p className="gb-label mb-5">{eyebrow}</p>
                    <h1 className="gb-display text-[clamp(2rem,5vw,2.9rem)]">
                        {title}
                    </h1>
                    <p className="mb-9 mt-4 text-[15px] leading-relaxed text-[var(--ink)]/75">
                        {intro}
                    </p>

                    {children}

                    <p className="mt-7 text-sm text-[var(--ink)]/70">{footer}</p>
                </div>
            </main>

            <hr className="gb-rule" />

            <footer className="mx-auto w-full max-w-[1120px] px-6 py-8">
                <p className="gb-label !tracking-[0.1em]">
                    Jira import · Mistral Large · {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}
