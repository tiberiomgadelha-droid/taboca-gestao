# FASE 4 — Comunicação e IA | Taboca Gestão

> **Pré-requisitos:** Fases 1, 2 e 3 concluídas. Sistema rodando em produção em `gestao.tabocapaoepizza.com.br` com Supabase PostgreSQL + Auth.

---

## CONTEXTO GERAL

O Taboca Gestão é um SPA React 18 + Vite 5 que roda inteiramente em `src/App.jsx` (~3900 linhas). O backend é Supabase (PostgreSQL + Auth + RLS). A Fase 4 é a última fase do projeto e deve ativar os dois agentes de IA e integrar canais de comunicação (WhatsApp e Instagram).

**Objetivo da Fase 4:** Transformar o Taboca Gestão de um sistema de gestão passivo (onde Tiba gerencia tudo manualmente) em um sistema ativo com IA — onde um assistente ajuda Tiba a tomar decisões e um atendente virtual cuida dos clientes automaticamente.

---

## ARQUITETURA ATUAL (resumo para contexto)

- **Frontend:** React 18 + Vite 5, arquivo único `src/App.jsx`
- **Backend:** Supabase (`fvvgjvfnwylwdikooxae.supabase.co`)
- **Auth:** Supabase Auth (email/password), usuário: `tiberiomgadelha@gmail.com`
- **16 tabelas PostgreSQL** com RLS: settings, colaboradores, produtos, insumos, fichas, transactions, producoes, bens, localidades, grupos, clientes, pedidos, mensagens, rotas, fornadas, activity_log
- **Supabase helpers** já implementados: `sbInsert`, `sbUpdate`, `sbDelete`, `sbUpsertSettings`, `sbFetchAll`
- **Prompts dos agentes** já armazenados em `settings.prompt_agente1` e `settings.prompt_agente2` (editáveis via painel de Configurações)
- **Painel de Mensagens (Painel 6):** UI de inbox já implementada com lista de conversas, filtro por canal/status, visualização de conversa. Dados em tabela `mensagens`.
- **Painel do Assistente (Painel 8):** UI de chat já implementada com área de input e exibição de mensagens. Placeholder sem funcionalidade IA.

---

## TAREFAS DA FASE 4

### TAREFA 1 — Backend Proxy para Claude API

**Problema:** A Claude API (Anthropic) requer uma `API Key` que não pode ser exposta no frontend. É necessário um backend intermediário.

**Solução recomendada:** Criar **Supabase Edge Functions** (Deno) que atuam como proxy para a Claude API.

**Implementar 2 Edge Functions:**

#### 1a. `agent-gestao` (Agente 1 — Assistente de Gestão)

```
POST /functions/v1/agent-gestao
Body: { message: string, context: object }
Response: { reply: string, actions?: array }
```

**Responsabilidades:**
- Receber a mensagem do Tiba + contexto dos dados atuais do sistema
- Montar o prompt com: prompt base (de `settings.prompt_agente1`) + dados relevantes do sistema + mensagem do usuário
- Chamar a Claude API (`claude-sonnet-4-20250514` ou modelo mais recente)
- Interpretar a resposta e, se houver ações (inserir/editar/deletar dados), retornar as ações estruturadas para o frontend executar via helpers existentes
- Retornar a resposta em texto para exibir no chat

**Contexto a enviar para o modelo:**
- Resumo financeiro (receitas, despesas, lucro do mês)
- Estoque atual (produtos com quantidade e alertas)
- Pedidos pendentes
- Próximas fornadas
- Últimas atividades
- Lista de clientes e grupos

**Capacidades do Agente 1:**
- Consultar qualquer dado do sistema e apresentar relatórios
- Registrar transações, pedidos, produções por comando de texto
- Sugerir ações proativas ("Estoque de farinha baixo, registrar compra?")
- Criar campanhas de venda (montar mensagem + selecionar grupo de clientes)
- Agendar envios de mensagens
- Gerar análises: ticket médio, tendências, melhores clientes, margens

#### 1b. `agent-atendente` (Agente 2 — Atendente Virtual)

```
POST /functions/v1/agent-atendente
Body: { cliente_id: number, mensagem: string, canal: string }
Response: { resposta: string, acoes?: array }
```

**Responsabilidades:**
- Receber a mensagem do cliente + dados do cadastro dele
- Montar o prompt com: prompt base (`settings.prompt_agente2`) + protocolo de venda + dados do cliente (nome, grupo, preferências, histórico de pedidos) + cardápio atual (produtos com preços e disponibilidade) + próximas fornadas + localidades/fretes
- Chamar a Claude API
- Retornar resposta para enviar ao cliente + ações (criar pedido, atualizar cadastro, etc.)

**Dados a incluir no contexto:**
- Cadastro completo do cliente (nome, grupo, preferências, endereço)
- Histórico de pedidos do cliente
- Cardápio: produtos em estoque com preços
- Próximas fornadas com prazos de encomenda
- Localidades e valores de frete
- Protocolo de venda completo (por grupo de cliente)

**O Agente 2 deve ser capaz de:**
- Identificar se o cliente é cadastrado (pelo número WhatsApp ou @ Instagram)
- Cadastrar novo cliente automaticamente
- Apresentar cardápio organizado por categoria
- Registrar pedidos no sistema (criar registro em `pedidos`)
- Calcular valor total (produtos + frete)
- Informar prazo de entrega baseado nas fornadas
- Confirmar pagamento e método
- Atualizar dados do cliente (endereço, foto fachada, etc.)
- Encaminhar para Tiba quando não souber responder

---

### TAREFA 2 — Ativar o Agente 1 (Assistente de Gestão) no Frontend

**Onde:** Painel 8 (Assistente de Gestão) — UI de chat já existe.

**Implementar:**

1. **Conectar o chat ao Edge Function `agent-gestao`:**
   - Ao enviar mensagem, chamar a função com o texto + contexto atual dos dados
   - Exibir a resposta no chat com formatação adequada
   - Se a resposta contiver ações, executá-las via helpers (`sbInsert`, `sbUpdate`, etc.) com confirmação do Tiba

2. **Chat flutuante (widget):**
   - O Agente 1 deve estar acessível em QUALQUER painel via botão flutuante
   - Ao clicar, abre um mini-chat overlay
   - Pode ser expandido para o painel completo (Painel 8)

3. **Sugestões proativas:**
   - Ao carregar o Dashboard, verificar condições e exibir sugestões:
     - Estoque baixo → "Farinha T65 está abaixo do mínimo"
     - Pedidos pendentes → "3 pedidos aguardando produção para quarta"
     - Meta de faturamento → "Faltam R$ 800 para a meta do mês"
   - Exibir como cards clicáveis que abrem o chat com a sugestão

4. **Histórico de conversa:**
   - Armazenar mensagens do chat em `localStorage` (não precisa ir para Supabase)
   - Limpar com botão "Nova conversa"

---

### TAREFA 3 — Ativar o Agente 2 (Atendente Virtual) no Frontend

**Onde:** Painel 6 (Mensagens/Atendimento) — UI de inbox já existe.

**Implementar:**

1. **Modo de resposta assistida:**
   - Ao abrir conversa com cliente, mostrar botão "Gerar resposta com IA"
   - Chamar `agent-atendente` com a última mensagem do cliente + contexto
   - Exibir resposta sugerida em campo de preview
   - Tiba revisa e clica "Enviar" para aprovar
   - A mensagem é salva em `mensagens` (de_cliente: false) e enviada pelo canal

2. **Modo automático (toggle):**
   - Toggle "Atendimento automático" por canal (WhatsApp / Instagram)
   - Quando ativo, as mensagens recebidas são processadas automaticamente pelo Agente 2
   - Respostas são enviadas sem necessidade de aprovação manual
   - Log de todas as interações automáticas visível no painel

3. **Painel de monitoramento do Agente 2:**
   - Estatísticas: mensagens respondidas, tempo médio de resposta, pedidos criados via IA
   - Log de conversas automáticas
   - Botão para desativar atendimento automático a qualquer momento

4. **Editor de prompt integrado:**
   - Já existe em Configurações (campo `prompt_agente2`)
   - Adicionar: preview do prompt completo (prompt base + protocolo) para Tiba visualizar o que o agente "sabe"

---

### TAREFA 4 — Integração WhatsApp Business API

**Opções de implementação (escolher uma):**

#### Opção A — WhatsApp Business API (oficial, recomendado para produção)
- Requer conta Meta Business verificada
- API oficial com webhooks para mensagens recebidas
- Supabase Edge Function como webhook receiver
- Custo: pago por conversa (primeiras 1000/mês grátis)

#### Opção B — Baileys (não-oficial, mais simples para MVP)
- Biblioteca open-source que conecta via WhatsApp Web
- Requer servidor Node.js persistente (não funciona em serverless)
- Pode ser bloqueado pelo WhatsApp
- Custo: gratuito, mas arriscado

#### Opção C — API intermediária (Evolution API, WPPConnect, etc.)
- Soluções brasileiras que encapsulam a conexão WhatsApp
- Self-hosted ou SaaS
- Mais simples que a API oficial, mais estável que Baileys

**Fluxo de integração (independente da opção):**

```
Cliente envia mensagem no WhatsApp
  → Webhook recebe no Supabase Edge Function
  → Salva em tabela `mensagens` (canal: 'whatsapp', de_cliente: true)
  → Se atendimento automático ativo:
      → Chama `agent-atendente` com contexto
      → Salva resposta em `mensagens` (de_cliente: false)
      → Envia resposta via API WhatsApp
  → Se atendimento manual:
      → Apenas salva e notifica Tiba no painel
```

**Nova tabela sugerida: `whatsapp_config`**
```sql
CREATE TABLE whatsapp_config (
  id INT PRIMARY KEY DEFAULT 1,
  provider TEXT, -- 'official' | 'baileys' | 'evolution'
  api_url TEXT,
  api_token TEXT,
  phone_number TEXT,
  webhook_secret TEXT,
  auto_reply BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### TAREFA 5 — Integração Instagram Graph API

**Pré-requisitos:**
- Conta Instagram Business vinculada a página Facebook
- App registrado no Meta for Developers
- Permissões: `instagram_manage_messages`, `pages_messaging`

**Fluxo:**

```
Cliente envia DM no Instagram
  → Webhook recebe no Supabase Edge Function
  → Salva em `mensagens` (canal: 'instagram', de_cliente: true)
  → Mesmo fluxo do WhatsApp (automático ou manual)
```

**Nova tabela sugerida: `instagram_config`**
```sql
CREATE TABLE instagram_config (
  id INT PRIMARY KEY DEFAULT 1,
  page_id TEXT,
  access_token TEXT,
  ig_user_id TEXT,
  webhook_verify_token TEXT,
  auto_reply BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### TAREFA 6 — Campanhas de Venda (via Agente 1)

**Funcionalidade:** Tiba pede ao Agente 1 para criar uma campanha de venda. O agente:

1. Seleciona grupo(s) de clientes alvo
2. Gera texto personalizado da campanha (com base nos produtos disponíveis e próximas fornadas)
3. Tiba revisa e aprova
4. Sistema envia mensagem para todos os clientes do grupo via WhatsApp/Instagram
5. Registra envio em `mensagens` e em `activity_log`

**Nova tabela sugerida: `campanhas`**
```sql
CREATE TABLE campanhas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  grupo_ids JSONB NOT NULL, -- [1, 2, 3]
  mensagem TEXT NOT NULL,
  canal TEXT DEFAULT 'whatsapp', -- 'whatsapp' | 'instagram' | 'ambos'
  status TEXT DEFAULT 'rascunho', -- 'rascunho' | 'agendada' | 'enviada'
  data_envio TIMESTAMPTZ,
  total_enviados INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **Tarefa 1** — Backend Proxy (Edge Functions) — base para tudo
2. **Tarefa 2** — Agente 1 no frontend — pode ser testado imediatamente
3. **Tarefa 3** — Agente 2 no frontend — modo "resposta assistida" primeiro
4. **Tarefa 4** — WhatsApp — conecta canal real
5. **Tarefa 5** — Instagram — segundo canal
6. **Tarefa 6** — Campanhas — funcionalidade avançada

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Já existentes
VITE_SUPABASE_URL=https://fvvgjvfnwylwdikooxae.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Novas para Fase 4
ANTHROPIC_API_KEY=sk-ant-...          # No Edge Function (NÃO no frontend)

# WhatsApp (depende da opção escolhida)
WHATSAPP_API_URL=...
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...

# Instagram
INSTAGRAM_PAGE_ACCESS_TOKEN=...
INSTAGRAM_VERIFY_TOKEN=...
```

> **IMPORTANTE:** A chave da Anthropic (`ANTHROPIC_API_KEY`) NUNCA deve ir para o frontend. Ela deve ficar apenas nas Supabase Edge Functions como secret.

---

## CRITÉRIOS DE SUCESSO DA FASE 4

- [ ] Agente 1 responde no chat com dados reais do sistema
- [ ] Agente 1 consegue registrar transações, pedidos e produções por comando de texto
- [ ] Agente 1 apresenta relatórios formatados quando solicitado
- [ ] Agente 2 gera respostas adequadas ao perfil do cliente (por grupo)
- [ ] Agente 2 consegue criar pedidos no sistema a partir da conversa
- [ ] Agente 2 consulta cardápio e fornadas em tempo real
- [ ] Mensagens do WhatsApp chegam no inbox do sistema
- [ ] Respostas do sistema são enviadas de volta pelo WhatsApp
- [ ] Mensagens do Instagram chegam no inbox do sistema
- [ ] Modo automático do Agente 2 funciona sem intervenção manual
- [ ] Campanhas de venda são enviadas para grupos de clientes
- [ ] Prompts dos agentes são editáveis via Configurações

---

## OBSERVAÇÕES TÉCNICAS

1. **Modularização:** Com a Fase 4, o `App.jsx` vai crescer significativamente. Considerar extrair os agentes IA para módulos separados (`src/agents/gestao.js`, `src/agents/atendente.js`) e os hooks para `src/hooks/`.

2. **Rate Limiting:** As Edge Functions devem implementar rate limiting para evitar abuso da Claude API.

3. **Custo da API:** Claude API é cobrada por tokens. Implementar cache de respostas frequentes e limitar o contexto enviado ao necessário.

4. **Realtime:** Considerar usar Supabase Realtime para que novas mensagens do WhatsApp/Instagram apareçam instantaneamente no painel sem refresh.

5. **Fallback:** Se a Claude API estiver indisponível, o Agente 2 deve enviar uma mensagem padrão ("Recebemos sua mensagem! Responderemos em breve.") e marcar para Tiba responder manualmente.

6. **Segurança:** Os tokens de WhatsApp e Instagram são sensíveis. Armazenar como Supabase Vault secrets, não em tabelas públicas.

---

*Prompt elaborado para Tiberio — Taboca Pão e Pizza*
*Fase 4: Comunicação e IA*
