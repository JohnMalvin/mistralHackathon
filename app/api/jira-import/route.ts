import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { Workspace } from '@/models/Workspace';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';
import { normalizePageJson } from '@/lib/pageJson';
import { parseJiraLink, adfToText, iconForIssueType } from '@/lib/jira';

const JIRA_IMPORT_COMPANY = 'Jira Imports';
// Used to scope the "Jira Imports" company when there's no logged-in
// session (this route is exempt from the auth middleware) — a fixed id so
// repeated unauthenticated imports land in the same company.
const LOCAL_OWNER_ID = '000000000000000000000001';

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
// POST: Pull a Jira project straight from the Jira REST API and lay it
// out as a page tree — one directory per issue type, one file per issue.
// Body JSON: { "link": "https://your-domain.atlassian.net/.../projects/SC/..." }
// -------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || LOCAL_OWNER_ID;
        const userEmail = request.headers.get('x-user-email') || process.env.JIRA_EMAIL;
        if (!userEmail) {
            return NextResponse.json(
                { error: 'No session and no JIRA_EMAIL configured to authenticate against Jira with' },
                { status: 400 },
            );
        }

        const { link } = await request.json();
        const parsed = typeof link === 'string' ? parseJiraLink(link) : null;
        if (!parsed) {
            return NextResponse.json(
                { error: 'Could not find a project key in that Jira link' },
                { status: 400 },
            );
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

        await connectToDatabase();

        let company = await Company.findOne({ name: JIRA_IMPORT_COMPANY, userId });
        if (!company) company = await Company.create({ name: JIRA_IMPORT_COMPANY, userId });

        let workspace = await Workspace.findOne({ name: jiraProject.name, companyId: company._id });
        if (!workspace) workspace = await Workspace.create({ name: jiraProject.name, companyId: company._id });

        const project = await Project.create({
            name: `${jiraProject.name} — ${new Date().toLocaleDateString()}`,
            workspaceId: workspace._id,
            rootPageIds: [],
        });

        const groups = new Map<string, any[]>();
        for (const issue of issues) {
            const typeName: string = issue.fields?.issuetype?.name ?? 'Other';
            if (!groups.has(typeName)) groups.set(typeName, []);
            groups.get(typeName)!.push(issue);
        }

        for (const [typeName, typeIssues] of groups) {
            const dirId = await createPage(project._id, null, {
                title: `${typeName}s`,
                icon: '📁',
                blocks: [{ type: 'heading2', content: `${typeName}s (${typeIssues.length})` }],
            });

            for (const issue of typeIssues) {
                const status = issue.fields?.status?.name ?? 'Unknown';
                const assignee = issue.fields?.assignee?.displayName ?? 'Unassigned';
                const description = adfToText(issue.fields?.description).trim();

                await createPage(project._id, dirId, {
                    title: `${issue.key}: ${issue.fields?.summary ?? 'Untitled'}`,
                    icon: iconForIssueType(typeName),
                    blocks: [
                        { type: 'heading3', content: issue.fields?.summary ?? issue.key },
                        { type: 'callout', content: `Status: ${status} · Assignee: ${assignee}` },
                        ...(description ? [{ type: 'paragraph', content: description }] : []),
                        { type: 'code', content: `${parsed.baseUrl}/browse/${issue.key}` },
                    ],
                });
            }
        }

        return NextResponse.json(
            {
                projectId: project._id.toString(),
                projectName: project.name,
                issueCount: issues.length,
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
