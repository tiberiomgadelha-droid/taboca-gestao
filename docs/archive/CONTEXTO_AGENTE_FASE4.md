# Contexto Completo — Taboca Gestão: Fase 4 (Comunicação e IA)

**Data:** 20 de março de 2026
**Projeto:** Taboca Gestão — Sistema de gestão para padaria artesanal
**Responsável:** Tiba (Tibério Gadelha)
**Status geral:** Fase 4 parcialmente concluída — falta integração WhatsApp webhook + Instagram API

---

## Arquitetura do Sistema

### Stack Tecnológica
- **Frontend:** React 18 + Vite 5 (SPA — arquivo único `src/App.jsx`, ~4335 linhas)
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **IA:** Anthropic Claude API (model: `claude-sonnet-4-6`) via Supabase Edge Function
- **Deploy:** Vercel (auto-deploy via push no branch `main` do GitHub)
- **Repositório:** `tiberiomgadelha-droid/taboca-gestao` (privado)
- **URL de produção:** https://taboca-gestao.vercel.app

### Credenciais e IDs Importantes
- **Supabase Project ID:** `fvvgjvfnwylwdikooxae`
- **Supabase URL:** `https://fvvgjvfnwylwdikooxae.supabase.co`
- **Supabase Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmdqdmZud3lsd2Rpa29veGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODE1NDAsImV4cCI6MjA4OTQ1NzU0MH0.98IP41ulLQpBhRJJDA1TvslYxvSdO2FU2vfUs7Ls2gA`
- **Meta App ID:** `1828488301171252`
- **Meta Business ID:** `105800063729030`
- **WhatsApp Business Account ID:** `2378824302584085`
- **Hospedagem site institucional:** HostGator (cPanel) — `sh00216.hostgator.com.br`

---

## O Que Já Foi Feito (Concluído)

### 1. Edge Function `agent-gestao` — FUNCIONANDO
- **Localização:** Supabase Edge Functions (Deno runtime)
- **Arquivo:** `supabase/functions/agent-gestao/index.ts` (201 linhas)
- **O que faz:** Proxy entre o frontend e a API da Anthropic (Claude). Recebe mensagens do usuário, envia para o Claude com contexto do negócio, e retorna a resposta.
- **Modelo:** `claude-sonnet-4-6`
- **JWT verification:** OFF (desabilitado para simplificar)
- **Endpoint:** `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/agent-gestao`
- **Request body esperado:**
  ```json
  {
    "message": "string — mensagem do usuário",
    "context": "object — dados do negócio (vendas, estoque, etc.)",
    "history": "array (opcional) — histórico de mensagens"
  }
  ```
- **Response:**
  ```json
  {
    "reply": "string — resposta do assistente",
    "actions": "array (opcional) — ações sugeridas",
    "usage": "object — dados de uso da API"
  }
  ```
- **Testado e confirmado funcionando** via logs do Supabase.

### 2. App.jsx Corrigido e Deployado — FUNCIONANDO
- **Problema original:** O App.jsx antigo (3522 linhas) chamava `api.anthropic.com` diretamente do navegador, o que era bloqueado por CORS. O assistente de gestão mostrava "Erro ao conectar com o assistente. Verifique a conexão."
- **Correção:** O App.jsx foi reescrito (~4335 linhas) para chamar a Edge Function do Supabase como proxy: `${supabaseUrl}/functions/v1/agent-gestao`
- **Função chave no código:** `callAgentGestao()` — roteava para o Edge Function em vez da API direta
- **Deploy:** Arquivo subido manualmente para o GitHub pelo Tiba em 20/03/2026. Vercel fez auto-deploy com sucesso.
- **Backup da versão antiga:** `src/App_backup_20260319.jsx`

### 3. Configuração Meta / WhatsApp Business — PARCIALMENTE CONCLUÍDO
- **Meta App criada:** ID `1828488301171252` (nome: "gestao.taboca")
- **WhatsApp Business Account vinculada:** ID `2378824302584085`
- **Número de telefone registrado** no WhatsApp Business API
- **Política de Privacidade publicada:** `https://taboca.com.br/politica-privacidade.html` (no cPanel da HostGator)
- **Webhook URL configurada no Meta:** `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/whatsapp-webhook`
- **Verify Token do webhook:** `taboca_whatsapp_verify_2024`

### 4. Chave API Anthropic
- Chave criada no Claude Platform (`platform.claude.com`)
- Configurada como secret no Supabase Edge Functions (nome: `ANTHROPIC_API_KEY`)

---

## O Que Falta Fazer (Pendente)

### BLOQUEIO ATUAL: Verificação da Conta Meta Business

A conta Meta Business está com **restrição de acesso**. O Meta está revisando a conta para verificar conformidade. Isso impede:
- Enviar/receber mensagens pelo WhatsApp Business API
- Testar o webhook de WhatsApp em produção
- Usar a Instagram API (Messaging + Graph API)

**Status:** Pedido de revisão enviado. Meta informou prazo de até 24h para resposta (enviado em 19/03/2026, deve ser resolvido até 20/03/2026).

**Onde acompanhar:**
- Meta Business Support: `https://business.facebook.com/business-support-home/105800063729030/`
- WhatsApp Manager: `https://business.facebook.com/latest/whatsapp_manager/overview/?business_id=105800063729030`

### TAREFA 1: Criar/Verificar Edge Function `whatsapp-webhook`

Após a conta Meta ser liberada, é preciso garantir que a Edge Function de webhook do WhatsApp esteja deployada e funcionando. Essa função precisa:

1. **Responder ao challenge de verificação do Meta (GET request):**
   - Meta envia: `GET /whatsapp-webhook?hub.mode=subscribe&hub.verify_token=taboca_whatsapp_verify_2024&hub.challenge=RANDOM_STRING`
   - A função deve retornar o valor de `hub.challenge` se o `verify_token` bater

2. **Processar mensagens recebidas (POST request):**
   - Meta envia notificações de mensagens recebidas via POST
   - A função deve:
     - Extrair a mensagem do payload
     - Chamar a Edge Function `agent-gestao` para gerar resposta IA
     - Enviar a resposta de volta ao usuário via WhatsApp Business API

3. **Enviar mensagens de resposta via API do WhatsApp:**
   - Endpoint: `https://graph.facebook.com/v18.0/{phone_number_id}/messages`
   - Headers: `Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}`
   - Body: mensagem de texto formatada

**Secrets necessários no Supabase:**
- `WHATSAPP_ACCESS_TOKEN` — token de acesso da API do WhatsApp (obtido no Meta Developer Console)
- `WHATSAPP_VERIFY_TOKEN` — `taboca_whatsapp_verify_2024`
- `WHATSAPP_PHONE_NUMBER_ID` — ID do número de telefone registrado (verificar no WhatsApp Manager)

### TAREFA 2: Testar Webhook End-to-End

1. Verificar se o webhook responde ao challenge do Meta (pode testar com curl ou no Meta Developer Console)
2. Enviar uma mensagem de teste para o número WhatsApp Business
3. Verificar nos logs do Supabase se a mensagem chegou
4. Verificar se o agent-gestao processou a mensagem
5. Verificar se a resposta foi enviada de volta ao WhatsApp

### TAREFA 3: Integração Instagram API

A Taboca Gestão também precisa integrar com o Instagram para atendimento automático via DM (Direct Messages) com IA. A mesma Meta App (`1828488301171252`) pode ser usada para ambas as integrações (WhatsApp + Instagram).

**O que precisa ser feito:**

1. **Vincular a conta Instagram Business à Meta App:**
   - No Meta Developer Console, adicionar o produto "Instagram" à app
   - Vincular a página do Facebook da Taboca (que deve estar conectada à conta Instagram Business)
   - Solicitar as permissões necessárias: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`

2. **Criar Edge Function `instagram-webhook`:**
   - Similar ao webhook do WhatsApp
   - Endpoint: `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/instagram-webhook`
   - Deve responder ao challenge de verificação do Meta (GET)
   - Deve processar mensagens DM recebidas (POST)
   - Deve chamar o `agent-gestao` para gerar resposta IA
   - Deve enviar resposta via Instagram Messaging API

3. **Configurar webhook no Meta Developer Console:**
   - Produto: Instagram
   - Campos de assinatura: `messages`, `messaging_postbacks`
   - URL: `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/instagram-webhook`
   - Verify Token: pode reutilizar `taboca_whatsapp_verify_2024` ou criar um novo

4. **API de envio de mensagens Instagram:**
   - Endpoint: `https://graph.facebook.com/v18.0/{instagram_user_id}/messages`
   - Headers: `Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}`
   - O token pode ser o mesmo Page Access Token usado para o Instagram

**Secrets adicionais no Supabase:**
- `INSTAGRAM_ACCESS_TOKEN` — token de acesso (pode ser o Page Access Token)
- `INSTAGRAM_VERIFY_TOKEN` — token de verificação do webhook
- `INSTAGRAM_PAGE_ID` — ID da página do Facebook vinculada ao Instagram

**Fluxo completo:** Cliente envia DM no Instagram → Meta encaminha para webhook → Edge Function processa → Chama agent-gestao → Recebe resposta IA → Envia resposta de volta via Instagram Messaging API

**Nota:** A integração Instagram usa a mesma infraestrutura Meta (Graph API), então a verificação da conta Meta Business que está pendente também é pré-requisito para o Instagram.

### TAREFA 4: Configurar Mensagem de Template WhatsApp (se necessário)

O WhatsApp Business API tem regras sobre quem pode iniciar conversa:
- **Usuário inicia:** pode responder com qualquer mensagem dentro de 24h
- **Empresa inicia:** precisa usar templates de mensagem pré-aprovados pelo Meta

Se o Tiba quiser que o sistema envie mensagens proativas (ex: alertas de estoque baixo), será necessário:
1. Criar templates de mensagem no WhatsApp Manager
2. Submeter para aprovação do Meta
3. Integrar o envio de templates no código

---

## Estrutura de Arquivos Relevantes

```
taboca-gestao/
├── src/
│   ├── App.jsx                          # Arquivo principal (~4335 linhas, CORRIGIDO)
│   └── App_backup_20260319.jsx          # Backup da versão antiga (3522 linhas)
├── supabase/
│   └── functions/
│       ├── agent-gestao/
│       │   └── index.ts                 # Edge Function IA — FUNCIONANDO
│       ├── whatsapp-webhook/
│       │   └── index.ts                 # Edge Function webhook WhatsApp — A CRIAR/VERIFICAR
│       └── instagram-webhook/
│           └── index.ts                 # Edge Function webhook Instagram — A CRIAR
├── .env                                 # Variáveis de ambiente (Supabase URL + Anon Key)
└── vercel.json                          # Config de deploy
```

---

## Variáveis de Ambiente (.env)

```
VITE_SUPABASE_URL=https://fvvgjvfnwylwdikooxae.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmdqdmZud3lsd2Rpa29veGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODE1NDAsImV4cCI6MjA4OTQ1NzU0MH0.98IP41ulLQpBhRJJDA1TvslYxvSdO2FU2vfUs7Ls2gA
```

---

## Notas Importantes para o Próximo Agente

1. **O Tiba não é programador.** Instruções devem ser claras, passo a passo, sem jargão desnecessário.

2. **O sandbox do Cowork bloqueia conexões HTTP externas.** Não é possível usar `curl`, `git push`, `fetch` para URLs externas a partir do terminal. Use o navegador Chrome (via MCP tools) para interagir com serviços externos, ou peça ao Tiba para fazer ações manuais simples.

3. **O Supabase CLI pode não estar disponível** no sandbox. Para deploy de Edge Functions, pode ser necessário usar o dashboard do Supabase via navegador ou pedir ao Tiba para usar o CLI no seu computador local.

4. **O App.jsx é um arquivo único muito grande** (~4335 linhas). Evite tentar editar via GitHub web editor — trava. Para mudanças futuras, recomende ao Tiba fazer edições locais e push via Git.

5. **A Edge Function `agent-gestao` já está deployada e funciona.** Não mexa nela a menos que seja necessário.

6. **O webhook URL já está configurado no Meta Developer Console** como `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/whatsapp-webhook` com verify token `taboca_whatsapp_verify_2024`. A Edge Function correspondente precisa ser criada/verificada.

7. **Após a verificação da conta Meta**, o fluxo completo será: Usuário envia mensagem WhatsApp → Meta encaminha para webhook → Edge Function processa → Chama agent-gestao → Recebe resposta IA → Envia resposta de volta via WhatsApp API.

---

## Resumo das Fases do Projeto Taboca Gestão

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Estrutura base, banco de dados, autenticação | Concluída |
| 2 | Módulos de gestão (vendas, estoque, financeiro) | Concluída |
| 3 | Dashboard e relatórios | Concluída |
| 4 | Comunicação e IA (assistente + WhatsApp + Instagram) | **Em andamento** |

**Da Fase 4:**
- Assistente de gestão IA (agent-gestao): **CONCLUÍDO** e funcionando
- Integração WhatsApp Business API: **PENDENTE** (aguardando verificação Meta + deploy webhook)
- Integração Instagram API (DM com IA): **PENDENTE** (aguardando verificação Meta + deploy webhook Instagram)
