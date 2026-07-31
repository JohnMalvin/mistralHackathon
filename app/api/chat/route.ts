// app/api/chat/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { ChatSession } from '@/models/ChatSession';
import { buildPageAIContext, formatPageAIContext } from '@/lib/aiContext';

export async function POST(req: Request) {
  try {
    // 1. Extract authenticated user details passed by middleware
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');

    const { message, sessionId, pageId, scope } = await req.json();

    if (!message || !sessionId) {
      return Response.json(
        { error: 'Missing message or sessionId parameter' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // pageId is the Mongo id of the page currently open in the editor
    // (PageData.dbSourceId client-side) — only pages that came from an
    // imported company/project have one, so only those get real context.
    let reconstructedContext =
      "No page is open, or this page isn't part of an imported company/project yet, so there's no extra context beyond this conversation.";
    if (pageId) {
      const ctx = await buildPageAIContext(pageId);
      if (ctx) {
        reconstructedContext = formatPageAIContext(ctx, scope === 'page' ? 'page' : 'project');
      }
    }

    // Bind chat session to the authenticated userId
    let chatSession = await ChatSession.findOne({ sessionId, userId });

    if (!chatSession) {
      chatSession = new ChatSession({
        sessionId,
        userId, // Linked to the authenticated user!
        messages: [],
      });
    }

    chatSession.messages.push({ role: 'user', content: message });
    await chatSession.save();

    const formattedHistory = chatSession.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const apiMessages = [
      {
        role: 'system',
        content: `You are an AI assistant for project management updates. Active User Email: ${userEmail}

Formatting rules — this reply is shown as plain text, not rendered markdown, so:
- Never use markdown syntax: no **bold**, no *italics*, no # headings, no [text](url) links, no backticks.
- For lists, use a real bullet character (•) followed by a space, one per line.
- Separate paragraphs with a blank line.
- Write URLs out in full and bare, e.g. https://example.com/page.
- Write like you're talking to someone, not formatting a document.

Context Documentation:
${reconstructedContext}`,
      },
      ...formattedHistory,
    ];

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
                console.error('SSE Error', e);
              }
            }
          }
        }

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
            console.error('Failed to update DB:', dbErr);
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