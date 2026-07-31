import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { JiraContext } from '@/models/JiraContext';

export async function POST() {
  try {
    const connectorId =
      process.env.MISTRAL_ATLASSIAN_CONNECTOR_ID || '0198e70f-57b0-77f6-a752-0a7f5ea2da35';

    // 1. Trigger Mistral AI with the Atlassian Connector
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
            content: `You are an executive documentation assistant.
Fetch the latest issues, tasks, and epics across the connected Atlassian workspace using the provided connector.

RULES:
1. Search across all active projects/issues in the connected Jira workspace.
2. Eliminate all developer technical jargon (e.g., commit hashes, PRs, specific refactoring terms) and rewrite everything in clean, plain business English.
3. Return strictly valid JSON with this structure:
{
  "executiveSummary": "Overall status summary of active workspace progress",
  "lastSynced": "ISO timestamp",
  "tickets": [
    {
      "id": "JIRA-101",
      "simpleTitle": "Non-technical feature title",
      "status": "In Progress | Done | To Do",
      "simpleDescription": "Clean explanation of what was built and why it matters"
    }
  ]
}`,
          },
          {
            role: 'user',
            content: 'Sync and simplify all recent Jira workspace updates.',
          },
        ],
        tools: [
          {
            type: 'connector',
            connector: {
              id: connectorId,
            },
          },
        ],
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error('Mistral Connector Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to retrieve Jira data from Mistral connector' },
        { status: mistralResponse.status }
      );
    }

    const mistralData = await mistralResponse.json();
    const rawContent = mistralData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Empty response returned from AI connector' },
        { status: 502 }
      );
    }

    // 2. Parse output JSON safely
    let parsedJiraData;
    try {
      parsedJiraData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse AI output into JSON:', rawContent);
      return NextResponse.json(
        { error: 'AI output failed JSON parsing' },
        { status: 500 }
      );
    }

    // 3. Connect & save/overwrite the single JiraContext document
    await connectToDatabase();

    // Use findOneAndUpdate with an empty filter `{}` to ensure single-document storage
    const updatedContext = await JiraContext.findOneAndUpdate(
      {},
      {
        jiraData: parsedJiraData,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        message: 'Jira workspace successfully synced and saved.',
        data: updatedContext.jiraData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}