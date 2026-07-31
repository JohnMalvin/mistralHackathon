import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { Workspace } from '@/models/Workspace';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';
import { normalizePageJson } from '@/lib/pageJson';
import { parseJiraLink, adfToText, iconForIssueType } from '@/lib/jira';

const JIRA_IMPORT_COMPANY = 'Jira Imports';
// Used to scope the fallback "Jira Imports" company when there's no
// logged-in session — a fixed id so repeated unauthenticated imports land
// in the same company instead of a new one each time.
const LOCAL_OWNER_ID = '000000000000000000000001';

interface FlatIssue {
    key: string;
    type: string;
    summary: string;
    status: string;
    assignee: string;
    description: string;
}

interface TranslatedFile {
    issueKey: string;
    title: string;
    narrative: string;
    status: string;
    owner: string;
}

interface TranslatedDirectory {
    name: string;
    icon?: string;
    summary: string;
    files: TranslatedFile[];
}

interface TranslatedProject {
    projectSummary: string;
    directories: TranslatedDirectory[];
}

// Hands the raw Jira issues to Mistral and has it rewrite them into a
// non-developer-readable knowledge base: a handful of plain-language
// workstreams ("directories"), each containing plain-language issue
// write-ups ("files") — no ticket jargon, no internal field names.
async function translateForNonDevelopers(
    projectName: string,
    issues: FlatIssue[],
): Promise<TranslatedProject> {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'mistral-large-latest',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You turn raw Jira issue data into a project knowledge base that a non-technical stakeholder can read. Group the issues into 3-8 logical workstreams (not raw Jira issue types or statuses) — favor fewer, broader workstreams over many narrow ones, and never create a workstream for just one issue unless the project truly has only one issue. Rewrite each issue as a short plain-language entry — no ticket jargon, no internal field names, no unexplained acronyms.

Output MUST be strictly valid JSON matching this schema:
{
  "projectSummary": "1-2 plain-language paragraphs describing what this project is and where it stands",
  "directories": [
    {
      "name": "Human-friendly workstream name",
      "icon": "a single emoji",
      "summary": "1-2 sentence plain-language description of this workstream",
      "files": [
        {
          "issueKey": "must exactly match one of the provided issue keys",
          "title": "plain-language rewrite of the issue's title",
          "narrative": "2-4 sentences: what it is, why it matters, current state — plain language",
          "status": "plain-language status (e.g. Not started, In progress, Done, Blocked)",
          "owner": "the assignee's name, or Unassigned"
        }
      ]
    }
  ]
}
Every issue key given to you must appear in exactly one file, and no file may use a key that wasn't given to you.`,
                },
                {
                    role: 'user',
                    content: `Project: ${projectName}\n\nIssues (JSON):\n${JSON.stringify(issues)}`,
                },
            ],
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Mistral translation failed (${res.status}): ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from Mistral');
    return JSON.parse(raw);
}

// Same pattern as /api/companies/seed's createPage: normalize blocks, create
// the page, then link it into its parent's children (or the project root).
async function createPage(
    projectId: unknown,
    parentId: unknown,
    data: { title: string; icon?: string; blocks: unknown[] },
) {
    const { title, icon, blocks } = normalizePageJson(data);
    const page = await Page.create({
        title,
        icon,
        blocks,
        projectId,
        parentId: parentId ?? null,
        children: [],
    });
    if (parentId) {
        await Page.findByIdAndUpdate(parentId, { $push: { children: page._id } });
    } else {
        await Project.findByIdAndUpdate(projectId, {
            $push: { rootPageIds: page._id },
        });
    }
    return page._id;
}

// -------------------------------------------------------------
// POST: Pull a Jira project from the Jira REST API, have Mistral rewrite
// it into plain language, and lay the result out as a page tree — one
// directory per workstream Mistral identifies, one file per issue.
// Body JSON: { "link": "https://your-domain.atlassian.net/.../projects/SC/..." }
// -------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || LOCAL_OWNER_ID;
        // JIRA_API_KEY belongs to one fixed Atlassian account — that account's
        // email always wins, regardless of which app user is signed in. The
        // logged-in user's own email is only a last-resort fallback for setups
        // with no JIRA_EMAIL configured (and where it happens to match).
        const userEmail = process.env.JIRA_EMAIL || request.headers.get('x-user-email');
        if (!userEmail) {
            return NextResponse.json(
                { error: 'No session and no JIRA_EMAIL configured to authenticate against Jira with' },
                { status: 400 },
            );
        }

        const { link, companyId } = await request.json();
        const parsed = typeof link === 'string' ? parseJiraLink(link) : null;
        if (!parsed) {
            return NextResponse.json(
                { error: 'Could not find a project key in that Jira link' },
                { status: 400 },
            );
        }

        if (companyId && !mongoose.Types.ObjectId.isValid(companyId)) {
            return NextResponse.json({ error: 'Invalid company id' }, { status: 400 });
        }

        const jiraToken = process.env.JIRA_API_KEY;
        if (!jiraToken) {
            return NextResponse.json({ error: 'JIRA_API_KEY is not configured' }, { status: 500 });
        }

        const jiraHeaders = {
            Authorization:
                'Basic ' + Buffer.from(`${userEmail}:${jiraToken}`).toString('base64'),
            Accept: 'application/json',
        };

        const projectRes = await fetch(
            `${parsed.baseUrl}/rest/api/3/project/${parsed.projectKey}`,
            { headers: jiraHeaders },
        );
        if (!projectRes.ok) {
            const text = await projectRes.text();
            return NextResponse.json(
                { error: `Jira project lookup failed (${projectRes.status}): ${text.slice(0, 300)}` },
                { status: 502 },
            );
        }
        const jiraProject = await projectRes.json();

        // /rest/api/3/search was removed by Atlassian in favor of this
        // cursor-paginated replacement — same query params, response is
        // { issues, nextPageToken?, isLast } instead of { issues, total }.
        const searchUrl = new URL(`${parsed.baseUrl}/rest/api/3/search/jql`);
        searchUrl.searchParams.set('jql', `project=${parsed.projectKey} ORDER BY created DESC`);
        searchUrl.searchParams.set('maxResults', '100');
        searchUrl.searchParams.set('fields', 'summary,status,issuetype,assignee,description');

        const issuesRes = await fetch(searchUrl, { headers: jiraHeaders });
        if (!issuesRes.ok) {
            const text = await issuesRes.text();
            return NextResponse.json(
                { error: `Jira issue search failed (${issuesRes.status}): ${text.slice(0, 300)}` },
                { status: 502 },
            );
        }
        const { issues } = await issuesRes.json();

        const flatIssues: FlatIssue[] = (issues ?? []).map((issue: any) => ({
            key: issue.key,
            type: issue.fields?.issuetype?.name ?? 'Other',
            summary: issue.fields?.summary ?? '',
            status: issue.fields?.status?.name ?? 'Unknown',
            assignee: issue.fields?.assignee?.displayName ?? 'Unassigned',
            description: adfToText(issue.fields?.description).trim(),
        }));

        if (flatIssues.length === 0) {
            return NextResponse.json(
                { error: 'This Jira project has no issues to import' },
                { status: 422 },
            );
        }

        let translated: TranslatedProject;
        try {
            translated = await translateForNonDevelopers(jiraProject.name, flatIssues);
        } catch (err) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : 'Mistral translation failed' },
                { status: 502 },
            );
        }

        if (!translated.projectSummary || !Array.isArray(translated.directories)) {
            return NextResponse.json(
                { error: 'Invalid payload structure returned from Mistral' },
                { status: 422 },
            );
        }

        await connectToDatabase();

        let company;
        if (companyId) {
            company = await Company.findOne({ _id: companyId, userId });
            if (!company) {
                return NextResponse.json({ error: 'Company not found' }, { status: 404 });
            }
        } else {
            company = await Company.findOne({ name: JIRA_IMPORT_COMPANY, userId });
            if (!company) company = await Company.create({ name: JIRA_IMPORT_COMPANY, userId });
        }

        let workspace = await Workspace.findOne({ name: jiraProject.name, companyId: company._id });
        if (!workspace) workspace = await Workspace.create({ name: jiraProject.name, companyId: company._id });

        const project = await Project.create({
            name: `${jiraProject.name} — ${new Date().toLocaleDateString()}`,
            workspaceId: workspace._id,
            rootPageIds: [],
        });

        const issuesByKey = new Map(flatIssues.map((i) => [i.key, i]));

        await createPage(project._id, null, {
            title: 'Overview',
            icon: '📘',
            blocks: [
                { type: 'heading1', content: jiraProject.name },
                { type: 'paragraph', content: translated.projectSummary },
            ],
        });

        // One page per workstream — every issue in it becomes a heading-3
        // section rather than a separate child page, so the sidebar stays
        // browsable instead of exploding into one page per Jira ticket.
        for (const dir of translated.directories) {
            const files = dir.files ?? [];
            const blocks: unknown[] = [
                { type: 'heading2', content: dir.name || 'Untitled' },
                { type: 'paragraph', content: dir.summary || '' },
            ];

            if (files.length > 0) {
                blocks.push({
                    type: 'table',
                    rows: [
                        ['Item', 'Status', 'Assigned to'],
                        ...files.map((f) => [
                            f.title || f.issueKey,
                            f.status || 'Unknown',
                            f.owner || 'Unassigned',
                        ]),
                    ],
                });
            }

            blocks.push({ type: 'divider', content: '' });

            for (const file of files) {
                const source = issuesByKey.get(file.issueKey);
                const icon = iconForIssueType(source?.type ?? '');
                blocks.push(
                    { type: 'heading3', content: `${icon} ${file.title || file.issueKey}` },
                    { type: 'paragraph', content: file.narrative || '' },
                    {
                        type: 'link',
                        content: 'Open in Jira',
                        href: `${parsed.baseUrl}/browse/${file.issueKey}`,
                    },
                    { type: 'divider', content: '' },
                );
            }

            await createPage(project._id, null, {
                title: dir.name || 'Untitled',
                icon: dir.icon || '📁',
                blocks,
            });
        }

        return NextResponse.json(
            {
                projectId: project._id.toString(),
                projectName: project.name,
                issueCount: flatIssues.length,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('POST /api/jira-import error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error during Jira import' },
            { status: 500 },
        );
    }
}
