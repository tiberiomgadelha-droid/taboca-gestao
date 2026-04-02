// supabase/functions/whatsapp-webhook/index.ts
// Edge Function para receber mensagens do WhatsApp Business API via webhook,
// salvar no banco, responder usando agent-atendente (IA), e salvar a resposta.
// ═══════════════════════════════════════════════════════════════
// FASE 5: Suporte a mensagens de ÁUDIO (STT via Groq Whisper)
//         + Respostas em áudio (TTS via ElevenLabs/HuggingFace)
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "taboca_whatsapp_verify_2024";
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? Deno.env.get("WHATSAPP_API_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://fvvgjvfnwylwdikooxae.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") ?? "";

// Voz ElevenLabs para respostas em pt-BR (multilingual v2)
// Pode trocar pelo ID de uma voz da Voice Library (busque em elevenlabs.io/voice-library)
const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase Admin client (service role para insert direto)
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ════════════════════════════════════════════════════
// ÁUDIO: STT (Speech-to-Text) via Groq Whisper
// ════════════════════════════════════════════════════

// Buscar URL de download de mídia da Meta API
async function getMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string } | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
    );
    if (!response.ok) {
      console.error(`Erro ao buscar mídia ${mediaId}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return { url: data.url, mimeType: data.mime_type || "audio/ogg" };
  } catch (error) {
    console.error("Erro getMediaUrl:", error);
    return null;
  }
}

// Baixar áudio da Meta e transcrever com Groq Whisper
async function transcribeAudio(mediaId: string): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY não configurada — áudio não será transcrito");
    return null;
  }

  try {
    // 1. Obter URL de download
    const mediaInfo = await getMediaUrl(mediaId);
    if (!mediaInfo) return null;

    // 2. Baixar arquivo de áudio da Meta
    const audioResponse = await fetch(mediaInfo.url, {
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!audioResponse.ok) {
      console.error(`Erro ao baixar áudio: ${audioResponse.status}`);
      return null;
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const ext = mediaInfo.mimeType.includes("ogg") ? "ogg" :
                mediaInfo.mimeType.includes("mp4") ? "mp4" : "ogg";

    // 3. Enviar para Groq Whisper API
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: mediaInfo.mimeType }), `audio.${ext}`);
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
      console.error(`Erro Groq STT: ${groqResponse.status} — ${errText}`);
      return null;
    }

    const transcript = await groqResponse.text();
    console.log(`🎙️ Áudio transcrito: "${transcript.trim().substring(0, 100)}..."`);
    return transcript.trim();
  } catch (error) {
    console.error("Erro na transcrição de áudio:", error);
    return null;
  }
}

// ════════════════════════════════════════════════════
// ÁUDIO: TTS (Text-to-Speech) via ElevenLabs + Fallback HuggingFace
// ════════════════════════════════════════════════════

// Gerar áudio com ElevenLabs (primário)
async function generateTTS(text: string): Promise<ArrayBuffer | null> {
  // Limitar texto a 500 chars para economizar quota gratuita
  const truncated = text.length > 500 ? text.substring(0, 497) + "..." : text;

  // Tentar ElevenLabs primeiro
  if (ELEVENLABS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: truncated,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (response.ok) {
        console.log("🔊 TTS gerado com ElevenLabs");
        return await response.arrayBuffer();
      }

      if (response.status === 429) {
        console.log("ElevenLabs: limite de quota atingido, usando fallback HuggingFace");
      } else {
        console.error(`ElevenLabs TTS erro: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ElevenLabs TTS:", error);
    }
  }

  // Fallback: HuggingFace MMS-TTS (gratuito, sem limite prático)
  try {
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-por",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: truncated }),
      }
    );

    if (hfResponse.ok) {
      console.log("🔊 TTS gerado com HuggingFace (fallback)");
      return await hfResponse.arrayBuffer();
    }
    console.error(`HuggingFace TTS erro: ${hfResponse.status}`);
  } catch (error) {
    console.error("Erro HuggingFace TTS:", error);
  }

  return null;
}

// Upload de áudio para Supabase Storage → retorna URL pública
async function uploadAudioToStorage(supabase: any, audioBuffer: ArrayBuffer, fileName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("audio-responses")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("Erro upload storage:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("audio-responses")
      .getPublicUrl(fileName);

    console.log(`📁 Áudio salvo no Storage: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload de áudio:", error);
    return null;
  }
}

// Enviar mensagem de ÁUDIO via WhatsApp Business API
async function sendWhatsAppAudio(to: string, audioUrl: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "audio",
        audio: { link: audioUrl },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Erro ao enviar áudio WhatsApp: ${response.status} — ${errText}`);
      return false;
    }

    console.log("🔊 Áudio enviado via WhatsApp para:", to);
    return true;
  } catch (error) {
    console.error("Erro sendWhatsAppAudio:", error);
    return false;
  }
}

// ════════════════════════════════════════════════════
// Funções existentes (texto, cliente, mensagem, IA)
// ════════════════════════════════════════════════════

// ── Enviar mensagem de texto via WhatsApp Business API ──
async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: { preview_url: false, body: message },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro ao enviar mensagem WhatsApp: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao enviar mensagem: ${response.status}`);
  }
  console.log("Mensagem WhatsApp enviada com sucesso para:", to);
}

// ── Marcar mensagem como lida no WhatsApp ──
async function markAsRead(messageId: string): Promise<void> {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ── Buscar ou criar cliente pelo número WhatsApp ──
async function findOrCreateCliente(supabase: any, phone: string, nome: string): Promise<{ id: number; bot_ativo: boolean; preferencia_audio: boolean }> {
  const phoneClean = phone.replace(/\D/g, '');

  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome, bot_ativo, preferencia_audio')
    .or(`whatsapp.eq.${phoneClean},whatsapp.eq.+${phoneClean},whatsapp.eq.${phoneClean.replace(/^55/, '')}`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Cliente encontrado: ${existing[0].nome} (ID: ${existing[0].id}, bot_ativo: ${existing[0].bot_ativo})`);
    return {
      id: existing[0].id,
      bot_ativo: existing[0].bot_ativo !== false,
      preferencia_audio: existing[0].preferencia_audio === true,
    };
  }

  // Criar novo cliente
  const { data: newClient, error } = await supabase
    .from('clientes')
    .insert({
      nome: nome || `WhatsApp ${phoneClean}`,
      whatsapp: phoneClean,
      data_cadastro: new Date().toISOString().split('T')[0],
      bot_ativo: true,
      preferencia_audio: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    throw new Error('Falha ao criar cliente');
  }

  console.log(`Novo cliente criado: ${nome} (ID: ${newClient.id})`);
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
          const { data: pedido, error } = await supabase.from('pedidos').insert({
            cliente_id: d.cliente_id || clienteId,
            data_pedido: new Date().toISOString().split('T')[0],
            data_entrega: d.data_entrega || null,
            itens: d.itens || [],
            valor_total: d.valor_total || 0,
            localidade_id: d.localidade_id || null,
            observacoes: d.observacoes || null,
            status_producao: emEstoque ? 'pronto' : 'pendente',
            status_entrega: 'pendente',
            pagamento_confirmado: false,
          }).select('id').single();

          if (error) {
            console.error('Erro criar_pedido:', error);
          } else {
            console.log(`✅ Pedido #${pedido.id} criado (produção: ${emEstoque ? 'pronto' : 'pendente'})`);
            // Decrementar estoque se em_estoque
            if (emEstoque && d.itens) {
              for (const item of d.itens) {
                if (item.produto_id && item.quantidade) {
                  await supabase.rpc('decrement_estoque', undefined).then(() => {});
                  // Fallback: update direto
                  const { data: prod } = await supabase.from('produtos').select('quantidade').eq('id', item.produto_id).single();
                  if (prod) {
                    const novaQtd = Math.max(0, (prod.quantidade || 0) - item.quantidade);
                    await supabase.from('produtos').update({ quantidade: novaQtd }).eq('id', item.produto_id);
                    console.log(`📦 Estoque produto ${item.produto_id}: ${prod.quantidade} → ${novaQtd}`);
                  }
                }
              }
            }
            // Registrar no activity_log
            await supabase.from('activity_log').insert({
              tipo: 'pedido', descricao: `Pedido #${pedido.id} criado via atendente IA: ${description || ''}`,
              data: new Date().toISOString(), operador: 'Atendente IA', icon: '📋'
            });
          }
          break;
        }

        case 'editar_pedido': {
          if (!d.pedido_id) { console.error('editar_pedido sem pedido_id'); break; }
          const campos = d.campos || d;
          const { pedido_id, ...updateFields } = campos.pedido_id ? campos : { pedido_id: d.pedido_id, ...d.campos };
          const { error } = await supabase.from('pedidos').update(d.campos || updateFields).eq('id', d.pedido_id);
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
          // 1. Marcar pedido como pago
          const { error: errPedido } = await supabase.from('pedidos').update({ pagamento_confirmado: true }).eq('id', d.pedido_id);
          if (errPedido) { console.error('Erro confirmar pagamento pedido:', errPedido); break; }
          // 2. Criar transação de receita
          const { error: errTx } = await supabase.from('transacoes').insert({
            descricao: `Pagamento Pedido #${d.pedido_id}`,
            data: new Date().toISOString().split('T')[0],
            tipo: 'receita',
            valor: d.valor || 0,
            categoria: d.categoria || 'Vendas',
            conta: d.conta || 'Pix',
          });
          if (errTx) console.error('Erro criar transação pagamento:', errTx);
          else console.log(`✅ Pagamento pedido #${d.pedido_id}: R$ ${d.valor} via ${d.conta}`);
          // 3. Log
          await supabase.from('activity_log').insert({
            tipo: 'financeiro', descricao: `Pagamento R$ ${d.valor} recebido (Pedido #${d.pedido_id}) via ${d.conta}`,
            data: new Date().toISOString(), operador: 'Atendente IA', icon: '💰'
          });
          break;
        }

        // ── TRANSAÇÕES ──
        case 'criar_transacao': {
          const { error } = await supabase.from('transacoes').insert({
            descricao: d.descricao || '',
            data: d.data || new Date().toISOString().split('T')[0],
            tipo: d.tipo || 'receita',
            valor: d.valor || 0,
            categoria: d.categoria || '',
            conta: d.conta || '',
          });
          if (error) console.error('Erro criar_transacao:', error);
          else console.log(`✅ Transação criada: ${d.descricao} R$ ${d.valor}`);
          break;
        }

        case 'editar_transacao': {
          if (!d.transacao_id) { console.error('editar_transacao sem transacao_id'); break; }
          const { error } = await supabase.from('transacoes').update(d.campos || {}).eq('id', d.transacao_id);
          if (error) console.error('Erro editar_transacao:', error);
          else console.log(`✅ Transação #${d.transacao_id} atualizada`);
          break;
        }

        case 'apagar_transacao': {
          if (!d.transacao_id) { console.error('apagar_transacao sem transacao_id'); break; }
          const { error } = await supabase.from('transacoes').delete().eq('id', d.transacao_id);
          if (error) console.error('Erro apagar_transacao:', error);
          else console.log(`✅ Transação #${d.transacao_id} removida`);
          break;
        }

        // ── ROTAS ──
        case 'criar_rota': {
          const { error } = await supabase.from('rotas').insert({
            nome_rota: d.nome_rota || '',
            data: d.data || new Date().toISOString().split('T')[0],
            lista_pedido_ids: d.lista_pedido_ids || [],
            entregador: d.entregador || null,
            status_rota: d.status_rota || 'pendente',
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
            nome_localidade: d.nome_localidade || '',
            valor_entrega: d.valor_entrega || 0,
            tempo_estimado: d.tempo_estimado || null,
            rota_descricao: d.rota_descricao || null,
            link_rota_maps: d.link_rota_maps || null,
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
            data: new Date().toISOString(),
            operador: 'Atendente IA',
            icon: '🔔'
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

// ── Extrair dados da mensagem recebida do payload do Meta ──
// FASE 5: Agora suporta texto E áudio
function extractMessageData(body: any) {
  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages || value.messages.length === 0) {
      return null; // Status update, não mensagem
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];
    const msgType = message.type;

    // Tipos suportados: text e audio
    if (msgType !== "text" && msgType !== "audio") {
      console.log(`Tipo de mensagem não suportado: ${msgType}`);
      return null;
    }

    return {
      from: message.from,
      messageText: msgType === "text" ? message.text?.body : null,
      audioId: msgType === "audio" ? message.audio?.id : null,
      messageId: message.id,
      senderName: contact?.profile?.name || "Cliente",
      type: msgType,
    };
  } catch (error) {
    console.error("Erro ao extrair dados da mensagem:", error);
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

    console.log(`Webhook verification: mode=${mode}, token=${token}`);

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      console.log("Webhook verificado com sucesso!");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    } else {
      console.error("Falha na verificação do webhook: token inválido");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
  }

  // POST — Processar mensagem recebida do WhatsApp
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Webhook POST recebido:", JSON.stringify(body).substring(0, 500));

      const messageData = extractMessageData(body);

      if (!messageData) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Mensagem ${messageData.type} de ${messageData.from} (${messageData.senderName})`);

      const supabase = getSupabaseAdmin();

      // 1. Buscar ou criar cliente
      const cliente = await findOrCreateCliente(supabase, messageData.from, messageData.senderName);
      const clienteId = cliente.id;

      // 2. Processar conteúdo baseado no tipo da mensagem
      let conteudoTexto = '';
      let transcricao: string | undefined = undefined;

      if (messageData.type === 'text') {
        conteudoTexto = messageData.messageText || '';
      } else if (messageData.type === 'audio') {
        // ═══ FASE 5: Transcrever áudio com Groq Whisper ═══
        if (messageData.audioId) {
          const transcript = await transcribeAudio(messageData.audioId);
          if (transcript) {
            conteudoTexto = transcript;
            transcricao = transcript;
            console.log(`🎙️ Áudio transcrito para cliente ${clienteId}: "${transcript.substring(0, 80)}..."`);
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

      // 3. Salvar mensagem do cliente no banco (com tipo e transcrição)
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'whatsapp',
        conteudo: conteudoTexto,
        de_cliente: true,
        external_id: messageData.messageId,
        tipo: messageData.type,
        transcricao: transcricao,
      });

      // 4. Marcar como lida no WhatsApp
      await markAsRead(messageData.messageId);

      // 5. Verificar se o bot está ativo para este cliente
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
      const { resposta: aiResponse, acoes } = await callAgentAtendente(clienteId, conteudoTexto, 'whatsapp', history);

      // 7.1 FASE 6: Executar ações retornadas pela IA (pedidos, clientes, transações, etc.)
      if (acoes && acoes.length > 0) {
        console.log(`⚡ ${acoes.length} ação(ões) a executar: ${acoes.map((a: any) => a.type).join(', ')}`);
        await executeAcoes(supabase, acoes, clienteId);
      }

      // 8. Decidir se responde em texto ou áudio
      // Responde em áudio se: mensagem foi áudio OU cliente tem preferencia_audio
      const deveResponderEmAudio = messageData.type === 'audio' || cliente.preferencia_audio;

      let respondeuEmAudio = false;

      if (deveResponderEmAudio && (ELEVENLABS_API_KEY || true)) {
        // ═══ FASE 5: Gerar e enviar resposta em ÁUDIO ═══
        try {
          const audioBuffer = await generateTTS(aiResponse);
          if (audioBuffer) {
            const fileName = `resp_${clienteId}_${Date.now()}.mp3`;
            const audioUrl = await uploadAudioToStorage(supabase, audioBuffer, fileName);

            if (audioUrl) {
              const enviou = await sendWhatsAppAudio(messageData.from, audioUrl);
              if (enviou) {
                respondeuEmAudio = true;
                console.log(`🔊 Resposta em áudio enviada para ${messageData.from}`);
              }
            }
          }
        } catch (err) {
          console.error("Erro ao gerar/enviar áudio:", err);
        }
      }

      // 9. Se não conseguiu enviar áudio, envia texto como fallback
      if (!respondeuEmAudio) {
        await sendWhatsAppMessage(messageData.from, aiResponse);
      }

      // 10. Salvar resposta da IA no banco
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'whatsapp',
        conteudo: aiResponse,
        de_cliente: false,
        origem: 'ia_automatico',
        tipo: respondeuEmAudio ? 'audio' : 'text',
      });

      console.log(`✅ Fluxo completo: msg ${messageData.type} recebida → ${respondeuEmAudio ? 'resposta em áudio' : 'resposta em texto'} para ${messageData.from}`);

      return new Response(JSON.stringify({ status: "ok", processed: true, response_type: respondeuEmAudio ? 'audio' : 'text' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erro no processamento:", error);
      return new Response(JSON.stringify({ status: "error", message: error.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
