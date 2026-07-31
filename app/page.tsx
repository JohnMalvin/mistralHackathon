import Link from 'next/link';

// One indent level, mirrored from --step in the .gb block of globals.css.
const STEP = 26;

// A real slice of a Jira project, shown at the depth it lands at once the
// board has been rebuilt as pages. The rows animate from flat (every key
// hard against the left margin, the way a board hands them to you) to this
// shape — the whole product in one gesture.
const OUTLINE: {
    key: string;
    summary: string;
    depth: number;
    state: string;
    parent?: boolean;
}[] = [
    { key: 'SC-101', summary: 'Checkout rewrite', depth: 0, state: 'Epic', parent: true },
    { key: 'SC-118', summary: 'Card tokenization service', depth: 1, state: 'In progress', parent: true },
    { key: 'SC-131', summary: 'Retry when 3-D Secure times out', depth: 2, state: 'In review' },
    { key: 'SC-142', summary: 'Rotate vault keys without downtime', depth: 2, state: 'Backlog' },
    { key: 'SC-119', summary: 'Guest checkout', depth: 1, state: 'In progress', parent: true },
    { key: 'SC-127', summary: 'Address autofill from postcode', depth: 2, state: 'Done' },
    { key: 'SC-102', summary: 'Refunds', depth: 0, state: 'Epic', parent: true },
    { key: 'SC-121', summary: 'Partial refund API', depth: 1, state: 'Backlog' },
    { key: 'SC-134', summary: 'Audit trail for every refund', depth: 1, state: 'Backlog' },
];

// Connect, restructure, ask is an actual order of operations — you cannot ask
// before the tree exists — so the steps are numbered.
const STEPS = [
    {
        n: '01',
        name: 'Connect a board',
        body: 'Paste a Jira board or issue link. LexiCode reads the project with your credentials and pulls every issue, description, and status.',
    },
    {
        n: '02',
        name: 'Get the outline back',
        body: 'Epics become parent pages. Stories and subtasks nest beneath them. Descriptions arrive as editable blocks, so you can write around the ticket instead of inside it.',
    },
    {
        n: '03',
        name: 'Ask across the tree',
        body: 'Questions run against the whole workspace, not one page — Mistral Large answers with the issues, pages, and statuses underneath as context.',
    },
];

function Listing() {
    return (
        <div className="gb-listing">
            {/* Column heads, the way a printed report names its columns —
                spacer and min-width mirror a row so they sit over them. */}
            <div className="gb-line !min-h-0 border-b border-[var(--rule)] py-2">
                <span className="w-2 shrink-0" />
                <span className="gb-label min-w-[54px]">Key</span>
                <span className="gb-label">Summary</span>
                <span className="gb-label gb-state hidden sm:block">Status</span>
            </div>

            <ul>
                {OUTLINE.map((row, i) => (
                    <li
                        key={row.key}
                        className="gb-line"
                        style={
                            {
                                '--x': `${row.depth * STEP}px`,
                                '--d': `${260 + i * 55}ms`,
                            } as React.CSSProperties
                        }
                    >
                        {/* One hairline per level of ancestry. */}
                        <span className="gb-guides" aria-hidden="true">
                            {Array.from({ length: row.depth }).map((_, g) => (
                                <span
                                    key={g}
                                    className="gb-guide"
                                    style={
                                        {
                                            '--d': `${260 + i * 55}ms`,
                                        } as React.CSSProperties
                                    }
                                />
                            ))}
                        </span>

                        <span className="gb-shift">
                            <span
                                className={`gb-toggle${row.parent ? ' gb-caret' : ''}`}
                                aria-hidden="true"
                            />
                            <span className="gb-key">{row.key}</span>
                            <span className="gb-summary">{row.summary}</span>
                        </span>

                        {/* Outside .gb-shift — the status column holds the
                            right edge while the rest of the row indents. */}
                        <span className="gb-label gb-state hidden sm:block">
                            {row.state}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function LandingPage() {
    return (
        <div className="gb min-h-screen">
            {/* MASTHEAD */}
            <header className="mx-auto flex max-w-[1120px] items-baseline justify-between gap-6 px-6 py-6">
                <Link href="/" className="flex items-baseline gap-2.5">
                    <span className="gb-display text-[19px] uppercase">
                        LexiCode
                    </span>
                    <span className="gb-label hidden sm:block">
                        Jira → pages
                    </span>
                </Link>

                <nav className="flex items-baseline gap-6 text-sm">
                    <a
                        href="#how"
                        className="hidden text-[var(--ink)]/70 underline-offset-4 hover:text-[var(--ink)] hover:underline sm:block"
                    >
                        How it works
                    </a>
                    <Link
                        href="/login"
                        className="text-[var(--ink)]/70 underline-offset-4 hover:text-[var(--ink)] hover:underline"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/register"
                        className="bg-[var(--ribbon)] px-3.5 py-2 text-sm font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
                    >
                        Create account
                    </Link>
                </nav>
            </header>

            <hr className="gb-rule" />

            {/* HERO — the headline states the thesis, the listing proves it */}
            <main>
                <section className="mx-auto max-w-[1120px] px-6 pb-12 pt-16 sm:pt-24">
                    <p className="gb-label mb-6">
                        Live example — Jira project SC
                    </p>

                    <h1 className="gb-display max-w-[15ch] text-[clamp(2.6rem,8vw,5.4rem)]">
                        A backlog is a document that lost its outline.
                    </h1>

                    <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink)]/80">
                        LexiCode reads your Jira project and gives the
                        outline back — epics as parent pages, everything else
                        nested underneath, every issue still carrying its key.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                        <Link
                            href="/register"
                            className="bg-[var(--ribbon)] px-6 py-3.5 font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
                        >
                            Create account
                        </Link>
                        <a
                            href="#how"
                            className="text-[var(--ink)]/75 underline underline-offset-4 hover:text-[var(--ink)]"
                        >
                            See how it works
                        </a>
                    </div>
                </section>

                <section className="mx-auto max-w-[1120px] px-6 pb-20">
                    <Listing />
                    <p className="mt-4 max-w-[60ch] text-sm text-[var(--ink)]/60">
                        Nine issues from project SC. Nothing here was rewritten
                        — the rows only found their parents.
                    </p>
                </section>

                <hr className="gb-rule" />

                {/* THREE MOVES */}
                <section id="how" className="mx-auto max-w-[1120px] px-6 py-20">
                    <h2 className="gb-display mb-10 text-[clamp(1.7rem,3.4vw,2.5rem)]">
                        Three moves, in order
                    </h2>

                    <div className="gb-listing">
                        {STEPS.map((step) => (
                            <div
                                key={step.n}
                                className="gb-line !items-start gap-x-6 py-6 sm:gap-x-10"
                            >
                                <span className="gb-label mt-1 w-6 shrink-0 !text-[var(--stamp)]">
                                    {step.n}
                                </span>
                                <div className="grid flex-1 gap-2 sm:grid-cols-[15rem_1fr] sm:gap-8">
                                    <h3 className="gb-display text-[19px] leading-snug">
                                        {step.name}
                                    </h3>
                                    <p className="max-w-[58ch] text-[15px] leading-relaxed text-[var(--ink)]/75">
                                        {step.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="gb-rule" />

                {/* TWO WAYS IN — mirrors the two account types on /register */}
                <section className="mx-auto max-w-[1120px] px-6 py-20">
                    <h2 className="gb-display mb-3 text-[clamp(1.7rem,3.4vw,2.5rem)]">
                        Two ways to sign up
                    </h2>
                    <p className="mb-10 max-w-[52ch] text-[15px] text-[var(--ink)]/70">
                        Pick the one that matches how you work. You choose it
                        when you create your account.
                    </p>

                    <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
                        <div className="bg-[var(--paper)] p-8">
                            <p className="gb-label mb-4">Individual</p>
                            <h3 className="gb-display mb-3 text-2xl">
                                Your own boards
                            </h3>
                            <p className="mb-6 max-w-[38ch] text-[15px] leading-relaxed text-[var(--ink)]/75">
                                One person, one workspace. Import the projects
                                you work on and keep your notes beside them.
                            </p>
                            <Link
                                href="/register"
                                className="gb-mono text-sm text-[var(--ribbon)] underline underline-offset-4"
                            >
                                Create an individual account
                            </Link>
                        </div>

                        <div className="bg-[var(--bar)] p-8">
                            <p className="gb-label mb-4">Business</p>
                            <h3 className="gb-display mb-3 text-2xl">
                                Your whole company
                            </h3>
                            <p className="mb-6 max-w-[38ch] text-[15px] leading-relaxed text-[var(--ink)]/75">
                                Register under a company name, then share a
                                workspace by link so everyone reads the same
                                tree.
                            </p>
                            <Link
                                href="/register?type=business"
                                className="gb-mono text-sm text-[var(--ribbon)] underline underline-offset-4"
                            >
                                Create a business account
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <hr className="gb-rule" />

            <footer className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-10 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="gb-display text-[15px] uppercase">
                    LexiCode
                </span>
                <p className="gb-label !tracking-[0.1em]">
                    Jira import · Mistral Large · {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}
