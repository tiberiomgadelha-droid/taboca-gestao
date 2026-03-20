// ═══════════════════════════════════════════════════
// EDGE FUNCTION: whatsapp-webhook
// Recebe mensagens do WhatsApp Business API (Meta)
// GET: Verificação do webhook
// POST: Mensagens recebidas
// ═══════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';

serve(async (req) => {
  const url = new URL(req.url);

  // ── GET: Verificação do webhook pela Meta ──
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook WhatsApp verificado com sucesso');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── OPTIONS: CORS ──
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── POST: Mensagem recebida ──
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const supabase = getSupabaseAdmin();

      // Estrutura do webhook da Meta WhatsApp Business API
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages || value.messages.length === 0) {
        // Pode ser status update, delivery receipt, etc.
        return new Response(JSON.stringify({ status: 'ok', type: 'non-message' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (const msg of value.messages) {
        const senderPhone = msg.from; // Número do remetente (formato: 5573XXXXXXXX)
        const messageText = msg.text?.body || msg.caption || '[Mídia não suportada]';
        const messageType = msg.type; // text, image, audio, etc.
        const timestamp = msg.timestamp;

        console.log(`WhatsApp msg de ${senderPhone}: ${messageText}`);

        // Buscar cliente pelo WhatsApp
        const phoneVariants = [
          senderPhone,
          `+${senderPhone}`,
          senderPhone.replace(/^55/, ''),
          `(${senderPhone.slice(2, 4)}) ${senderPhone.slice(4, 9)}-${senderPhone.slice(9)}`,
        ];

        let clienteId: number | null = null;
        for (const phone of phoneVariants) {
          const { data: cli } = await supabase
            .from('clientes')
            .select('id')
            .ilike('whatsapp', `%${phone.slice(-8)}%`)
            .limit(1)
            .single();
          if (cli) {
            clienteId = cli.id;
            break;
          }
        }

        // Salvar mensagem no banco
        const { data: savedMsg, error: msgError } = await supabase.from('mensagens').insert({
          cliente_id: clienteId,
          canal: 'whatsapp',
          data_hora: new Date(parseInt(timestamp) * 1000).toISOString(),
          conteudo: messageText,
          status: 'nao_lida',
          de_cliente: true,
        }).select().single();

        if (msgError) {
          console.error('Erro ao salvar mensagem:', msgError);
          continue;
        }

        // Verificar se atendimento automático está ativo
        const { data: waConfig } = await supabase
          .from('whatsapp_config')
          .select('auto_reply, api_url, api_token, phone_number')
          .eq('id', 1)
          .single();

        if (waConfig?.auto_reply && messageType === 'text') {
          // Chamar agent-atendente para gerar resposta
          try {
            const agentUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/agent-atendente`;
            const agentResp = await fetch(agentUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                cliente_id: clienteId,
                mensagem: messageText,
                canal: 'whatsapp',
              }),
            });

            const agentData = await agentResp.json();
            const resposta = agentData.resposta;

            if (resposta) {
              // Enviar resposta via WhatsApp API
              await sendWhatsAppMessage(
                waConfig.api_url || 'https://graph.facebook.com/v18.0',
                waConfig.api_token,
                waConfig.phone_number,
                senderPhone,
                resposta
              );

              // Salvar resposta no banco
              await supabase.from('mensagens').insert({
                cliente_id: clienteId,
                canal: 'whatsapp',
                data_hora: new Date().toISOString(),
                conteudo: resposta,
                status: 'enviada',
                de_cliente: false,
              });

              // Processar ações do agente (ex: criar pedido)
              if (agentData.acoes) {
                for (const acao of agentData.acoes) {
                  await processAction(supabase, acao, clienteId);
                }
              }
            }
          } catch (e) {
            console.error('Erro no atendimento automático:', e);
            // Fallback: enviar mensagem padrão
            if (waConfig.api_token) {
              await sendWhatsAppMessage(
                waConfig.api_url || 'https://graph.facebook.com/v18.0',
                waConfig.api_token,
                waConfig.phone_number,
                senderPhone,
                'Recebemos sua mensagem! 😊 Responderemos em breve.'
              );
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Webhook error:', error);
      // Retornar 200 mesmo em erro para evitar retry da Meta
      return new Response(JSON.stringify({ status: 'error', message: error.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

async function sendWhatsAppMessage(
  apiUrl: string,
  token: string,
  phoneNumberId: string,
  to: string,
  text: string
) {
  const url = `${apiUrl}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('WhatsApp send error:', response.status, err);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
}

async function processAction(supabase: any, acao: any, clienteId: number | null) {
  try {
    if (acao.type === 'criar_pedido' && clienteId && acao.data) {
      const pedido = {
        cliente_id: clienteId,
        data_pedido: new Date().toISOString().slice(0, 10),
        data_entrega: acao.data.data_entrega || new Date().toISOString().slice(0, 10),
        localidade_id: acao.data.localidade_id || 1,
        itens: acao.data.itens || [],
        valor_total: acao.data.valor_total || 0,
        status_producao: 'pendente',
        status_entrega: 'aguardando',
        observacoes: acao.data.observacoes || 'Pedido via WhatsApp (atendimento automático)',
        pagamento_confirmado: false,
      };
      await supabase.from('pedidos').insert(pedido);
      await supabase.from('activity_log').insert({
        tipo: 'pedido',
        descricao: `Pedido criado via WhatsApp (IA) — Cliente #${clienteId} — R$${pedido.valor_total}`,
        data: new Date().toISOString(),
        operador: 'Agente IA',
        icon: 'pedido',
      });
    }

    if (acao.type === 'atualizar_cliente' && clienteId && acao.data) {
      await supabase.from('clientes').update(acao.data).eq('id', clienteId);
    }
  } catch (e) {
    console.error('Erro ao processar ação:', e);
  }
}
