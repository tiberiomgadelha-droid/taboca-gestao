// ═══════════════════════════════════════════════════
// EDGE FUNCTION: instagram-webhook
// Recebe DMs do Instagram via Graph API (Meta)
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

    const verifyToken = Deno.env.get('INSTAGRAM_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook Instagram verificado com sucesso');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── POST: Mensagem recebida ──
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const supabase = getSupabaseAdmin();

      // Estrutura do webhook Instagram Messaging
      const entry = body?.entry?.[0];
      const messaging = entry?.messaging;

      if (!messaging || messaging.length === 0) {
        return new Response(JSON.stringify({ status: 'ok', type: 'non-message' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (const event of messaging) {
        if (!event.message) continue; // Pode ser read receipt, etc.

        const senderId = event.sender?.id;
        const messageText = event.message.text || '[Mídia]';
        const timestamp = event.timestamp;

        console.log(`Instagram DM de ${senderId}: ${messageText}`);

        // Buscar cliente pelo Instagram ID ou @
        // Primeiro tentamos buscar por ig_user_id salvo, depois por @
        let clienteId: number | null = null;

        // Buscar perfil do Instagram para obter username
        const { data: igConfig } = await supabase
          .from('instagram_config')
          .select('access_token, auto_reply')
          .eq('id', 1)
          .single();

        let senderUsername = '';
        if (igConfig?.access_token) {
          try {
            const profileResp = await fetch(
              `https://graph.facebook.com/v18.0/${senderId}?fields=username,name&access_token=${igConfig.access_token}`
            );
            const profile = await profileResp.json();
            senderUsername = profile.username || '';
          } catch (e) {
            console.error('Erro ao buscar perfil Instagram:', e);
          }
        }

        if (senderUsername) {
          const { data: cli } = await supabase
            .from('clientes')
            .select('id')
            .ilike('instagram', `%${senderUsername}%`)
            .limit(1)
            .single();
          if (cli) clienteId = cli.id;
        }

        // Salvar mensagem
        const { error: msgError } = await supabase.from('mensagens').insert({
          cliente_id: clienteId,
          canal: 'instagram',
          data_hora: new Date(timestamp).toISOString(),
          conteudo: messageText,
          status: 'nao_lida',
          de_cliente: true,
        });

        if (msgError) {
          console.error('Erro ao salvar mensagem Instagram:', msgError);
          continue;
        }

        // Atendimento automático
        if (igConfig?.auto_reply) {
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
                canal: 'instagram',
              }),
            });

            const agentData = await agentResp.json();
            const resposta = agentData.resposta;

            if (resposta && igConfig.access_token) {
              // Enviar resposta via Instagram Send API
              await sendInstagramMessage(igConfig.access_token, senderId, resposta);

              // Salvar resposta
              await supabase.from('mensagens').insert({
                cliente_id: clienteId,
                canal: 'instagram',
                data_hora: new Date().toISOString(),
                conteudo: resposta,
                status: 'enviada',
                de_cliente: false,
              });

              // Processar ações
              if (agentData.acoes) {
                for (const acao of agentData.acoes) {
                  if (acao.type === 'criar_pedido' && clienteId) {
                    await supabase.from('pedidos').insert({
                      cliente_id: clienteId,
                      data_pedido: new Date().toISOString().slice(0, 10),
                      data_entrega: acao.data?.data_entrega || new Date().toISOString().slice(0, 10),
                      localidade_id: acao.data?.localidade_id || 1,
                      itens: acao.data?.itens || [],
                      valor_total: acao.data?.valor_total || 0,
                      status_producao: 'pendente',
                      status_entrega: 'aguardando',
                      observacoes: 'Pedido via Instagram (atendimento automático)',
                      pagamento_confirmado: false,
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.error('Erro no atendimento automático Instagram:', e);
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Instagram webhook error:', error);
      return new Response(JSON.stringify({ status: 'error' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

async function sendInstagramMessage(accessToken: string, recipientId: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Instagram send error:', response.status, err);
    throw new Error(`Instagram API error: ${response.status}`);
  }

  return response.json();
}
