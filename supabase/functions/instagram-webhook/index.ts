// supabase/functions/instagram-webhook/index.ts
// Edge Function para receber DMs do Instagram via webhook,
// salvar no banco, responder usando agent-atendente (IA), e salvar a resposta.
// ═══════════════════════════════════════════════════════════════
// FASE 5: Suporte a mensagens de ÁUDIO (STT via Groq Whisper)
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") ?? "taboca_whatsapp_verify_2024";
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_API_TOKEN") ?? Deno.env.get("INSTAGRAM_ACCESS_TOKEN") ?? "";
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
async function getInstagramUsername(userId: string): Promise<string> {
  try {
    const url = `https://graph.instagram.com/v21.0/${userId}?fields=name,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.name || data.username || `Instagram ${userId}`;
    }
  } catch (e) {
    console.log("Não foi possível obter nome do Instagram:", e);
  }
  return `Instagram ${userId}`;
}

// ── Buscar ou criar cliente pelo ID do Instagram ──
async function findOrCreateCliente(supabase: any, instagramId: string, nome: string): Promise<{ id: number; bot_ativo: boolean; preferencia_audio: boolean }> {
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome, bot_ativo, preferencia_audio, instagram')
    .or(`instagram.eq.${instagramId},instagram.eq.@${instagramId},instagram.ilike.%${instagramId}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Cliente encontrado: ${existing[0].nome} (ID: ${existing[0].id}, bot_ativo: ${existing[0].bot_ativo}, instagram: ${existing[0].instagram})`);
    if (existing[0].instagram !== instagramId) {
      await supabase.from('clientes').update({ instagram: instagramId }).eq('id', existing[0].id);
      console.log(`📝 Campo instagram atualizado: ${existing[0].instagram} → ${instagramId}`);
    }
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
      nome: nome || `Instagram ${instagramId}`,
      instagram: instagramId,
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

// ── Chamar agent-atendente (IA) ──
async function callAgentAtendente(clienteId: number, mensagem: string, canal: string, history: any[] = []): Promise<string> {
  const url = `${SUPABASE_URL}/functions/v1/agent-atendente`;

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
      return "Olá! Obrigado por entrar em contato com a Taboca Pão e Pizza 🍞🍕 Estamos com uma dificuldade técnica no momento, mas logo retornaremos. Tente novamente em alguns minutos!";
    }

    const data = await response.json();
    return data.resposta || data.reply || "Desculpe, não consegui processar sua mensagem.";
  } catch (error) {
    console.error("Erro ao chamar agent-atendente:", error);
    return "Olá! Obrigado por entrar em contato com a Taboca Pão e Pizza 🍞🍕 Estamos com uma dificuldade técnica no momento. Tente novamente em breve!";
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

      // 1. Buscar nome do usuário Instagram
      const senderName = await getInstagramUsername(messageData.senderId);

      // 2. Buscar ou criar cliente
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

      // 7. Chamar IA (agent-atendente) para gerar resposta
      const aiResponse = await callAgentAtendente(clienteId, conteudoTexto, 'instagram', history);

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
