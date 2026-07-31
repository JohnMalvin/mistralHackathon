import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { JiraContext } from '@/models/JiraContext';
import { ChatSession } from '@/models/ChatSession';

// ----------------------------------------------------------------------
// GET: Load chat history for a given session
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new Response('Missing sessionId parameter', { status: 400 });
    }

    await connectToDatabase();

    const session = await ChatSession.findOne({ sessionId }, { _id: 0, messages: 1 }).lean();

    return Response.json({ messages: session?.messages || [] });
  } catch (error) {
    console.error('GET Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json();

    if (!message || !sessionId) {
      return new Response('Missing message or sessionId parameter', { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch single Jira context document
    const contextDoc = await JiraContext.findOne({}, { jiraData: 1, _id: 0 }).lean();

    const jiraMarkdownContext = contextDoc?.jiraData
      ? typeof contextDoc.jiraData === 'string'
        ? contextDoc.jiraData
        : JSON.stringify(contextDoc.jiraData)
      : 'No Jira context found.';

    // 2. Load or initialize chat session
    let chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      chatSession = new ChatSession({
        sessionId,
        messages: [],
      });
    }

    // Append and IMMEDIATELY SAVE user message to prevent message loss
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
        content: `You are an AI assistant for project management updates.\n\nContext Jira Documentation:\n${jiraMarkdownContext}`,
      },
      ...formattedHistory,
    ];

    // 3. Call Mistral AI API
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

        // Push assistant reply to DB when streaming completes
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
            console.error('Failed to save assistant response:', dbErr);
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