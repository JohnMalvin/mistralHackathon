export async function POST(req: Request) {
  try {
    const { messages, companyId } = await req.json();

    // Context / Jira markdown data
    const jiraMarkdownContext = `
    # Jira Active Tickets
    - JIRA-101: Authentication fix. Status: In Progress.
    `;

    // 1. Call Mistral REST API directly using native fetch
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for ${companyId}. Context:\n${jiraMarkdownContext}`,
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Mistral API Error: ${errorText}`, { status: response.status });
    }

    // 2. Parse Mistral's Server-Sent Events (SSE) and stream plain text chunks to frontend
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

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
          buffer = lines.pop() || ''; // Keep incomplete trailing lines in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue; // Skip heartbeats/empty lines
            if (trimmed === 'data: [DONE]') break;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.replace('data: ', ''));
                const content = json.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error('Error parsing SSE line', e);
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}