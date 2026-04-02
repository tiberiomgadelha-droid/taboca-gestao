// ═══════════════════════════════════════════════════
// EDGE FUNCTION: agent-atendente (Agente 2 — Atendente Virtual)
// POST /functions/v1/agent-atendente
// Body: { cliente_id: number, mensagem: string, canal: string, history?: array }
// Response: { resposta: string, acoes?: array }
// SELF-CONTAINED — no shared imports
// ═══════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callClaude } from '../_shared/anthropic.ts';

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

    // Buscar dados necessários em paralelo (inclui fichas técnicas e todos os produtos)
    const [
      { data: settings },
      { data: cliente },
      { data: produtos },
      { data: todosProdutos },
      { data: fornadas },
      { data: localidades },
      { data: grupos },
      { data: pedidosCliente },
      { data: fichas },
    ] = await Promise.all([
      supabase.from('settings').select('prompt_agente2').eq('id', 1).single(),
      cliente_id ? supabase.from('clientes').select('*').eq('id', cliente_id).single() : Promise.resolve({ data: null }),
      supabase.from('produtos').select('*').gt('quantidade', 0).order('categoria'),
      supabase.from('produtos').select('id, nome, categoria, quantidade, valor_unitario, emoji, descricao').order('categoria'),
      supabase.from('fornadas').select('*').gte('data', new Date().toISOString().slice(0, 10)).order('data'),
      supabase.from('localidades').select('*'),
      supabase.from('grupos').select('*'),
      cliente_id ? supabase.from('pedidos').select('*').eq('cliente_id', cliente_id).order('data_pedido', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      supabase.from('fichas').select('*, produtos(nome, categoria, emoji)').order('produto_id'),
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
${localidades?.map((l: any) => `- ${l.nome_localidade} (ID: ${l.id}): R$ ${Number(l.valor_entrega).toFixed(2)} (${l.tempo_estimado || 'N/A'})`).join('\n') || 'Nenhuma localidade cadastrada.'}

FICHAS TÉCNICAS E MODO DE PREPARO:
${fichas?.map((f: any) => {
  const prod = f.produtos;
  return \`${prod?.emoji || '📋'} ${prod?.nome || 'Produto'} (${prod?.categoria || ''})
  - Ingredientes: ${f.ingredientes ? JSON.stringify(f.ingredientes) : 'N/A'}
  - Modo de preparo: ${f.modo_preparo || 'N/A'}
  - Rendimento: ${f.rendimento || 'N/A'} unidades | Tempo: ${f.tempo_preparo || 'N/A'} min
  - Custo material: R$ ${f.custo_material ? Number(f.custo_material).toFixed(2) : 'N/A'} | Preço venda: R$ ${f.valor_venda_unitario ? Number(f.valor_venda_unitario).toFixed(2) : 'N/A'}\`;
}).join('\n') || 'Nenhuma ficha técnica cadastrada.'}

TODOS OS PRODUTOS (incluindo estoque zero — para encomenda):
${todosProdutos?.map((p: any) => \`- ID:${p.id} ${p.emoji || '🍞'} ${p.nome} (${p.categoria}) — R$ ${Number(p.valor_unitario).toFixed(2)} — Estoque: ${p.quantidade}\`).join('\n') || 'Nenhum produto.'}

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
- IMPORTANTE: Você DEVE registrar dados no sistema sempre que o cliente fornecer informações relevantes
- Sempre coletar dados que faltam do cliente de forma natural durante a conversa (endereço, preferências)
- Use as fichas técnicas para responder dúvidas sobre ingredientes, modo de preparo e detalhes dos produtos

QUANDO CRIAR AÇÕES (obrigatório):
1. Cliente confirmou um pedido → criar_pedido (com em_estoque baseado na quantidade do produto)
2. Cliente informou endereço, nome, preferência ou qualquer dado pessoal → atualizar_cliente
3. Cliente confirmou pagamento → confirmar_pagamento (registra transação E marca pedido como pago)
4. Cliente quer cancelar/alterar pedido → editar_pedido ou encaminhar_tiba
5. Situação complexa que precisa do Tiba → encaminhar_tiba

REGRAS DE ESTOQUE E STATUS:
- Produto com quantidade > 0 no cardápio: em_estoque = true → pedido com status_producao="pronto", status_entrega="pendente"
- Produto com quantidade = 0 (sob encomenda): em_estoque = false → pedido com status_producao="pendente", status_entrega="pendente"
- Informar ao cliente: "Temos em estoque, já separo pra você!" ou "Esse é por encomenda, preciso saber a data de entrega"

AÇÕES DISPONÍVEIS (retorne em bloco \`\`\`action):

1. criar_pedido — Criar novo pedido
\`\`\`action
{
  "type": "criar_pedido",
  "data": {
    "cliente_id": ${cliente_id},
    "data_entrega": "YYYY-MM-DD",
    "itens": [{"produto_id": 1, "nome": "Nome", "quantidade": 2, "valor_unitario": 18.00}],
    "valor_total": 36.00,
    "localidade_id": null,
    "observacoes": "texto opcional",
    "em_estoque": true
  },
  "description": "Descrição do pedido"
}
\`\`\`

2. editar_pedido — Alterar pedido existente
\`\`\`action
{
  "type": "editar_pedido",
  "data": { "pedido_id": 123, "campos": {"status_producao": "pronto", "status_entrega": "em_rota", "observacoes": "texto"} },
  "description": "Motivo da alteração"
}
\`\`\`

3. apagar_pedido — Cancelar pedido
\`\`\`action
{ "type": "apagar_pedido", "data": { "pedido_id": 123 }, "description": "Motivo" }
\`\`\`

4. atualizar_cliente — Atualizar dados do cliente atual
\`\`\`action
{
  "type": "atualizar_cliente",
  "data": { "cliente_id": ${cliente_id}, "campos": {"nome": "Nome", "endereco_completo": "Rua X, 123", "localidade_id": 1, "preferencias": "texto", "grupo_id": 2} },
  "description": "Dados atualizados"
}
\`\`\`

5. criar_cliente — Cadastrar novo cliente mencionado na conversa
\`\`\`action
{
  "type": "criar_cliente",
  "data": { "nome": "Nome", "whatsapp": "71999999999", "instagram": "@handle", "endereco_completo": "Rua X", "localidade_id": 1 },
  "description": "Novo cliente"
}
\`\`\`

6. apagar_cliente
\`\`\`action
{ "type": "apagar_cliente", "data": { "cliente_id": 123 }, "description": "Motivo" }
\`\`\`

7. confirmar_pagamento — Registra pagamento (cria transação + marca pedido como pago)
\`\`\`action
{
  "type": "confirmar_pagamento",
  "data": { "pedido_id": 123, "valor": 36.00, "conta": "Pix", "categoria": "Vendas" },
  "description": "Pagamento via Pix confirmado"
}
\`\`\`

8. criar_transacao — Registrar transação financeira avulsa
\`\`\`action
{
  "type": "criar_transacao",
  "data": { "descricao": "Descrição", "data": "YYYY-MM-DD", "tipo": "receita", "valor": 50.00, "categoria": "Vendas", "conta": "Pix" },
  "description": "Transação registrada"
}
\`\`\`

9. editar_transacao
\`\`\`action
{ "type": "editar_transacao", "data": { "transacao_id": 123, "campos": {"valor": 60.00} }, "description": "Motivo" }
\`\`\`

10. apagar_transacao
\`\`\`action
{ "type": "apagar_transacao", "data": { "transacao_id": 123 }, "description": "Motivo" }
\`\`\`

11. criar_rota — Criar rota de entrega
\`\`\`action
{
  "type": "criar_rota",
  "data": { "nome_rota": "Nome", "data": "YYYY-MM-DD", "lista_pedido_ids": [1,2,3], "entregador": "Nome" },
  "description": "Nova rota"
}
\`\`\`

12. editar_rota
\`\`\`action
{ "type": "editar_rota", "data": { "rota_id": 123, "campos": {"status_rota": "concluida", "lista_pedido_ids": [1,2]} }, "description": "Motivo" }
\`\`\`

13. apagar_rota
\`\`\`action
{ "type": "apagar_rota", "data": { "rota_id": 123 }, "description": "Motivo" }
\`\`\`

14. criar_localidade
\`\`\`action
{
  "type": "criar_localidade",
  "data": { "nome_localidade": "Nome", "valor_entrega": 10.00, "tempo_estimado": "30min" },
  "description": "Nova localidade"
}
\`\`\`

15. editar_localidade
\`\`\`action
{ "type": "editar_localidade", "data": { "localidade_id": 123, "campos": {"valor_entrega": 12.00} }, "description": "Motivo" }
\`\`\`

16. apagar_localidade
\`\`\`action
{ "type": "apagar_localidade", "data": { "localidade_id": 123 }, "description": "Motivo" }
\`\`\`

17. encaminhar_tiba — Escalar para atendimento humano
\`\`\`action
{
  "type": "encaminhar_tiba",
  "data": { "motivo": "Descrição do motivo", "resumo_conversa": "Resumo do que foi tratado" },
  "description": "Encaminhamento"
}
\`\`\`

REGRAS CRÍTICAS:
- Você pode emitir MÚLTIPLAS ações na mesma resposta (ex: atualizar_cliente + criar_pedido)
- Sempre use o cliente_id ${cliente_id} para ações do cliente atual
- Para confirmar_pagamento, pergunte a forma: Pix, Dinheiro ou Cartão
- Nunca apague registros sem o cliente pedir explicitamente
- Se não tem certeza, use encaminhar_tiba`;

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
