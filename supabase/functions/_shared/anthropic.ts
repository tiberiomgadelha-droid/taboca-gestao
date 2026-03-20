const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  system: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  model?: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

export async function callClaude(request: AnthropicRequest): Promise<{ reply: string; usage: { input_tokens: number; output_tokens: number } }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada. Configure com: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...');
  }

  const model = request.model || 'claude-sonnet-4-20250514';

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: request.max_tokens || 2048,
      system: request.system,
      messages: request.messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Anthropic API error:', response.status, errorBody);
    throw new Error(`Erro na API Anthropic: ${response.status} — ${errorBody}`);
  }

  const data: AnthropicResponse = await response.json();
  const reply = data.content?.[0]?.text || '';

  return { reply, usage: data.usage };
}
