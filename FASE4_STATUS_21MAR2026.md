# Taboca Gestão — Fase 4: Status Atualizado (21/03/2026)

## Resumo da Situação

### O que está FUNCIONANDO
- **Assistente IA (agent-gestao):** Edge Function deployada e operacional
- **Assistente Atendente (agent-atendente):** Edge Function deployada e operacional
- **App.jsx corrigido:** Deploy no Vercel via GitHub funcionando
- **Webhook WhatsApp:** Edge Function deployada no Supabase (4 deployments)
- **Webhook Instagram:** Edge Function deployada no Supabase (4 deployments)

### Secrets configurados no Supabase (8 total)
1. ANTHROPIC_API_KEY
2. SUPABASE_URL
3. SUPABASE_ANON_KEY
4. SUPABASE_SERVICE_ROLE_KEY
5. SUPABASE_DB_URL
6. WHATSAPP_VERIFY_TOKEN
7. WHATSAPP_API_TOKEN
8. WHATSAPP_PHONE_NUMBER_ID

### Secrets que FALTAM (para Instagram)
- INSTAGRAM_ACCESS_TOKEN
- INSTAGRAM_VERIFY_TOKEN (pode reutilizar o mesmo do WhatsApp)
- INSTAGRAM_PAGE_ID

---

## BLOQUEIO PRINCIPAL: Contas WhatsApp restritas

Verificado em 21/03/2026 no Meta Business Support:
- **Test WhatsApp Business** (ID: 1453784346141688) → CONTA RESTRITA
- **Taboca Pão e Pizza** (ID: 2378824302584085) → CONTA RESTRITA
- **Taboca Pão e Pizza** (ID: 1315528573815535) → CONTA RESTRITA

A restrição impede envio/recebimento de mensagens via WhatsApp Business API.

---

## Próximos Passos (em ordem)

### 1. Resolver restrição da conta Meta (PRIORIDADE)
- Acessar: https://business.facebook.com/business-support-home/105800063729030/
- Clicar na conta "Taboca Pão e Pizza" (ID: 2378824302584085) restrita
- Seguir instruções para solicitar revisão / recurso
- Se já foi solicitado, aguardar resposta do Meta

### 2. Verificar nome do secret no código deployado
- O Supabase tem o secret como `WHATSAPP_API_TOKEN`
- Confirmar se o código deployado usa `WHATSAPP_API_TOKEN` (e não `WHATSAPP_ACCESS_TOKEN`)
- Se estiver diferente, atualizar o código e redeployar via CLI:
  ```bash
  cd taboca-gestao
  supabase functions deploy whatsapp-webhook --no-verify-jwt
  ```

### 3. Testar webhook do WhatsApp (após liberação Meta)
- No Meta Developer Console, clicar "Test" no webhook
- Verificar logs no Supabase (Edge Functions > whatsapp-webhook > Logs)
- Enviar mensagem real para o número WhatsApp Business

### 4. Configurar Instagram (após liberação Meta)
- No Meta Developer Console, adicionar produto "Instagram" à app
- Vincular página do Facebook à conta Instagram Business
- Solicitar permissões: instagram_basic, instagram_manage_messages, pages_messaging
- Adicionar secrets no Supabase: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID
- Configurar webhook URL no Meta: https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/instagram-webhook
- Redeployar instagram-webhook via CLI se necessário

### 5. Testes finais
- WhatsApp: enviar mensagem → receber resposta IA
- Instagram: enviar DM → receber resposta IA
- Verificar logs de ambos os webhooks no Supabase

---

## Arquivos de código atualizados (na pasta selecionada)

```
supabase/functions/
├── whatsapp-webhook/index.ts   # Código completo e atualizado
└── instagram-webhook/index.ts  # Código completo e atualizado
```

Estes arquivos podem ser usados para redeployar as Edge Functions via Supabase CLI caso necessário.
