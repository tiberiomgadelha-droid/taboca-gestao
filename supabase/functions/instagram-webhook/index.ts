// supabase/functions/instagram-webhook/index.ts
// Edge Function para receber DMs do Instagram via webhook,
// salvar no banco, responder usando agent-atendente (IA), e salvar a resposta.
// ═══════════════════════════════════════════════════════════════
// FASE 5: Suporte a mensagens de ÁUDIO (STT via Groq Whisper)
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") ?? "taboca_whatsapp_verify_2024";
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") ?? Deno.env.get("INSTAGRAM_API_TOKEN") ?? "";
const INSTAGRAM_PAGE_ID = Deno.env.get("INSTAGRAM_PAGE_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://fvvgjvfnwylwdikooxae.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase Admin client
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ════════════════════════════════════════════════════
// ÁUDIO: STT (Speech-to-Text) via Groq Whisper
// ════════════════════════════════════════════════════

// Baixar áudio de attachment do Instagram e transcrever com Groq Whisper
async function transcribeInstagramAudio(audioUrl: string): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY não configurada — áudio não será transcrito");
    return null;
  }

  try {
    // 1. Baixar arquivo de áudio do URL do attachment
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error(`Erro ao baixar áudio Instagram: ${audioResponse.status}`);
      return null;
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const contentType = audioResponse.headers.get("content-type") || "audio/mp4";
    const ext = contentType.includes("mp4") ? "mp4" :
                contentType.includes("ogg") ? "ogg" : "mp4";

    // 2. Enviar para Groq Whisper API
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: contentType }), `audio.${ext}`);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "pt");
    formData.append("response_format", "text");

    const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error(`Erro Groq STT (Instagram): ${groqResponse.status} — ${errText}`);
      return null;
    }

    const transcript = await groqResponse.text();
    console.log(`🎙️ Áudio Instagram transcrito: "${transcript.trim().substring(0, 100)}..."`);
    return transcript.trim();
  } catch (error) {
    console.error("Erro na transcrição de áudio Instagram:", error);
    return null;
  }
}

// ════════════════════════════════════════════════════
// Funções existentes (envio, cliente, mensagem, IA)
// ════════════════════════════════════════════════════

// ── Enviar mensagem de resposta via Instagram Messaging API ──
async function sendInstagramMessage(recipientId: string, message: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${INSTAGRAM_PAGE_ID}/messages`;
  const body = {
    recipient: { id: recipientId },
    message: { text: message },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro ao enviar mensagem Instagram: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao enviar mensagem Instagram: ${response.status}`);
  }
  console.log("Mensagem Instagram enviada com sucesso para:", recipientId);
}

// ── Buscar nome do usuário Instagram via Graph API ──
// FASE 6: Prioriza @username em vez do name ou ID numérico
async function getInstagramUsername(userId: string): Promise<{ displayName: string; username: string | null }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${userId}?fields=name,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const username = data.username || null;
      // Priorizar @username como nome de exibição
      const displayName = username ? `@${username}` : (data.name || `Instagram ${userId}`);
      console.log(`📸 Instagram user: username=${username}, name=${data.name}, display=${displayName}`);
      return { displayName, username };
    }
  } catch (e) {
    console.log("Não foi possível obter nome do Instagram:", e);
  }
  return { displayName: `Instagram ${userId}`, username: null };
}

// ── Buscar ou criar cliente pelo ID do Instagram ──
// FASE 6: Recebe displayName (@username) para salvar nome legível
async function findOrCreateCliente(supabase: any, instagramId: string, displayName: string): Promise<{ id: number; bot_ativo: boolean; preferencia_audio: boolean }> {
  // Busca por ID numérico do Instagram E por @username (displayName)
  let orFilter = `instagram.eq.${instagramId},instagram.eq.@${instagramId},instagram.ilike.%${instagramId}%`;
  // Se temos @username, também buscar por ele (resolve duplicatas entre ID numérico e @username)
  if (displayName && displayName.startsWith('@')) {
    const username = displayName.replace('@', '');
    orFilter += `,instagram.eq.${displayName},instagram.eq.${username},instagram.ilike.%${username}%`;
  }
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome, bot_ativo, preferencia_audio, instagram')
    .or(orFilter)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Cliente encontrado: ${existing[0].nome} (ID: ${existing[0].id}, bot_ativo: ${existing[0].bot_ativo}, instagram: ${existing[0].instagram})`);
    // Atualizar instagram ID se mudou
    const updates: any = {};
    if (existing[0].instagram !== instagramId) {
      updates.instagram = instagramId;
    }
    // FASE 6: Se o nome era genérico "Instagram XXXXX", atualizar com @username
    if (existing[0].nome && existing[0].nome.startsWith('Instagram ') && displayName && displayName.startsWith('@')) {
      updates.nome = displayName;
      console.log(`📝 Nome atualizado: "${existing[0].nome}" → "${displayName}"`);
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('clientes').update(updates).eq('id', existing[0].id);
    }
    return {
      id: existing[0].id,
      bot_ativo: existing[0].bot_ativo !== false,
      preferencia_audio: existing[0].preferencia_audio === true,
    };
  }

  // Criar novo cliente com @username como nome + grupo "potenciais clientes"
  const { data: newClient, error } = await supabase
    .from('clientes')
    .insert({
      nome: displayName || `Instagram ${instagramId}`,
      instagram: instagramId,
      data_cadastro: new Date().toISOString().split('T')[0],
      bot_ativo: true,
      preferencia_audio: false,
      grupo_id: 1,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    throw new Error('Falha ao criar cliente');
  }

  // Adicionar ao grupo "potenciais clientes" (id=1) no Kanban
  try {
    const { data: grupo } = await supabase.from('grupos').select('lista_cliente_ids').eq('id', 1).single();
    if (grupo) {
      await supabase.from('grupos').update({ lista_cliente_ids: [...(grupo.lista_cliente_ids || []), newClient.id] }).eq('id', 1);
    }
  } catch (e) { console.error('Erro ao adicionar cliente ao grupo:', e); }

  console.log(`Novo cliente criado: ${displayName} (ID: ${newClient.id}, grupo: potenciais)`);
  return { id: newClient.id, bot_ativo: true, preferencia_audio: false };
}

// ── Salvar mensagem no banco ──
async function saveMensagem(supabase: any, opts: {
  cliente_id: number;
  canal: string;
  conteudo: string;
  de_cliente: boolean;
  origem?: string;
  external_id?: string;
  tipo?: string;
  transcricao?: string;
}): Promise<any> {
  const { data, error } = await supabase
    .from('mensagens')
    .insert({
      cliente_id: opts.cliente_id,
      canal: opts.canal,
      data_hora: new Date().toISOString(),
      conteudo: opts.conteudo,
      status: opts.de_cliente ? 'nao_lida' : 'enviada',
      de_cliente: opts.de_cliente,
      origem: opts.origem || (opts.de_cliente ? undefined : 'ia_automatico'),
      external_id: opts.external_id,
      tipo: opts.tipo || 'text',
      transcricao: opts.transcricao,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao salvar mensagem:', error);
    return null;
  }
  return data;
}

// ── Chamar agent-atendente (IA) — retorna resposta E ações ──
async function callAgentAtendente(clienteId: number, mensagem: string, canal: string, history: any[] = []): Promise<{ resposta: string; acoes: any[] }> {
  const url = `${SUPABASE_URL}/functions/v1/agent-atendente`;
  const fallbackMsg = "Olá! Obrigado por entrar em contato com a Taboca Pão e Pizza 🍞🍕 Estamos com uma dificuldade técnica no momento, mas logo retornaremos. Tente novamente em alguns minutos!";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        cliente_id: clienteId,
        mensagem: mensagem,
        canal: canal,
        history: history,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Erro no agent-atendente: ${response.status} - ${errText}`);
      return { resposta: fallbackMsg, acoes: [] };
    }

    const data = await response.json();
    return {
      resposta: data.resposta || data.reply || "Desculpe, não consegui processar sua mensagem.",
      acoes: data.acoes || [],
    };
  } catch (error) {
    console.error("Erro ao chamar agent-atendente:", error);
    return { resposta: fallbackMsg, acoes: [] };
  }
}

// ════════════════════════════════════════════════════
// FASE 6: Executar ações retornadas pela IA no banco
// ════════════════════════════════════════════════════
async function executeAcoes(supabase: any, acoes: any[], clienteId: number): Promise<void> {
  for (const acao of acoes) {
    try {
      const { type, data: d, description } = acao;
      console.log(`⚡ Executando ação: ${type} — ${description || ''}`);

      switch (type) {
        // ── PEDIDOS ──
        case 'criar_pedido': {
          const emEstoque = d.em_estoque === true;

          // Normalizar itens: o agente pode enviar {produto: "Nome"} ou {produto_id: 1}
          const { data: todosProdutos } = await supabase.from('produtos').select('id, nome, valor_unitario, quantidade');
          const itensRaw = d.itens || [];
          const itensNormalizados = itensRaw.map((item: any) => {
            let produtoDb = null;
            if (item.produto_id) {
              produtoDb = (todosProdutos || []).find((p: any) => p.id === item.produto_id);
            }
            if (!produtoDb && (item.produto || item.nome)) {
              const nomeBusca = (item.produto || item.nome || '').toLowerCase();
              produtoDb = (todosProdutos || []).find((p: any) => p.nome.toLowerCase().includes(nomeBusca) || nomeBusca.includes(p.nome.toLowerCase()));
            }
            const qty = item.quantidade || 1;
            const preco = item.valor_unitario || item.preco_unit || item.preco_unitario || produtoDb?.valor_unitario || 0;
            return {
              produto_id: produtoDb?.id || item.produto_id || null,
              quantidade: qty,
              valor: preco * qty,
            };
          });
          const valorTotal = d.valor_total || itensNormalizados.reduce((a: number, it: any) => a + (it.valor || 0), 0);

          const { data: pedido, error } = await supabase.from('pedidos').insert({
            cliente_id: d.cliente_id || clienteId,
            data_pedido: new Date().toISOString(),
            data_entrega: d.data_entrega || null,
            itens: itensNormalizados,
            valor_total: valorTotal,
            localidade_id: d.localidade_id || null,
            observacoes: d.observacoes || null,
            status_producao: emEstoque ? 'pronto' : 'pendente',
            status_entrega: 'aguardando',
            pagamento_confirmado: false,
          }).select('id').single();

          if (error) {
            console.error('Erro criar_pedido:', error);
          } else {
            console.log(`✅ Pedido #${pedido.id} criado (valor: R$${valorTotal}, produção: ${emEstoque ? 'pronto' : 'pendente'})`);
            if (emEstoque) {
              for (const item of itensNormalizados) {
                if (item.produto_id && item.quantidade) {
                  const prodDb = (todosProdutos || []).find((p: any) => p.id === item.produto_id);
                  if (prodDb) {
                    const novaQtd = Math.max(0, (prodDb.quantidade || 0) - item.quantidade);
                    await supabase.from('produtos').update({ quantidade: novaQtd }).eq('id', item.produto_id);
                    console.log(`📦 Estoque produto ${item.produto_id}: ${prodDb.quantidade} → ${novaQtd}`);
                  }
                }
              }
            }
            await supabase.from('activity_log').insert({
              tipo: 'pedido', descricao: `Pedido #${pedido.id} criado via atendente IA — R$${valorTotal}: ${description || ''}`,
              data: new Date().toISOString(), operador: 'Atendente IA', icon: 'pedido'
            });
          }
          break;
        }

        case 'editar_pedido': {
          if (!d.pedido_id) { console.error('editar_pedido sem pedido_id'); break; }
          const { error } = await supabase.from('pedidos').update(d.campos || {}).eq('id', d.pedido_id);
          if (error) console.error('Erro editar_pedido:', error);
          else console.log(`✅ Pedido #${d.pedido_id} atualizado`);
          break;
        }

        case 'apagar_pedido': {
          if (!d.pedido_id) { console.error('apagar_pedido sem pedido_id'); break; }
          const { error } = await supabase.from('pedidos').delete().eq('id', d.pedido_id);
          if (error) console.error('Erro apagar_pedido:', error);
          else console.log(`✅ Pedido #${d.pedido_id} removido`);
          break;
        }

        // ── CLIENTES ──
        case 'criar_cliente': {
          const { data: novoCliente, error } = await supabase.from('clientes').insert({
            nome: d.nome || 'Sem nome',
            whatsapp: d.whatsapp || null,
            instagram: d.instagram || null,
            endereco_completo: d.endereco_completo || null,
            localidade_id: d.localidade_id || null,
            preferencias: d.preferencias || null,
            data_cadastro: new Date().toISOString().split('T')[0],
            bot_ativo: true,
            preferencia_audio: false,
          }).select('id').single();
          if (error) console.error('Erro criar_cliente:', error);
          else console.log(`✅ Cliente "${d.nome}" criado (ID: ${novoCliente.id})`);
          break;
        }

        case 'atualizar_cliente': {
          const cId = d.cliente_id || clienteId;
          const campos = d.campos || {};
          if (Object.keys(campos).length === 0) { console.log('atualizar_cliente sem campos'); break; }
          const { error } = await supabase.from('clientes').update(campos).eq('id', cId);
          if (error) console.error('Erro atualizar_cliente:', error);
          else console.log(`✅ Cliente #${cId} atualizado: ${Object.keys(campos).join(', ')}`);
          break;
        }

        case 'apagar_cliente': {
          if (!d.cliente_id) { console.error('apagar_cliente sem cliente_id'); break; }
          const { error } = await supabase.from('clientes').delete().eq('id', d.cliente_id);
          if (error) console.error('Erro apagar_cliente:', error);
          else console.log(`✅ Cliente #${d.cliente_id} removido`);
          break;
        }

        // ── PAGAMENTO ──
        case 'confirmar_pagamento': {
          if (!d.pedido_id) { console.error('confirmar_pagamento sem pedido_id'); break; }
          const { error: errPedido } = await supabase.from('pedidos').update({ pagamento_confirmado: true }).eq('id', d.pedido_id);
          if (errPedido) { console.error('Erro confirmar pagamento pedido:', errPedido); break; }
          const { error: errTx } = await supabase.from('transactions').insert({
            descricao: `Pagamento Pedido #${d.pedido_id}`,
            data: new Date().toISOString().split('T')[0],
            tipo: 'receita',
            valor: d.valor || 0,
            categoria: d.categoria || 'Vendas',
            conta: d.conta || 'Pix',
          });
          if (errTx) console.error('Erro criar transação pagamento:', errTx);
          else console.log(`✅ Pagamento pedido #${d.pedido_id}: R$ ${d.valor} via ${d.conta}`);
          await supabase.from('activity_log').insert({
            tipo: 'financeiro', descricao: `Pagamento R$ ${d.valor} recebido (Pedido #${d.pedido_id}) via ${d.conta}`,
            data: new Date().toISOString(), operador: 'Atendente IA', icon: '💰'
          });
          break;
        }

        // ── TRANSAÇÕES ──
        case 'criar_transacao': {
          const { error } = await supabase.from('transactions').insert({
            descricao: d.descricao || '', data: d.data || new Date().toISOString().split('T')[0],
            tipo: d.tipo || 'receita', valor: d.valor || 0, categoria: d.categoria || '', conta: d.conta || '',
          });
          if (error) console.error('Erro criar_transacao:', error);
          else console.log(`✅ Transação criada: ${d.descricao} R$ ${d.valor}`);
          break;
        }

        case 'editar_transacao': {
          if (!d.transacao_id) { console.error('editar_transacao sem transacao_id'); break; }
          const { error } = await supabase.from('transactions').update(d.campos || {}).eq('id', d.transacao_id);
          if (error) console.error('Erro editar_transacao:', error);
          else console.log(`✅ Transação #${d.transacao_id} atualizada`);
          break;
        }

        case 'apagar_transacao': {
          if (!d.transacao_id) { console.error('apagar_transacao sem transacao_id'); break; }
          const { error } = await supabase.from('transactions').delete().eq('id', d.transacao_id);
          if (error) console.error('Erro apagar_transacao:', error);
          else console.log(`✅ Transação #${d.transacao_id} removida`);
          break;
        }

        // ── ROTAS ──
        case 'criar_rota': {
          const { error } = await supabase.from('rotas').insert({
            nome_rota: d.nome_rota || '', data: d.data || new Date().toISOString().split('T')[0],
            lista_pedido_ids: d.lista_pedido_ids || [], entregador: d.entregador || null, status_rota: d.status_rota || 'pendente',
          });
          if (error) console.error('Erro criar_rota:', error);
          else console.log(`✅ Rota "${d.nome_rota}" criada`);
          break;
        }

        case 'editar_rota': {
          if (!d.rota_id) { console.error('editar_rota sem rota_id'); break; }
          const { error } = await supabase.from('rotas').update(d.campos || {}).eq('id', d.rota_id);
          if (error) console.error('Erro editar_rota:', error);
          else console.log(`✅ Rota #${d.rota_id} atualizada`);
          break;
        }

        case 'apagar_rota': {
          if (!d.rota_id) { console.error('apagar_rota sem rota_id'); break; }
          const { error } = await supabase.from('rotas').delete().eq('id', d.rota_id);
          if (error) console.error('Erro apagar_rota:', error);
          else console.log(`✅ Rota #${d.rota_id} removida`);
          break;
        }

        // ── LOCALIDADES ──
        case 'criar_localidade': {
          const { error } = await supabase.from('localidades').insert({
            nome_localidade: d.nome_localidade || '', valor_entrega: d.valor_entrega || 0,
            tempo_estimado: d.tempo_estimado || null, rota_descricao: d.rota_descricao || null, link_rota_maps: d.link_rota_maps || null,
          });
          if (error) console.error('Erro criar_localidade:', error);
          else console.log(`✅ Localidade "${d.nome_localidade}" criada`);
          break;
        }

        case 'editar_localidade': {
          if (!d.localidade_id) { console.error('editar_localidade sem localidade_id'); break; }
          const { error } = await supabase.from('localidades').update(d.campos || {}).eq('id', d.localidade_id);
          if (error) console.error('Erro editar_localidade:', error);
          else console.log(`✅ Localidade #${d.localidade_id} atualizada`);
          break;
        }

        case 'apagar_localidade': {
          if (!d.localidade_id) { console.error('apagar_localidade sem localidade_id'); break; }
          const { error } = await supabase.from('localidades').delete().eq('id', d.localidade_id);
          if (error) console.error('Erro apagar_localidade:', error);
          else console.log(`✅ Localidade #${d.localidade_id} removida`);
          break;
        }

        // ── ENCAMINHAR TIBA ──
        case 'encaminhar_tiba': {
          await supabase.from('activity_log').insert({
            tipo: 'atendimento',
            descricao: `🔔 Encaminhamento para Tiba: ${d.motivo || ''} | Resumo: ${d.resumo_conversa || ''}`,
            data: new Date().toISOString(), operador: 'Atendente IA', icon: '🔔'
          });
          console.log(`🔔 Encaminhado para Tiba: ${d.motivo}`);
          break;
        }

        default:
          console.log(`⚠️ Tipo de ação desconhecido: ${type}`);
      }
    } catch (err) {
      console.error(`Erro ao executar ação ${acao?.type}:`, err);
    }
  }
}

// ── Extrair dados de DM recebida do payload do Meta (Instagram) ──
// FASE 5: Suporta texto E áudio
function extractInstagramMessage(body: any) {
  try {
    const entry = body?.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging || !messaging.message) {
      return null;
    }

    // Ignorar mensagens enviadas pela própria página (echo)
    if (messaging.message.is_echo) {
      return null;
    }

    const senderId = messaging.sender?.id;
    const message = messaging.message;
    const messageId = message?.mid;

    if (!senderId) {
      console.log("Mensagem sem sender — ignorando");
      return null;
    }

    // Detectar tipo de mensagem
    const messageText = message?.text;
    const attachments = message?.attachments;

    // Verificar se é áudio (attachment type = "audio")
    if (attachments && attachments.length > 0) {
      const audioAttachment = attachments.find((a: any) => a.type === "audio");
      if (audioAttachment && audioAttachment.payload?.url) {
        return {
          senderId,
          messageText: null,
          audioUrl: audioAttachment.payload.url,
          messageId,
          type: "audio",
        };
      }
      // Outros tipos de attachment (image, video, etc.) — ignorar por ora
      console.log(`Attachment tipo ${attachments[0]?.type} recebido — ignorando`);
      return null;
    }

    // Mensagem de texto
    if (!messageText) {
      console.log("Mensagem sem texto e sem audio — ignorando");
      return null;
    }

    return {
      senderId,
      messageText,
      audioUrl: null,
      messageId,
      type: "text",
    };
  } catch (error) {
    console.error("Erro ao extrair mensagem Instagram:", error);
    return null;
  }
}

// ════════════════════════════════════════════════════
// Handler principal
// ════════════════════════════════════════════════════
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // GET — Verificação do webhook (challenge do Meta)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log(`Instagram webhook verification: mode=${mode}, token=${token}`);

    if (mode === "subscribe" && token === INSTAGRAM_VERIFY_TOKEN) {
      console.log("Instagram webhook verificado com sucesso!");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    } else {
      console.error("Falha na verificação do webhook Instagram: token inválido");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
  }

  // POST — Processar DM recebida do Instagram
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Instagram webhook POST:", JSON.stringify(body).substring(0, 500));

      // ── Validação de configuração ──
      if (!INSTAGRAM_ACCESS_TOKEN) {
        console.error("⚠️ INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_API_TOKEN não configurado!");
      }
      if (!INSTAGRAM_PAGE_ID) {
        console.error("⚠️ INSTAGRAM_PAGE_ID não configurado!");
      }

      const messageData = extractInstagramMessage(body);

      if (!messageData) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`DM Instagram ${messageData.type} de ${messageData.senderId}`);

      const supabase = getSupabaseAdmin();

      // 1. Buscar nome do usuário Instagram (FASE 6: prioriza @username)
      const { displayName: senderName } = await getInstagramUsername(messageData.senderId);

      // 2. Buscar ou criar cliente (FASE 6: salva @username como nome)
      const cliente = await findOrCreateCliente(supabase, messageData.senderId, senderName);
      const clienteId = cliente.id;

      // 3. Processar conteúdo baseado no tipo
      let conteudoTexto = '';
      let transcricao: string | undefined = undefined;

      if (messageData.type === 'text') {
        conteudoTexto = messageData.messageText || '';
      } else if (messageData.type === 'audio') {
        // ═══ FASE 5: Transcrever áudio Instagram com Groq Whisper ═══
        if (messageData.audioUrl) {
          const transcript = await transcribeInstagramAudio(messageData.audioUrl);
          if (transcript) {
            conteudoTexto = transcript;
            transcricao = transcript;
            console.log(`🎙️ Áudio Instagram transcrito para cliente ${clienteId}`);
          } else {
            conteudoTexto = '[Áudio recebido — não foi possível transcrever]';
          }
        } else {
          conteudoTexto = '[Áudio recebido]';
        }
      }

      if (!conteudoTexto) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 4. Salvar mensagem do cliente no banco
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'instagram',
        conteudo: conteudoTexto,
        de_cliente: true,
        external_id: messageData.messageId,
        tipo: messageData.type,
        transcricao: transcricao,
      });

      // 5a. Verificar se o bot está ativo GLOBALMENTE para Instagram
      const { data: globalSettings } = await supabase.from('settings').select('bot_instagram_ativo').limit(1).single();
      if (globalSettings && globalSettings.bot_instagram_ativo === false) {
        console.log(`🚫 Bot Instagram desativado globalmente — mensagem salva, aguardando atendimento manual.`);
        return new Response(JSON.stringify({ status: "ok", processed: true, bot_skipped: true, reason: "global_toggle_off" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 5b. Verificar se o bot está ativo para este cliente
      if (!cliente.bot_ativo) {
        console.log(`🚫 Bot desativado para cliente ID ${clienteId} — mensagem salva, aguardando atendimento manual.`);
        return new Response(JSON.stringify({ status: "ok", processed: true, bot_skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 6. Buscar histórico recente para contexto
      const { data: recentMsgs } = await supabase
        .from('mensagens')
        .select('conteudo, de_cliente')
        .eq('cliente_id', clienteId)
        .order('data_hora', { ascending: false })
        .limit(6);

      const history = (recentMsgs || []).reverse().slice(0, -1).map((m: any) => ({
        role: m.de_cliente ? 'user' : 'assistant',
        content: m.conteudo,
      }));

      // 7. Chamar IA (agent-atendente) para gerar resposta E ações
      const { resposta: aiResponse, acoes } = await callAgentAtendente(clienteId, conteudoTexto, 'instagram', history);

      // 7.1 FASE 6: Executar ações retornadas pela IA (pedidos, clientes, transações, etc.)
      if (acoes && acoes.length > 0) {
        console.log(`⚡ ${acoes.length} ação(ões) a executar: ${acoes.map((a: any) => a.type).join(', ')}`);
        await executeAcoes(supabase, acoes, clienteId);
      }

      // 8. Salvar resposta da IA no banco
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'instagram',
        conteudo: aiResponse,
        de_cliente: false,
        origem: 'ia_automatico',
        tipo: 'text', // Instagram Messaging API envia texto (não suporta upload de áudio direto como WhatsApp)
      });

      // 9. Enviar resposta de volta via Instagram (texto)
      // Nota: Instagram Messaging API não tem endpoint nativo de áudio como WhatsApp
      // Resposta sempre em texto no Instagram
      await sendInstagramMessage(messageData.senderId, aiResponse);

      console.log(`✅ Fluxo completo Instagram: msg ${messageData.type} recebida → IA respondeu → enviada para ${messageData.senderId}`);

      return new Response(JSON.stringify({ status: "ok", processed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro no processamento Instagram:", error);
      return new Response(JSON.stringify({ status: "error", message: error.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
