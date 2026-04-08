// EDGE FUNCTION: agent-gestao (Agente 1 — Assistente de Gestão)
// POST /functions/v1/agent-gestao
// Body: { message: string, context: object, history?: array }
// Response: { reply: string, actions?: array }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callClaude } from '../_shared/anthropic.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 15;
const requestLog: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW) requestLog.shift();
  if (requestLog.length >= RATE_LIMIT_MAX) return false;
  requestLog.push(now);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!checkRateLimit()) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições atingido. Aguarde um momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, context, history = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Campo "message" é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settings } = await supabase.from('settings').select('prompt_agente1').eq('id', 1).single();
    const promptBase = settings?.prompt_agente1 || 'Você é o assistente de gestão da Taboca Pão e Pizza.';

    const systemPrompt = `${promptBase}

DADOS ATUAIS DO SISTEMA (${new Date().toLocaleDateString('pt-BR')}):
${formatContext(context)}

INSTRUÇÕES DE RESPOSTA:
- Responda de forma direta e objetiva, em português brasileiro
- Use formatação com negrito (**), listas e valores em destaque quando apresentar dados
- Quando Tiba pedir para registrar algo (transação, pedido, produção, cliente), retorne a ação em formato JSON dentro de um bloco \`\`\`action
- Ações possíveis: insert, update, delete em qualquer tabela do sistema
- Sempre confirme a ação antes de executar, listando o que será feito
- Se não tiver certeza sobre algo, pergunte
- IMPORTANTE: Use EXATAMENTE os nomes de colunas listados abaixo (em português). NUNCA use nomes em inglês (amount, description, name, etc.)

SCHEMA DAS TABELAS (use estes nomes de colunas EXATOS):
- transactions: { descricao (text), data (timestamp), conta (text: "Caixa"|"PIX"|"Conta Corrente Caixa"), categoria (text), tipo (text: "receita"|"despesa"), valor (decimal) }
- produtos: { nome (text), categoria (text), quantidade (int), valor_unitario (decimal), prazo_validade (date), alerta_minimo (int), emoji (text), descricao (text) }
- insumos: { nome (text), categoria (text), quantidade (decimal), unidade (text), valor_unitario (decimal), prazo_validade (date), alerta_minimo (decimal) }
- producoes: { data (date), produto_id (int), quantidade (int), operador (text), observacao (text), pago_colaborador (bool) }
- pedidos: { cliente_id (int), data_entrega (timestamp), itens (jsonb: [{produto_id, quantidade, valor}]), valor_total (decimal), localidade_id (int), status_producao (text), status_entrega (text), pagamento_confirmado (bool), observacoes (text) }
- clientes: { nome (text), whatsapp (text), instagram (text), endereco_completo (text), localidade_id (int), preferencias (text), grupo_id (int) }
- colaboradores: { nome (text), funcao (text), whatsapp (text), email (text), ativo (bool) }
- activity_log: { tipo (text), descricao (text), data (timestamp), operador (text), icon (text) }

FORMATO DE AÇÃO (quando aplicável):
\`\`\`action
{
  "type": "insert|update|delete",
  "table": "nome_tabela",
  "data": { campos_exatos_do_schema },
  "description": "Descrição legível da ação"
}
\`\`\`

Você pode retornar múltiplas ações. Cada ação deve estar em seu próprio bloco \`\`\`action.`;

    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const { reply, usage } = await callClaude({
      system: systemPrompt,
      messages,
      max_tokens: 2048,
    });

    const actions = extractActions(reply);
    const cleanReply = reply.replace(/```action\n[\s\S]*?```/g, '').trim();

    return new Response(
      JSON.stringify({ reply: cleanReply, actions: actions.length > 0 ? actions : undefined, usage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('agent-gestao error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no assistente.',
        reply: 'Desculpe, ocorreu um erro ao processar sua solicitação. Erro: ' + (error.message || 'desconhecido')
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatContext(ctx: any): string {
  if (!ctx) return 'Contexto não disponível.';
  const lines: string[] = [];
  if (ctx.financeiro) {
    lines.push('📊 FINANCEIRO DO MÊS:');
    lines.push(`  - Receita: R$ ${(ctx.financeiro.receita || 0).toFixed(2)}`);
    lines.push(`  - Despesas: R$ ${(ctx.financeiro.despesa || 0).toFixed(2)}`);
    lines.push(`  - Lucro: R$ ${(ctx.financeiro.lucro || 0).toFixed(2)}`);
    lines.push(`  - Meta: R$ ${(ctx.financeiro.meta || 0).toFixed(2)} (${(ctx.financeiro.percentual_meta || 0).toFixed(1)}% atingido)`);
  }
  if (ctx.estoque) {
    lines.push('\n📦 ESTOQUE:');
    if (ctx.estoque.produtos) lines.push(`  Produtos: ${ctx.estoque.produtos.map((p: any) => `${p.nome}: ${p.quantidade} unid (R$${p.valor_unitario})`).join(', ')}`);
    if (ctx.estoque.alertas?.length > 0) lines.push(`  ⚠️ ALERTAS: ${ctx.estoque.alertas.join('; ')}`);
    if (ctx.estoque.insumos) lines.push(`  Insumos: ${ctx.estoque.insumos.map((i: any) => `${i.nome}: ${i.quantidade}${i.unidade}`).join(', ')}`);
  }
  if (ctx.pedidos) {
    lines.push(`\n🛒 PEDIDOS EM ABERTO: ${ctx.pedidos.length}`);
    ctx.pedidos.slice(0, 10).forEach((p: any) => {
      lines.push(`  - Pedido #${p.id}: ${p.cliente_nome || 'Cliente'} — R$${p.valor_total} — Entrega: ${p.data_entrega} — Produção: ${p.status_producao} — Entrega: ${p.status_entrega}`);
    });
  }
  if (ctx.fornadas) {
    lines.push('\n🔥 PRÓXIMAS FORNADAS:');
    ctx.fornadas.forEach((f: any) => {
      lines.push(`  - ${f.data} (${f.tipo}) — ${f.hora_inicio} a ${f.hora_fim} — Encerramento encomendas: ${f.encerramento_encomenda || 'N/A'}`);
    });
  }
  if (ctx.clientes) {
    lines.push(`\n👥 CLIENTES: ${ctx.clientes.total} cadastrados`);
    if (ctx.clientes.por_grupo) lines.push(`  Por grupo: ${ctx.clientes.por_grupo.map((g: any) => `${g.nome}: ${g.qtd}`).join(', ')}`);
  }
  if (ctx.ultimas_atividades) {
    lines.push('\n📋 ÚLTIMAS ATIVIDADES:');
    ctx.ultimas_atividades.slice(0, 5).forEach((a: any) => { lines.push(`  - ${a.descricao} (${a.data})`); });
  }
  if (ctx.transacoes_recentes) {
    lines.push('\n💰 TRANSAÇÕES RECENTES:');
    ctx.transacoes_recentes.slice(0, 8).forEach((t: any) => {
      lines.push(`  - ${t.descricao}: ${t.tipo === 'receita' ? '+' : '-'}R$${t.valor} (${t.data})`);
    });
  }
  return lines.join('\n');
}

function extractActions(text: string): any[] {
  const actions: any[] = [];
  const regex = /```action\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try { actions.push(JSON.parse(match[1].trim())); } catch (e) { console.error('Failed to parse action:', match[1]); }
  }
  return actions;
}
