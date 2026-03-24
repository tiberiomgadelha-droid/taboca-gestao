// supabase/functions/whatsapp-webhook/index.ts
// Edge Function para receber mensagens do WhatsApp Business API via webhook,
// salvar no banco, responder usando agent-atendente (IA), e salvar a resposta.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "taboca_whatsapp_verify_2024";
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://fvvgjvfnwylwdikooxae.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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
      "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
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
      "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
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
// Retorna { id, bot_ativo } para controlar se o agente IA deve responder
async function findOrCreateCliente(supabase: any, phone: string, nome: string): Promise<{ id: number; bot_ativo: boolean }> {
  // Formatar número: remover prefixo "55" se necessário para busca
  const phoneClean = phone.replace(/\D/g, '');

  // Buscar por número WhatsApp (tenta variações)
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome, bot_ativo')
    .or(`whatsapp.eq.${phoneClean},whatsapp.eq.+${phoneClean},whatsapp.eq.${phoneClean.replace(/^55/, '')}`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Cliente encontrado: ${existing[0].nome} (ID: ${existing[0].id}, bot_ativo: ${existing[0].bot_ativo})`);
    return { id: existing[0].id, bot_ativo: existing[0].bot_ativo !== false };
  }

  // Criar novo cliente (bot_ativo = true por padrão)
  const { data: newClient, error } = await supabase
    .from('clientes')
    .insert({
      nome: nome || `WhatsApp ${phoneClean}`,
      whatsapp: phoneClean,
      data_cadastro: new Date().toISOString().split('T')[0],
      bot_ativo: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    throw new Error('Falha ao criar cliente');
  }

  console.log(`Novo cliente criado: ${nome} (ID: ${newClient.id})`);
  return { id: newClient.id, bot_ativo: true };
}

// ── Salvar mensagem no banco ──
async function saveMensagem(supabase: any, opts: {
  cliente_id: number;
  canal: string;
  conteudo: string;
  de_cliente: boolean;
  origem?: string;
  external_id?: string;
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
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao salvar mensagem:', error);
    // Não lançar erro — não queremos bloquear o fluxo
    return null;
  }
  return data;
}

// ── Chamar agent-atendente (IA de atendimento ao cliente) ──
async function callAgentAtendente(clienteId: number, mensagem: string, canal: string, history: any[] = []): Promise<string> {
  const url = `${SUPABASE_URL}/functions/v1/agent-atendente`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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

// ── Extrair dados da mensagem recebida do payload do Meta ──
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

    if (message.type !== "text") {
      console.log(`Tipo de mensagem não suportado: ${message.type}`);
      return null;
    }

    return {
      from: message.from,
      messageText: message.text.body,
      messageId: message.id,
      senderName: contact?.profile?.name || "Cliente",
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

      console.log(`Mensagem de ${messageData.from} (${messageData.senderName}): ${messageData.messageText}`);

      const supabase = getSupabaseAdmin();

      // 1. Buscar ou criar cliente
      const cliente = await findOrCreateCliente(supabase, messageData.from, messageData.senderName);
      const clienteId = cliente.id;

      // 2. Salvar mensagem do cliente no banco
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'whatsapp',
        conteudo: messageData.messageText,
        de_cliente: true,
        external_id: messageData.messageId,
      });

      // 3. Marcar como lida no WhatsApp
      await markAsRead(messageData.messageId);

      // 4. Verificar se o bot está ativo para este cliente
      if (!cliente.bot_ativo) {
        console.log(`🚫 Bot desativado para cliente ID ${clienteId} — mensagem salva, aguardando atendimento manual.`);
        return new Response(JSON.stringify({ status: "ok", processed: true, bot_skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 5. Buscar histórico recente para contexto
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

      // 6. Chamar IA (agent-atendente) para gerar resposta
      const aiResponse = await callAgentAtendente(clienteId, messageData.messageText, 'whatsapp', history);

      // 7. Salvar resposta da IA no banco
      await saveMensagem(supabase, {
        cliente_id: clienteId,
        canal: 'whatsapp',
        conteudo: aiResponse,
        de_cliente: false,
        origem: 'ia_automatico',
      });

      // 8. Enviar resposta de volta via WhatsApp
      await sendWhatsAppMessage(messageData.from, aiResponse);

      console.log(`✅ Fluxo completo: mensagem recebida → salva → IA respondeu → resposta salva → enviada para ${messageData.from}`);

      return new Response(JSON.stringify({ status: "ok", processed: true }), {
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
