// supabase/functions/send-instagram-reply/index.ts
// Edge Function para enviar respostas do painel de atendimento ao Instagram Direct.
// Chamada pelo frontend quando o atendente digita/aprova uma resposta.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") ?? "";
const INSTAGRAM_PAGE_ID = Deno.env.get("INSTAGRAM_PAGE_ID") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { recipient_id, message, canal } = await req.json();

    if (!recipient_id || !message) {
      return new Response(
        JSON.stringify({ error: "recipient_id e message são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar via Instagram Messaging API (Graph API)
    // Endpoint correto para Instagram Direct Messages:
    // https://graph.instagram.com/v21.0/me/messages
    const url = `https://graph.instagram.com/v21.0/me/messages`;
    const body = {
      recipient: { id: recipient_id },
      message: { text: message },
    };

    console.log(`Enviando mensagem Instagram para ${recipient_id}: ${message.substring(0, 100)}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Erro Instagram API: ${response.status} - ${responseText}`);
      return new Response(
        JSON.stringify({
          error: `Falha ao enviar: ${response.status}`,
          details: responseText
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Mensagem enviada com sucesso para ${recipient_id}`);

    let responseData = {};
    try { responseData = JSON.parse(responseText); } catch {}

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no send-instagram-reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
