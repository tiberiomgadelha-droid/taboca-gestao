// supabase/functions/transcribe-audio/index.ts
// Edge Function para transcrever áudio enviado pelo frontend usando Groq Whisper
// Recebe áudio em base64 ou multipart/form-data e retorna texto transcrito

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

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

  if (!GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY não configurada no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let audioBlob: Blob;
    let fileName = "audio.webm";

    if (contentType.includes("multipart/form-data")) {
      // Receber como form-data (preferível)
      const formData = await req.formData();
      const file = formData.get("audio");
      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "Campo 'audio' não encontrado no form-data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      audioBlob = file;
      fileName = file.name || "audio.webm";
    } else {
      // Receber como JSON com base64
      const body = await req.json();
      if (!body.audio) {
        return new Response(
          JSON.stringify({ error: "Campo 'audio' (base64) não encontrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decodificar base64
      const binaryString = atob(body.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const mimeType = body.mimeType || "audio/webm";
      audioBlob = new Blob([bytes], { type: mimeType });
      fileName = body.fileName || "audio.webm";
    }

    console.log(`🎙️ Recebido áudio para transcrição: ${fileName}, tamanho: ${audioBlob.size} bytes`);

    // Enviar para Groq Whisper API
    const groqForm = new FormData();
    groqForm.append("file", audioBlob, fileName);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "pt");
    groqForm.append("response_format", "text");

    const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error(`Erro Groq STT: ${groqResponse.status} — ${errText}`);
      return new Response(
        JSON.stringify({ error: `Erro na transcrição: ${groqResponse.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = await groqResponse.text();
    console.log(`🎙️ Transcrito: "${transcript.trim().substring(0, 100)}..."`);

    return new Response(
      JSON.stringify({ text: transcript.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
