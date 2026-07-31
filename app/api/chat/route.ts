import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';

export async function POST(req: Request) {
  try {
    const { messages, companyId } = await req.json();

    if (!companyId) {
      return new Response('Missing companyId parameter', { status: 400 });
    }

    // 1. Connect directly to MongoDB
    await connectToDatabase();

    // 2. Query company data directly using Mongoose
    const company = await Company.findOne(
      { name: companyId }, // or { companyId: companyId } depending on your schema field
      { jiraData: 1, _id: 0 }
    ).lean();

    // Extract jiraData string/JSON or default to fallback message
    const jiraMarkdownContext = company?.jiraData
      ? typeof company.jiraData === 'string'
        ? company.jiraData
        : JSON.stringify(company.jiraData)
      : 'No Jira context found for this company.';

    // 3. Call Mistral REST API using native fetch
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
            content: `You are an AI assistant for company: ${companyId}.\n\n
                      Context Jira Documentation:\n${jiraMarkdownContext}`,
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Mistral API Error: ${errorText}`, { status: response.status });
    }

    // 4. Parse Mistral SSE stream and forward plain text to frontend
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