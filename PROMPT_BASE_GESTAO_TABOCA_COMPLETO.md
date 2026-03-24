# PROMPT BASE — Sistema Taboca Gestao (Contexto Completo para Agentes)

> **Documento gerado em:** 22 de Março de 2026
> **Versão:** Pós-Fase 4 (WhatsApp + Instagram + IA integrados)
> **Proprietário:** Tiberio Gadelha (tiberiomgadelha@gmail.com)
> **Negócio:** Taboca Pao e Pizza — padaria artesanal em Porto Seguro/BA

---

## 1. VISAO GERAL DO SISTEMA

O **Taboca Gestao** (gestao.tabocapaoepizza.com.br) e um sistema web completo de gestao para a padaria Taboca Pao e Pizza. Ele gerencia: financeiro, estoque, producao, clientes, pedidos, entregas, atendimento multicanal (WhatsApp + Instagram) com IA, e dashboards analiticos.

### Stack Tecnologica

| Componente | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 (SPA monolitico em `src/App.jsx`) |
| Backend/DB | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| IA | Anthropic Claude claude-sonnet-4-6 via API |
| Webhooks | Supabase Edge Functions (Deno runtime) |
| WhatsApp | Meta WhatsApp Business API (Cloud API) |
| Instagram | Meta Instagram Messaging API (via Instagram Business Login) |
| Hospedagem | Frontend: a definir deploy (Vite build → static) |
| Dominio | gestao.tabocapaoepizza.com.br |

---

## 2. CREDENCIAIS E IDS (PRODUCAO)

### 2.1 Supabase

| Chave | Valor |
|---|---|
| Project ID | `fvvgjvfnwylwdikooxae` |
| URL | `https://fvvgjvfnwylwdikooxae.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmdqdmZud3lsd2Rpa29veGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODE1NDAsImV4cCI6MjA4OTQ1NzU0MH0.98IP41ulLQpBhRJJDA1TvslYxvSdO2FU2vfUs7Ls2gA` |
| Dashboard | `https://supabase.com/dashboard/project/fvvgjvfnwylwdikooxae` |
| Regiao | South America (Sao Paulo) — sa-east-1 |

### 2.2 Meta / WhatsApp Business

| Chave | Valor |
|---|---|
| Meta App ID (WhatsApp) | `1828488301171252` |
| App Name | `gestao.taboca` |
| WhatsApp Phone | `+55 7399597195` |
| Phone Number ID | `959429737261226` |
| WhatsApp Business Account ID | `237882430258408` |
| Business ID | `105800063729030` |
| Webhook URL | `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/whatsapp-webhook` |
| Webhook Verify Token | `taboca_whatsapp_verify_2024` |

### 2.3 Meta / Instagram

| Chave | Valor |
|---|---|
| Instagram App ID | `2663896989041943` |
| Instagram App Name | `gestao taboca-IG` |
| Instagram Account | `@tabocapaoepizza` |
| Instagram Account ID | `17941461943803807` |
| Webhook URL | `https://fvvgjvfnwylwdikooxae.supabase.co/functions/v1/instagram-webhook` |
| Webhook Verify Token | `taboca_whatsapp_verify_2024` (mesmo do WhatsApp) |

### 2.4 Supabase Edge Function Secrets

Esses secrets estao configurados em Supabase → Edge Functions → Secrets:

| Secret Name | Descricao |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic para os agentes IA |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (acesso admin) |
| `WHATSAPP_API_TOKEN` | Token de acesso WhatsApp Business API (**TEMPORARIO — expira em ~24h, precisa System User Token permanente**) |
| `WHATSAPP_PHONE_NUMBER_ID` | `959429737261226` |
| `WHATSAPP_VERIFY_TOKEN` | `taboca_whatsapp_verify_2024` |
| `INSTAGRAM_ACCESS_TOKEN` | Token de acesso Instagram API (**TEMPORARIO — mesmo problema**) |
| `INSTAGRAM_PAGE_ID` | ID da pagina Instagram para envio de mensagens |
| `INSTAGRAM_VERIFY_TOKEN` | `taboca_whatsapp_verify_2024` |

> **PROBLEMA CRITICO:** Os tokens do WhatsApp e Instagram sao TEMPORARIOS (expiram em ~24h). Para producao permanente, e necessario criar um **System User Token** no Meta Business Suite → Configuracoes do Negocio → Usuarios do Sistema. Esse token nao expira.

### 2.5 Frontend (.env)

```
VITE_SUPABASE_URL=https://fvvgjvfnwylwdikooxae.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. ARQUITETURA DO SISTEMA

### 3.1 Estrutura de Pastas

```
taboca-gestao/
├── src/
│   ├── App.jsx              # Monolito React (~4400+ linhas, todo o frontend)
│   └── main.jsx             # Entry point React
├── public/
│   ├── Logomarca_Taboca.png # Logo principal
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── anthropic.ts # Helper Claude API
│       │   ├── cors.ts      # Headers CORS
│       │   └── supabase.ts  # Client Supabase
│       ├── agent-gestao/
│       │   └── index.ts     # Agente 1 — Assistente de Gestao
│       ├── agent-atendente/
│       │   └── index.ts     # Agente 2 — Atendente Virtual
│       ├── whatsapp-webhook/
│       │   └── index.ts     # Webhook WhatsApp
│       └── instagram-webhook/
│           └── index.ts     # Webhook Instagram
├── supabase_schema.sql      # Schema completo (Fase 3)
├── supabase_fase4_migration.sql # Migration Fase 4
├── supabase_seed.sql        # Dados iniciais
├── .env                     # Variaveis de ambiente
├── package.json             # Deps: react, recharts, lucide-react, @supabase/supabase-js
├── vite.config.js           # Vite config (porta 3000)
└── index.html               # HTML raiz
```

### 3.2 Fluxo de Dados

```
Cliente envia mensagem (WhatsApp/Instagram)
    ↓
Meta envia webhook POST → Supabase Edge Function (whatsapp-webhook ou instagram-webhook)
    ↓
Edge Function:
  1. Extrai dados da mensagem
  2. Busca ou cria cliente no banco (findOrCreateCliente)
  3. Salva mensagem incoming no banco (saveMensagem)
  4. Marca como lida no WhatsApp (markAsRead)
  5. Busca historico recente (6 ultimas msgs)
  6. Chama agent-atendente (IA) com contexto do cliente
  7. Salva resposta IA no banco
  8. Envia resposta de volta para o cliente
    ↓
Frontend (App.jsx) recebe via Supabase Realtime (WebSocket) e atualiza em tempo real
```

### 3.3 Supabase Realtime

Habilitado via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
```

O frontend escuta INSERT e UPDATE nessas tabelas para atualizar a interface sem refresh.

---

## 4. BANCO DE DADOS — SCHEMA COMPLETO

### 4.1 Tabelas Principais (16 tabelas)

| Tabela | Descricao |
|---|---|
| `settings` | Singleton (id=1). Meta faturamento, prompts dos agentes, config geral |
| `colaboradores` | Funcionarios (nome, funcao, valor_por_fornada) |
| `produtos` | Catalogo de produtos (nome, categoria, quantidade, valor_unitario, emoji) |
| `insumos` | Materias-primas (nome, quantidade, unidade, valor_unitario) |
| `fichas` | Fichas tecnicas de producao (ingredientes JSONB, etapas JSONB, custos) |
| `transactions` | Fluxo de caixa (receitas e despesas, conta, categoria) |
| `producoes` | Registros de producao diaria (produto_id, quantidade, operador) |
| `bens` | Patrimonio/ativos (nome, valor, depreciacao) |
| `localidades` | Areas de entrega (nome, valor_entrega, tempo_estimado, link_maps) |
| `grupos` | Grupos de clientes (Potenciais, Novos, Esporadicos, Fixos, Colaborador) |
| `clientes` | Cadastro completo (nome, whatsapp, instagram, endereco, grupo_id, localidade_id) |
| `pedidos` | Pedidos (itens JSONB, valor_total, status_producao, status_entrega) |
| `mensagens` | Todas as mensagens (cliente_id, canal, conteudo, de_cliente, origem, external_id) |
| `rotas` | Rotas de entrega (lista_pedido_ids, entregador, status) |
| `fornadas` | Programacao de fornadas (data, hora_inicio, hora_fim, tipo) |
| `activity_log` | Log de atividades do sistema |

### 4.2 Tabelas Fase 4 (Migration)

| Tabela | Descricao |
|---|---|
| `whatsapp_config` | Singleton config WhatsApp (api_token, phone_number_id, auto_reply) |
| `instagram_config` | Singleton config Instagram (page_id, access_token, ig_user_id) |
| `campanhas` | Campanhas de venda (grupo_ids, mensagem, canal, status, data_envio) |

### 4.3 Colunas Adicionais na `mensagens` (Fase 4)

- `origem TEXT DEFAULT 'manual'` — valores: 'manual', 'ia_automatico', 'ia_assistido', 'campanha'
- `external_id TEXT` — ID da mensagem no WhatsApp/Instagram para deduplicacao

### 4.4 RLS (Row Level Security)

Todas as tabelas tem RLS habilitado com politica simples: `authenticated users podem tudo`.

### 4.5 Indices

```sql
idx_transactions_data, idx_transactions_tipo, idx_producoes_operador,
idx_producoes_pago, idx_pedidos_status, idx_clientes_grupo,
idx_activity_log_data, idx_mensagens_cliente, idx_mensagens_status,
idx_campanhas_status, idx_mensagens_canal, idx_mensagens_de_cliente
```

---

## 5. EDGE FUNCTIONS (4 funcoes)

### 5.1 agent-gestao (Agente 1 — Assistente de Gestao)

- **Endpoint:** `POST /functions/v1/agent-gestao`
- **Input:** `{ message: string, context: object, history?: array }`
- **Output:** `{ reply: string, actions?: array, usage: object }`
- **Modelo:** Claude claude-sonnet-4-6 (max_tokens: 2048)
- **Rate Limit:** 15 req/60s
- **Funcao:** Auxilia o gestor (Tiba) com analises, registros e decisoes. Recebe contexto completo do sistema (financeiro, estoque, pedidos, fornadas, clientes, transacoes).
- **Acoes:** Retorna acoes em blocos ```action com type: insert/update/delete em qualquer tabela.
- **System Prompt:** Usa `settings.prompt_agente1` + contexto dinamico do banco.

### 5.2 agent-atendente (Agente 2 — Atendente Virtual)

- **Endpoint:** `POST /functions/v1/agent-atendente`
- **Input:** `{ cliente_id: number, mensagem: string, canal: string, history?: array }`
- **Output:** `{ resposta: string, acoes?: array, usage: object }`
- **Modelo:** Claude claude-sonnet-4-6 (max_tokens: 1024)
- **Rate Limit:** 30 req/60s
- **Funcao:** Atende clientes automaticamente via WhatsApp e Instagram. Conhece o cardapio, precos, fornadas, localidades de entrega, historico do cliente.
- **Contexto:** Busca em paralelo: settings, cliente, produtos disponiveis, fornadas proximas, localidades, grupos, pedidos do cliente.
- **Abordagem por Grupo:** Potenciais (alta exclusividade), Novos (confirmar dados), Esporadicos (similar novos), Fixos (ultra-direta), Colaborador (informacoes).
- **Acoes:** `criar_pedido`, `atualizar_cliente`, `encaminhar_tiba`
- **Fallback:** Se a IA falhar, retorna mensagem amigavel pedindo para tentar novamente.

### 5.3 whatsapp-webhook

- **Endpoint:** `GET /functions/v1/whatsapp-webhook` (verificacao) e `POST` (mensagens)
- **Fluxo completo em 7 passos:** receber → buscar/criar cliente → salvar msg → marcar lida → buscar historico → chamar IA → salvar resposta → enviar resposta
- **Env vars:** `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
- **Formato payload Meta:** `body.entry[0].changes[0].value.messages[0]`
- **Tipos suportados:** Apenas `text` (outros tipos logam e ignoram)

### 5.4 instagram-webhook

- **Endpoint:** `GET /functions/v1/instagram-webhook` (verificacao) e `POST` (DMs)
- **Fluxo identico ao WhatsApp** adaptado para Instagram Messaging API
- **Env vars:** `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_PAGE_ID`, `INSTAGRAM_VERIFY_TOKEN`
- **Formato payload Meta:** `body.entry[0].messaging[0]` (diferente do WhatsApp!)
- **Filtro echo:** Ignora `messaging.message.is_echo` (msgs enviadas pela propria pagina)
- **Identificacao:** Usa Graph API para buscar `name,username` do sender

---

## 6. FRONTEND (App.jsx)

### 6.1 Estrutura do Monolito

O arquivo `src/App.jsx` (~4400+ linhas) contem TUDO:

- **Hooks customizados:** `useIsMobile()`, `useLiveClock()`
- **Helpers Supabase:** `sbInsert()`, `sbUpdate()`, `sbDelete()`, `sbUpsertSettings()`, `sbFetchAll()`
- **Componente principal:** `TabocaGestao()` — gerencia estado global `data`, autenticacao, e roteamento
- **Panels (telas):**
  - `PanelDashboard` — KPIs, graficos, alertas
  - `PanelCardapio` — Catalogo de produtos
  - `PanelProducao` — Fichas tecnicas e producao
  - `PanelEstoque` — Produtos e insumos
  - `PanelClientes` — Cadastro, grupos, localizacao
  - `PanelAtendimento` — Chat WhatsApp/Instagram com IA (linhas ~2609-2805)
  - `PanelPedidos` — Gestao de pedidos e entregas
  - `PanelIA` — Interface do Agente 1 (gestao)
  - E outros...

### 6.2 PanelAtendimento (Chat)

- **Inbox:** Lista de conversas agrupadas por `cliente_id`, com filtros (Todos, WhatsApp, Instagram, Nao lidas)
- **Chat:** Exibicao de mensagens com bolhas (estilo WhatsApp), diferenciando msgs do cliente e respostas
- **IA:** Botao para gerar sugestao do agent-atendente, com preview e opcoes "Aprovar e Enviar" ou "Editar"
- **Atendimento Automatico:** Toggles para habilitar auto-reply por canal
- **Estatisticas:** Total de respostas IA e pedidos via IA
- **Realtime:** Subscriptions Supabase Realtime para `mensagens` (INSERT e UPDATE) e `clientes` (INSERT e UPDATE)

### 6.3 Supabase Realtime no Frontend

```javascript
// No componente TabocaGestao, apos autenticacao:
supabase.channel('realtime-mensagens')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, callback)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensagens' }, callback)
  .subscribe();

supabase.channel('realtime-clientes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clientes' }, callback)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clientes' }, callback)
  .subscribe();
```

---

## 7. HISTORICO DE FASES

### Fase 1 — Fundacao

- Criacao do projeto React + Vite
- Setup Supabase (banco, auth, RLS)
- Dashboard basico com KPIs
- Modulos: Financeiro, Estoque, Producao

### Fase 2 — Expansao

- Modulos: Clientes, Pedidos, Entregas, Rotas
- Sistema de grupos de clientes (Potenciais → Novos → Esporadicos → Fixos)
- Localidades com valor de entrega e links Google Maps
- Fichas tecnicas de producao com calculo de custos

### Fase 3 — Inteligencia

- Integracao com Anthropic Claude API
- Agente 1 (agent-gestao): assistente de gestao com contexto completo do sistema
- Agente 2 (agent-atendente): atendente virtual para clientes
- Interface de chat com IA no painel
- Migration: supabase_schema.sql completo

### Fase 4 — Canais de Comunicacao (ATUAL)

- **WhatsApp Business API** totalmente integrado (webhook + envio + recepcao)
- **Instagram Messaging API** totalmente integrado
- Webhooks que salvam mensagens no banco, chamam IA, e respondem automaticamente
- Auto-criacao de clientes quando mensagem vem de numero/conta novo
- Painel de Atendimento com chat multicanal
- Supabase Realtime para atualizacao em tempo real
- Migration Fase 4: tabelas `whatsapp_config`, `instagram_config`, `campanhas` + colunas `origem`, `external_id` em `mensagens`

---

## 8. PROBLEMAS CONHECIDOS E PENDENCIAS

### 8.1 Tokens Temporarios (CRITICO)

Os tokens do WhatsApp e Instagram expiram em ~24h. **Solucao definitiva:** criar System User Token no Meta Business Suite (permanente). Passos:
1. Meta Business Suite → Configuracoes → Usuarios do Sistema
2. Criar System User (tipo Admin)
3. Atribuir acesso ao WhatsApp Business Account e Instagram App
4. Gerar token com permissoes: `whatsapp_business_messaging`, `whatsapp_business_management`, `instagram_basic`, `instagram_manage_messages`, `pages_messaging`
5. Atualizar secrets no Supabase: `WHATSAPP_API_TOKEN` e `INSTAGRAM_ACCESS_TOKEN`

### 8.2 Build do Frontend

O projeto precisa ser buildado (`npm run build`) na maquina do usuario (Windows). O `dist/` gerado deve ser deployado na hospedagem. Node modules sao para Windows (rollup nativo x64).

### 8.3 Mensagens Nao-Texto

Os webhooks atualmente so processam mensagens de texto. Imagens, audio, video, stickers sao ignorados (logam tipo e retornam ok).

### 8.4 Envio Manual do Painel

A funcao `enviarMensagem` no frontend salva no banco mas NAO envia de fato via API WhatsApp/Instagram. Para isso, seria necessario criar uma Edge Function de envio ativo ou chamar a Graph API diretamente do frontend (nao recomendado por seguranca de token).

### 8.5 Campanhas

A tabela `campanhas` existe mas a funcionalidade de disparo em massa ainda nao foi implementada.

---

## 9. COMO FAZER DEPLOY DE EDGE FUNCTIONS

As Edge Functions sao deployadas via **Supabase Dashboard** (nao CLI):

1. Acesse `https://supabase.com/dashboard/project/fvvgjvfnwylwdikooxae/functions`
2. Clique na funcao desejada → aba **Code**
3. Cole o codigo no editor Monaco
4. Clique em **Deploy**

Alternativamente, via Supabase CLI:
```bash
supabase functions deploy whatsapp-webhook --project-ref fvvgjvfnwylwdikooxae
supabase functions deploy instagram-webhook --project-ref fvvgjvfnwylwdikooxae
supabase functions deploy agent-gestao --project-ref fvvgjvfnwylwdikooxae
supabase functions deploy agent-atendente --project-ref fvvgjvfnwylwdikooxae
```

---

## 10. COMO EXECUTAR LOCALMENTE

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (ja existe no projeto)
# VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 3. Iniciar dev server
npm run dev
# Abre em http://localhost:3000

# 4. Build para producao
npm run build
# Gera pasta dist/
```

---

## 11. INSTRUCOES PARA PROXIMO AGENTE

Se voce e um agente IA trabalhando neste sistema, aqui estao as instrucoes:

1. **Frontend:** O arquivo principal e `src/App.jsx`. E um monolito React. Todas as telas, componentes, estilos e logica estao nele. Cuidado ao editar — e muito grande.

2. **Edge Functions:** Cada funcao e self-contained (nao usa imports _shared). O deploy e via Dashboard Supabase ou CLI.

3. **Banco:** Use o SQL Editor do Supabase para migrations. Sempre use `IF NOT EXISTS` e `ON CONFLICT DO NOTHING` para idempotencia.

4. **Tokens:** Se as mensagens nao estao chegando/sendo enviadas, verifique os logs das Edge Functions. O erro mais comum e token expirado (401). Regenere no Meta Developer Console e atualize em Supabase Secrets.

5. **Realtime:** As tabelas `mensagens` e `clientes` estao na publicacao `supabase_realtime`. Se adicionar novas tabelas que precisam de realtime, execute: `ALTER PUBLICATION supabase_realtime ADD TABLE nome_tabela;`

6. **Teste de webhook:** Envie uma mensagem de um numero/conta externo para +55 7399597195 (WhatsApp) ou @tabocapaoepizza (Instagram). Monitore os logs em Supabase → Edge Functions → Logs.

7. **Formato de payload Meta:**
   - WhatsApp: `body.entry[0].changes[0].value.messages[0]`
   - Instagram: `body.entry[0].messaging[0]`
   - Sao formatos DIFERENTES, cuidado!

---

*Documento gerado automaticamente como base de contexto para continuidade do desenvolvimento do sistema Taboca Gestao.*
