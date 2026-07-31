import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';

export async function POST(req: Request) {
  try {
    // 1. Extract authenticated user details passed from Middleware
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return Response.json(
        { error: 'Unauthorized: Missing user authentication context' },
        { status: 401 }
      );
    }

    const connectorId =
      process.env.MISTRAL_ATLASSIAN_CONNECTOR_ID || '0198e70f-57b0-77f6-a752-0a7f5ea2da35';

    // 2. Fetch structured workspace data from Mistral AI Jira Connector
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
            content: `You are a project management assistant. Extract tasks and workspace updates using the connected Jira tool and structure them into a high-level project and multiple distinct sub-pages (e.g., Sprints, Deliverables, Technical Spec).

Output MUST be strictly valid JSON matching this schema:
{
  "projectName": "Name of the Jira Workspace or Main Project",
  "jiraProjectKey": "PROJ",
  "pages": [
    {
      "title": "Page Title (e.g., Sprint 1 Overview)",
      "slug": "sprint-1-overview",
      "content": {
        "summary": "Brief summary of this sprint or page...",
        "tickets": [
          {
            "id": "PROJ-101",
            "title": "Task title",
            "status": "In Progress",
            "assignee": "Person Name"
          }
        ]
      }
    }
  ]
}`,
          },
          {
            role: 'user',
            content: 'Fetch and organize current Jira workspace issues into projects and pages.',
          },
        ],
        tools: [
          {
            type: 'connector',
            connector: { id: connectorId },
          },
        ],
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      return Response.json(
        { error: `Mistral Connector Error: ${errorText}` },
        { status: mistralResponse.status }
      );
    }

    const mistralData = await mistralResponse.json();
    const rawContent = mistralData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return Response.json({ error: 'Empty AI response' }, { status: 502 });
    }

    const parsedData = JSON.parse(rawContent);

    if (!parsedData.projectName || !Array.isArray(parsedData.pages)) {
      return Response.json(
        { error: 'Invalid payload structure returned from AI' },
        { status: 422 }
      );
    }

    // 3. Connect to MongoDB
    await connectToDatabase();

    // 4. Upsert primary Project document (scoped to user)
    const project = await Project.findOneAndUpdate(
      { name: parsedData.projectName, userId },
      {
        userId,
        name: parsedData.projectName,
        jiraProjectKey: parsedData.jiraProjectKey || '',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // 5. Upsert each child Page under this Project ID (scoped to user)
    const pageOperations = parsedData.pages.map((pageData: any) =>
      Page.findOneAndUpdate(
        { projectId: project._id, slug: pageData.slug, userId },
        {
          userId,
          projectId: project._id,
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      )
    );

    const savedPages = await Promise.all(pageOperations);

    // 6. Return standard JSON response
    return Response.json(
      {
        message: 'Jira workspace successfully synced to projects and pages.',
        project,
        pagesCount: savedPages.length,
        pages: savedPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Jira Sync Error:', error);
    return Response.json(
      { error: 'Internal Server Error during Jira sync' },
      { status: 500 }
    );
  }
}