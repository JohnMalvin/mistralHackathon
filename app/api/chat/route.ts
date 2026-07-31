import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';
import { ChatSession } from '@/models/ChatSession'; // Adjust import paths to match your project

/**
 * Reconstructs the workspace context from MongoDB by fetching
 * the parent Project and merging all child Pages into clean Markdown.
 */
async function getReconstructedJiraContext(projectId?: string) {
  await connectToDatabase();

  // 1. Fetch Project (by ID or fallback to the most recently updated project)
  const project = projectId
    ? await Project.findById(projectId).lean()
    : await Project.findOne().sort({ updatedAt: -1 }).lean();

  if (!project) return 'No Jira context found in database.';

  // 2. Fetch all Pages belonging to this Project
  const pages = await Page.find({ projectId: project._id }).lean();

  // 3. Format into a unified Markdown string
  const projectHeader = `# Project: ${project.name} (Key: ${project.jiraProjectKey || 'N/A'})\n\n`;

  const pagesContent = pages
    .map(
      (p: any) => `## Page: ${p.title}\n${JSON.stringify(p.content, null, 2)}`
    )
    .join('\n\n---\n\n');

  return `${projectHeader}${pagesContent}`;
}

export async function POST(req: Request) {
  try {
    const { message, sessionId, projectId } = await req.json();

    if (!message || !sessionId) {
      return new Response('Missing message or sessionId parameter', { status: 400 });
    }

    await connectToDatabase();

    // 1. Reconstruct full workspace context from DB (Projects + Pages)
    const reconstructedContext = await getReconstructedJiraContext(projectId);

    // 2. Load or initialize chat session
    let chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      chatSession = new ChatSession({
        sessionId,
        messages: [],
      });
    }

    // Append and IMMEDIATELY SAVE user message to prevent data loss if stream breaks
    chatSession.messages.push({ role: 'user', content: message });
    await chatSession.save();

    // Format chat history for Mistral payload
    const formattedHistory = chatSession.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const apiMessages = [
      {
        role: 'system',
        content: `You are an AI assistant for project management updates. Use the provided Jira workspace documentation (Project details and Sprint/Technical pages) to accurately answer user queries.\n\nContext Documentation:\n${reconstructedContext}`,
      },
      ...formattedHistory,
    ];

    // 3. Request streaming response from Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        stream: true,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Mistral API Error: ${errorText}`, { status: response.status });
    }

    // 4. Stream response and buffer for DB persistence
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedAssistantResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') break;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.replace('data: ', ''));
                const content = json.choices[0]?.delta?.content;
                if (content) {
                  accumulatedAssistantResponse += content;
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error('Error parsing SSE line', e);
              }
            }
          }
        }

        // Atomic push to update assistant response in MongoDB upon completion
        if (accumulatedAssistantResponse) {
          try {
            await ChatSession.updateOne(
              { sessionId },
              {
                $push: {
                  messages: {
                    role: 'assistant',
                    content: accumulatedAssistantResponse,
                    createdAt: new Date(),
                  },
                },
              }
            );
          } catch (dbErr) {
            console.error('Failed to save assistant response to DB:', dbErr);
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('POST Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}