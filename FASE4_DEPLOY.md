# FASE 4 — Guia de Deploy

## 1. Executar SQL Migration

Abra o **SQL Editor** do Supabase e execute o conteúdo do arquivo `supabase_fase4_migration.sql`.

Isso criará as tabelas:
- `whatsapp_config`
- `instagram_config`
- `campanhas`

E adicionará campos extras na tabela `mensagens`.

## 2. Configurar API Key da Anthropic

```bash
# Instale o CLI do Supabase (se não tiver)
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref fvvgjvfnwylwdikooxae

# Configurar secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-SUA_CHAVE_AQUI
```

## 3. Deploy das Edge Functions

```bash
# Deploy de todas as funções
supabase functions deploy agent-gestao
supabase functions deploy agent-atendente
supabase functions deploy whatsapp-webhook
supabase functions deploy instagram-webhook
```

## 4. Configurar Webhooks (WhatsApp)

1. Acesse o [Meta for Developers](https://developers.facebook.com)
2. Crie/acesse seu App WhatsApp Business
3. Em **Webhooks**, configure:
   - URL: `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/whatsapp-webhook`
   - Verify Token: (defina no painel de Canais do sistema)
4. Inscreva-se em: `messages`
5. Configure o secret no Supabase:
   ```bash
   supabase secrets set WHATSAPP_VERIFY_TOKEN=seu_token_aqui
   ```

## 5. Configurar Webhooks (Instagram)

1. No mesmo App Meta, adicione o produto **Instagram**
2. Configure webhook de messaging:
   - URL: `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/instagram-webhook`
   - Verify Token: (defina no painel de Canais do sistema)
3. Configure o secret:
   ```bash
   supabase secrets set INSTAGRAM_VERIFY_TOKEN=seu_token_aqui
   ```

## 6. Deploy do Frontend

```bash
git add .
git commit -m "Fase 4: IA e comunicação"
git push origin main
```

O Vercel fará o deploy automático.

## Estrutura dos Novos Arquivos

```
supabase/
  functions/
    _shared/
      anthropic.ts    # Wrapper Claude API
      cors.ts         # Headers CORS
      supabase.ts     # Client Supabase
    agent-gestao/
      index.ts        # Agente 1 - Assistente de Gestão
    agent-atendente/
      index.ts        # Agente 2 - Atendente Virtual
    whatsapp-webhook/
      index.ts        # Webhook WhatsApp Business API
    instagram-webhook/
      index.ts        # Webhook Instagram Graph API

supabase_fase4_migration.sql  # SQL para novas tabelas
```

## Checklist de Verificação

- [ ] SQL migration executada no Supabase
- [ ] `ANTHROPIC_API_KEY` configurada como secret
- [ ] Edge Functions deployadas
- [ ] Chat do assistente (Painel 8) funcionando
- [ ] Botão IA no Atendimento gerando respostas
- [ ] Floating chat widget visível em todos os painéis
- [ ] Sugestões proativas no Dashboard
- [ ] Painel de Campanhas acessível
- [ ] Painel de Canais com configuração WhatsApp/Instagram
- [ ] Webhooks configurados na Meta (quando pronto)
