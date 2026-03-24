// ═══════════════════════════════════════════════════
// EDGE FUNCTION: agent-atendente (Agente 2 — Atendente Virtual)
// POST /functions/v1/agent-atendente
// Body: { cliente_id: number, mensagem: string, canal: string, history?: array }
// Response: { resposta: string, acoes?: array }
// SELF-CONTAINED — no shared imports
// ═══════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CORS ──
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Supabase Admin ──
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ── Claude API ──
async function callClaude(opts: { system: string; messages: any[]; max_tokens: number }) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: opts.max_tokens,
      system: opts.system,
      messages: opts.messages,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('Anthropic API error:', resp.status, errBody);
    throw new Error(`Anthropic error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return { reply: data.content?.[0]?.text || '', usage: data.usage };
}

// ── Rate Limit ──
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;
const requestLog: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT_MAX) return false;
  requestLog.push(now);
  return true;
}

// ── Extract Actions ──
function extractActions(text: string): any[] {
  const actions: any[] = [];
  const regex = /```action\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      actions.push(JSON.parse(match[1].trim()));
    } catch (e) {
      console.error('Failed to parse action:', match[1]);
    }
  }
  return actions;
}

// ── Main Handler ──
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!checkRateLimit()) {
      return new Response(
        JSON.stringify({ error: 'Rate limit atingido.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cliente_id, mensagem, canal, history = [] } = await req.json();

    if (!mensagem || typeof mensagem !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Campo "mensagem" é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseAdmin();

    // Buscar dados necessários em paralelo
    const [
      { data: settings },
      { data: cliente },
      { data: produtos },
      { data: fornadas },
      { data: localidades },
      { data: grupos },
      { data: pedidosCliente },
    ] = await Promise.all([
      supabase.from('settings').select('prompt_agente2').eq('id', 1).single(),
      cliente_id ? supabase.from('clientes').select('*').eq('id', cliente_id).single() : Promise.resolve({ data: null }),
      supabase.from('produtos').select('*').gt('quantidade', 0).order('categoria'),
      supabase.from('fornadas').select('*').gte('data', new Date().toISOString().slice(0, 10)).order('data'),
      supabase.from('localidades').select('*'),
      supabase.from('grupos').select('*'),
      cliente_id ? supabase.from('pedidos').select('*').eq('cliente_id', cliente_id).order('data_pedido', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
    ]);

    const promptBase = settings?.prompt_agente2 || 'Você é o atendente virtual da Taboca Pão e Pizza.';
    const grupo = cliente?.grupo_id ? grupos?.find((g: any) => g.id === cliente.grupo_id) : null;

    // Montar system prompt completo
    const systemPrompt = `${promptBase}

INFORMAÇÕES DO CLIENTE:
${cliente ? `
- Nome: ${cliente.nome}
- WhatsApp: ${cliente.whatsapp || 'N/A'}
- Instagram: ${cliente.instagram || 'N/A'}
- Endereço: ${cliente.endereco_completo || 'Não cadastrado'}
- Localidade: ${localidades?.find((l: any) => l.id === cliente.localidade_id)?.nome_localidade || 'N/A'}
- Grupo: ${grupo?.nome_grupo || 'Não classificado'} ${grupo?.descricao ? `(${grupo.descricao})` : ''}
- Preferências: ${cliente.preferencias || 'Nenhuma registrada'}
- Cliente desde: ${cliente.data_cadastro || 'N/A'}
` : `
- Cliente NÃO CADASTRADO (identificar pelo ${canal} e oferecer cadastro)
`}

${pedidosCliente && pedidosCliente.length > 0 ? `HISTÓRICO DE PEDIDOS (últimos ${pedidosCliente.length}):
${pedidosCliente.map((p: any) => `- Pedido #${p.id}: R$${p.valor_total} em ${p.data_pedido} — ${p.status_entrega}`).join('\n')}
` : 'HISTÓRICO: Nenhum pedido anterior.'}

CARDÁPIO DISPONÍVEL:
${produtos?.map((p: any) => `- ${p.emoji || '🍞'} ${p.nome} (${p.categoria}) — R$ ${Number(p.valor_unitario).toFixed(2)} — ${p.quantidade} disponíveis${p.descricao ? ` — ${p.descricao}` : ''}`).join('\n') || 'Nenhum produto disponível no momento.'}

PRÓXIMAS FORNADAS:
${fornadas?.map((f: any) => `- ${f.data} (${f.tipo}) — ${f.hora_inicio} a ${f.hora_fim} — Encomendas até: ${f.encerramento_encomenda || 'N/A'}`).join('\n') || 'Nenhuma fornada programada.'}

LOCALIDADES E FRETES:
${localidades?.map((l: any) => `- ${l.nome_localidade}: R$ ${Number(l.valor_entrega).toFixed(2)} (${l.tempo_estimado || 'N/A'})`).join('\n') || 'Nenhuma localidade cadastrada.'}

CANAL DE ATENDIMENTO: ${canal || 'whatsapp'}

ABORDAGEM POR GRUPO:
- Potenciais: Alta exclusividade, explicar funcionamento, oferecer entrega grátis na 1ª compra ou 10% desconto 3+ produtos, coletar dados completos
- Novos: Conversa direta, sugerir preferências, confirmar endereço
- Esporádicos: Similar aos novos, confirmar endereço
- Fixos: Ultra-direta, sugerir preferências, confirmar endereço
- Colaborador: Provavelmente busca informações

INSTRUÇÕES DE RESPOSTA:
- Seja breve e amigável (estilo WhatsApp)
- Use emojis moderadamente
- Quando o cliente confirmar um pedido, retorne a ação em formato JSON dentro de um bloco \`\`\`action
- Ações possíveis: criar_pedido, atualizar_cliente, encaminhar_tiba

FORMATO DE AÇÃO (quando aplicável):
\`\`\`action
{
  "type": "criar_pedido|atualizar_cliente|encaminhar_tiba",
  "data": { campos_relevantes },
  "description": "Descrição da ação"
}
\`\`\``;

    // Montar mensagens
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: mensagem },
    ];

    const { reply, usage } = await callClaude({
      system: systemPrompt,
      messages,
      max_tokens: 1024,
    });

    // Extrair ações
    const acoes = extractActions(reply);
    const cleanReply = reply.replace(/```action\n[\s\S]*?```/g, '').trim();

    return new Response(
      JSON.stringify({
        resposta: cleanReply,
        acoes: acoes.length > 0 ? acoes : undefined,
        usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('agent-atendente error:', error);

    // Fallback message quando IA falha
    return new Response(
      JSON.stringify({
        resposta: 'Recebemos sua mensagem! 😊 Nosso atendente vai responder em breve. Obrigado pela paciência!',
        fallback: true,
        error: error.message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
