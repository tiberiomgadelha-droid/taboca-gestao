# PROMPT — Taboca Pão e Pizza | Sistema de Gestão Empresarial (v2)

> **Versão:** 2.0 — Atualizado em 19/03/2026
> **Status:** Fases 1, 2 e 3 concluídas. Fase 4 pendente.
> **Autor do projeto:** Tiberio Gadelha (Tiba)

---

## 1. CONTEXTO E PAPEL DO AGENTE

Você é um agente especialista em desenvolvimento de aplicações web empresariais full-stack. Sua tarefa é manter e evoluir o **Taboca Gestão** — uma plataforma de gestão completa e de uso pessoal para **Tiberio (Tiba)**, proprietário da **Taboca Pão e Pizza**, uma padaria e pizzaria artesanal que opera no modelo delivery na cidade de Ilhéus-BA.

O sistema é uma **Single Page Application (SPA)** com layout totalmente responsivo (desktop e mobile), funcionando como plataforma central de gestão do negócio — consolidando contabilidade, estoque, produção, clientes, pedidos e atendimento em um único lugar.

### Identidade Visual (implementada)

- **Nome do sistema:** Taboca Gestão
- **Tom:** quente, artesanal, profissional — remetendo à identidade de uma padaria premium
- **Paleta de cores implementada:**
  - Primary: `#7B3A10` (marrom escuro)
  - Amber/Accent: `#D4884A` (âmbar)
  - Cream/Background: `#FFF8F0` (creme)
  - Text Dark: `#3E2723`
  - Text Light: `#8D6E63`
  - Success: `#2E7D32` (verde)
  - Warning: `#F57F17` (amarelo)
  - Danger: `#C62828` (vermelho)
- **Tipografia:** Montserrat Bold para títulos + Montserrat Regular para dados (via Google Fonts CDN)
- **Ícones:** Lucide React — estilo sólido, minimalista

### Domínio e Hospedagem (configurados)

- **URL de produção:** `https://gestao.tabocapaoepizza.com.br`
- **Hospedagem:** Vercel (plano Hobby)
- **Repositório:** GitHub (`tiberiomgadelha-droid/taboca-gestao`)
- **Branch de produção:** `main`

---

## 2. ESCOPO FUNCIONAL — MÓDULOS DO SISTEMA

O sistema possui **9 painéis principais** acessíveis por menu lateral (desktop) / bottom-nav (mobile):

| # | Painel | Status |
|---|--------|--------|
| 1 | Dashboard (Página Principal) | ✅ Implementado |
| 2 | Contabilidade (Fluxo de Caixa, Plano de Contas, Balanço, Pagamentos) | ✅ Implementado |
| 3 | Estoque (Produtos, Insumos, Fichas Técnicas) | ✅ Implementado |
| 4 | Produção | ✅ Implementado |
| 5 | Clientes (Perfis, Grupos, Localidades) | ✅ Implementado |
| 6 | Atendimento / Mensagens (+ Agente 2 — Atendente Virtual) | ⚠️ UI implementada, Agente 2 pendente |
| 7 | Pedidos & Entregas (+ Rotas, Fornadas) | ✅ Implementado |
| 8 | Assistente de Gestão (Agente 1) | ⚠️ UI implementada, Agente 1 pendente |
| 9 | Configurações | ✅ Implementado |

---

## 3. ARQUITETURA TÉCNICA (Estado Atual)

### Stack Implementada

- **Frontend:** React 18 + Vite 5 (SPA em arquivo único `src/App.jsx` com ~3900 linhas)
- **Estilização:** CSS-in-JS inline (não usa Tailwind — estilos são objetos JS diretamente nos componentes)
- **Gráficos:** Recharts (BarChart, PieChart, AreaChart)
- **Ícones:** Lucide React
- **Roteamento:** Estado interno (`currentPanel`) — não usa React Router
- **Persistência:** Supabase (PostgreSQL + Auth + RLS)
- **Autenticação:** Supabase Auth (email + password)

### Arquitetura do Código

O sistema inteiro reside em `src/App.jsx`. Estrutura interna:

```
[Imports: React, Recharts, Lucide, Supabase]
  ↓
[Supabase Client + Helpers: sbInsert, sbUpdate, sbDelete, sbUpsertSettings, sbFetchAll]
  ↓
[useIsMobile hook]
  ↓
[mkData() — dados mock de fallback caso Supabase falhe]
  ↓
[Componentes de cada painel (funções dentro do componente principal)]
  ↓
[LoginScreen — autenticação via Supabase Auth]
  ↓
[TabocaGestao — componente principal exportado]
```

### Padrão de Persistência (Fase 3)

- **Optimistic Updates:** O estado React (`data`) é atualizado imediatamente; a gravação no Supabase ocorre em background (fire-and-forget).
- **Fallback:** Se `sbFetchAll()` falhar, `mkData()` fornece dados mock para que o app funcione offline.
- **IDs:** Supabase usa `BIGSERIAL`. Para INSERTs, um ID temporário (`Date.now()`) é atribuído localmente, e ao retornar do Supabase, o ID real substitui o temporário no estado.
- **Helpers:**
  - `sbInsert(table, record)` — remove `id` antes de inserir, retorna registro com ID real
  - `sbUpdate(table, id, updates)` — atualiza campos específicos
  - `sbDelete(table, id)` — remove registro
  - `sbUpsertSettings(settings)` — upsert na tabela settings (singleton, id=1)
  - `sbFetchAll()` — busca todas as 16 tabelas em paralelo

### Autenticação

- **Login:** `supabase.auth.signInWithPassword({ email, password })`
- **Sessão:** `supabase.auth.getSession()` + `onAuthStateChange()`
- **Usuário admin:** `tiberiomgadelha@gmail.com` / `210261Tb`
- **Tela de login:** Mantém identidade visual do sistema (logo, cores, marca)

---

## 4. BANCO DE DADOS — SUPABASE (PostgreSQL)

### Projeto Supabase

- **URL:** `https://fvvgjvfnwylwdikooxae.supabase.co`
- **Projeto:** `taboca-gestão` (organização: `taboca-gestao`)
- **Região:** South America (sa-east-1)

### Tabelas (16 tabelas)

| # | Tabela | Campos Principais | Notas |
|---|--------|-------------------|-------|
| 1 | `settings` | id (singleton=1), meta_faturamento, nome_empresa, responsavel, cargo, prompt_agente1, prompt_agente2, contas (JSONB), capital_social | Singleton com CHECK(id=1) |
| 2 | `colaboradores` | id, nome, funcao, email, whatsapp, foto, valor_por_fornada, ativo | |
| 3 | `produtos` | id, nome, categoria, quantidade, valor_unitario, prazo_validade, alerta_minimo, emoji, descricao | Categorias: panificação, pizzas, bebidas |
| 4 | `insumos` | id, nome, categoria, quantidade, unidade, valor_unitario, prazo_validade, alerta_minimo | Categorias: farinhas, agua_mineral, fermento_biologico, condimentos, etc. |
| 5 | `fichas` | id, produto_id (FK→produtos), nome_produto, categoria_produto, valor_venda_unitario, custo_material, custo_mao_obra, custo_bruto_producao, margem_lucro, modo_preparo, peso_cru, peso_pronto, percentual_perda, ingredientes (JSONB), etapas (JSONB), tempo_preparo, rendimento | FK com ON DELETE CASCADE |
| 6 | `transactions` | id, descricao, data, conta, categoria, tipo (CHECK: receita/despesa), valor, insumo_reposto (JSONB) | |
| 7 | `producoes` | id, data, produto_id (FK→produtos), quantidade, operador, observacao, etapas_producao (JSONB), pago_colaborador | |
| 8 | `bens` | id, nome, valor, data_aquisicao, categoria, depreciado | Para Balanço Patrimonial |
| 9 | `localidades` | id, nome_localidade, rota_descricao, valor_entrega, link_rota_maps, tempo_estimado | |
| 10 | `grupos` | id, nome_grupo, descricao, cor, lista_cliente_ids (JSONB) | Grupos: potenciais, novos, esporádicos, fixos, colaborador |
| 11 | `clientes` | id, nome, whatsapp, instagram, endereco_completo, localidade_id (FK→localidades), link_googlemaps, foto_fachada_url, preferencias, grupo_id (FK→grupos), data_cadastro | |
| 12 | `pedidos` | id, data_pedido, data_entrega, cliente_id (FK→clientes), localidade_id (FK→localidades), itens (JSONB), valor_total, status_producao, status_entrega, observacoes, pagamento_confirmado | JSONB itens: [{produto_id, quantidade, valor}] |
| 13 | `mensagens` | id, cliente_id (FK→clientes), canal, data_hora, conteudo, status, pedido_id (FK→pedidos), de_cliente | Canal: whatsapp/instagram |
| 14 | `rotas` | id, nome_rota, data, lista_pedido_ids (JSONB), status_rota, entregador | |
| 15 | `fornadas` | id, data, hora_inicio, hora_fim, tipo, encerramento_encomenda | Não estava no prompt original — adicionada na Fase 3 |
| 16 | `activity_log` | id, tipo, descricao, data, operador, icon | Log de atividades do sistema |

### Diferenças em relação ao prompt original

1. **3 tabelas adicionais** não previstas no prompt original mas encontradas no código: `mensagens`, `rotas`, `fornadas`
2. **Campos extras:** `emoji` e `descricao` em produtos; `ingredientes` e `etapas` (JSONB) em fichas; `etapas_producao` (JSONB) e `pago_colaborador` em producoes; `de_cliente` em mensagens; `tempo_estimado` em localidades; `cor` em grupos
3. **Campo `contas` em settings** é JSONB (array de objetos com id, nome, saldo_inicial) em vez de tabela separada
4. **Campo `insumo_reposto`** em transactions é JSONB (para vincular reposição de estoque à transação)
5. **Tabela `fornadas`** controla os ciclos de produção (pães às quartas, pães+pizzas às sextas) com horários e prazo de encerramento de encomendas
6. **Tabela `colaboradores`** inclui `valor_por_fornada` para cálculo de pagamento por produção

### Row Level Security (RLS)

- Todas as 16 tabelas têm RLS habilitado
- Políticas: `allow_anon_*` e `allow_auth_*` permitem todas as operações para roles `anon` e `authenticated`
- Na Fase 4, considerar restringir policies para apenas `authenticated`

### Índices

```sql
idx_transactions_data (data DESC)
idx_transactions_tipo (tipo)
idx_producoes_operador (operador)
idx_producoes_pago (pago_colaborador)
idx_pedidos_status (status_producao, status_entrega)
idx_clientes_grupo (grupo_id)
idx_activity_log_data (data DESC)
idx_mensagens_cliente (cliente_id)
idx_mensagens_status (status)
```

---

## 5. ESPECIFICAÇÃO DETALHADA DE CADA PAINEL

### PAINEL 1 — DASHBOARD (Página Principal)

- Data e mês vigente em destaque
- Botão de ação rápida: **Novo Pedido**
- Botão de ação rápida: **Nova Transação**
- Card: Somatório de vendas realizadas no dia
- Lista: Pedidos em aberto (status_entrega ≠ "entregue"), ordenados por data_entrega
- Alertas de estoque: produtos com prazo < 30 dias OU quantidade < alerta_minimo
- Card: Número de novos clientes no mês vigente
- Feed: Atividades recentes (activity_log)
- Barra de progresso: % da meta de faturamento mensal

### PAINEL 2 — CONTABILIDADE

- Cards: Receita Total, Despesa Total, Lucro Líquido do mês
- Lista: Top produtos com maiores margens de lucro (via fichas)
- Tabela: Últimas transações financeiras
- **Sub-painéis:**
  - **2a — Fluxo de Caixa:** Extrato completo filtrável, gráficos de despesas/receitas por categoria
  - **2b — Plano de Contas:** Lista de contas com saldo atual
  - **2c — Balanço Patrimonial:** Ativos e Passivos, inventário de bens
  - **2d — Pagamento a Colaboradores:** Lista de colaboradores, produções com repasses pendentes

### PAINEL 3 — ESTOQUE

- Botão: Nova movimentação de estoque
- Painel resumo: produtos com quantidades e barras visuais
- Lista de produtos (filtrável por categoria)
- Lista de insumos com alertas de validade
- Ficha técnica (modal): modo de preparo, peso cru/pronto, ingredientes, etapas, custo

### PAINEL 4 — PRODUÇÃO

- Pedidos acumulados do dia (pendentes de produção)
- Botão: Novo lançamento de produção
- Acumulado mensal
- Valor de perdas e custos do período

### PAINEL 5 — CLIENTES

- Botão: Adicionar novo cliente
- Navegação para Grupos de Clientes (kanban drag-and-drop)
- Perfil analítico: gráficos de localidades, distribuição por grupo, ticket médio
- Cards: total cadastrados, clientes fixos
- Ranking de maiores compradores
- Lista de localidades com rotas e valores de entrega

### PAINEL 6 — MENSAGENS / ATENDIMENTO

- Inbox unificado: WhatsApp e Instagram
- Filtro por canal, status (lida/não lida), cliente
- Visualização de conversa por cliente
- Link rápido para pedido relacionado
- Indicador de mensagens não lidas
- **Agente 2 (Atendente Virtual):** Painel de monitoramento + editor de prompt — **PENDENTE na Fase 4**

### PAINEL 7 — PEDIDOS & ENTREGAS

- Botão: Inserir novo pedido
- Lista com status visual (badges por status_producao e status_entrega)
- Organização de pedidos em rotas de entrega
- Gerenciamento de fornadas (adicionado — não estava no prompt original)

### PAINEL 8 — ASSISTENTE DE GESTÃO (Agente 1)

- Chat flutuante acessível em qualquer tela + painel dedicado
- Editor de prompt do agente (em Configurações)
- **Agente 1 (IA):** Capacidades de leitura/escrita nos dados — **PENDENTE na Fase 4**

### PAINEL 9 — CONFIGURAÇÕES

- Meta de faturamento mensal
- Dados da empresa (nome, responsável, cargo)
- Capital social
- Gestão de contas (Caixa, PIX, Conta Corrente)
- Edição dos prompts dos agentes 1 e 2
- Gestão de colaboradores

---

## 6. PROTOCOLO DO AGENTE 2 — ATENDENTE VIRTUAL

O prompt base do Agente 2 é editável pelo gestor no painel de Configurações (campo `prompt_agente2` na tabela settings). Conteúdo atual armazenado no banco:

**Regras de atendimento:**
1. Cumprimente pelo nome se o cliente já estiver cadastrado
2. Seja breve — ninguém gosta de textos longos no WhatsApp
3. Apresente o cardápio por categoria quando solicitado
4. Registre pedidos confirmando cada item antes de finalizar
5. Informe data/horário de entrega e valor do frete por localidade
6. Solicite confirmação de pagamento e método (PIX, dinheiro, cartão)
7. Encerre agradecendo e informando o status do pedido

**Protocolo de venda:** A Taboca funciona via delivery, sem ambiente de consumo local. Lema: "Do forno para sua casa". Produtos livres de aditivos químicos. Estoque limitado — cliente deve reservar com antecedência (fermentação longa, produção começa 2 dias antes).

**Dias de produção (fornadas):**
- **Quartas-feiras** (7h30–9h): Pães — encomendas encerram segunda às 21h
- **Sextas-feiras** (17h–21h): Pães + Pizzas — encomendas encerram quinta às 9h

**Abordagem por grupo de cliente:**
- **Potenciais:** Atendimento de alta exclusividade, explicar funcionamento, oferecer entrega grátis na primeira compra ou 10% desconto para 3+ produtos, coletar dados completos (endereço, link localização, foto fachada)
- **Novos:** Conversa mais direta, sugerir preferências do cadastro, confirmar endereço
- **Esporádicos:** Similar aos novos, confirmar endereço
- **Fixos:** Conversa ultra-direta, sugerir preferências, confirmar endereço
- **Colaborador:** Provavelmente busca informações, não compra

**Regras de venda:**
- Posicionar produtos como artesanais, fermentação natural e longa
- Feitos com tempo, técnica e ingredientes de qualidade
- Mais fáceis de digerir, mais saborosos e mais nutritivos

---

## 7. PROTOCOLO DO AGENTE 1 — ASSISTENTE DE GESTÃO

Prompt base editável em Configurações (campo `prompt_agente1`). Conteúdo atual:

> Você é o assistente de gestão pessoal de Tiba, proprietário da Taboca Pão e Pizza. Seu papel é ajudá-lo a gerenciar o negócio com agilidade e precisão. Você tem acesso aos dados do sistema e pode ler, inserir e editar registros. Responda de forma direta e objetiva com linguagem informal amigável. Ao apresentar relatórios, use formato estruturado com números em destaque. Lembre das preferências de Tiba para antecipar suas necessidades.

**Capacidades planejadas:**
- Adicionar/editar registros em qualquer tabela por comando de texto
- Apresentar relatórios e resumos dos dados
- Criar campanhas de venda (montar grupos, escrever mensagem, agendar envio)
- Enviar mensagens em massa para grupos de clientes
- Gerar sugestões proativas (ex: "Estoque de farinha está baixo, deseja registrar compra?")
- Memória de interações e preferências de Tiba

---

## 8. HISTÓRICO DE FASES

### Fase 1 — Fundação ✅
- Estrutura do projeto React + Vite
- Layout responsivo (menu lateral desktop, bottom-nav mobile)
- Tema visual completo
- Schemas de dados + dados de exemplo (mkData)
- Dashboard principal

### Fase 2 — Core Operacional ✅
- Painel de Pedidos & Entregas
- Painel de Clientes (com grupos kanban drag-and-drop)
- Painel de Estoque (produtos, insumos, fichas técnicas)
- Painel de Contabilidade (todos os sub-painéis)
- Painel de Produção
- Painel de Mensagens (UI)
- Painel do Assistente (UI)
- Configurações
- Tela de Login

### Fase 3 — Migração para Supabase ✅
- Projeto Supabase criado e configurado
- 16 tabelas criadas com schema completo
- Dados seed inseridos
- Autenticação Supabase Auth implementada
- Todas as 26+ operações CRUD migradas para Supabase
- Padrão optimistic updates implementado
- Fallback mkData() mantido
- Variáveis de ambiente configuradas no Vercel
- Deploy em produção

### Fase 4 — Comunicação e IA 🔜
- [ ] Agente 1 — Assistente de Gestão (Claude API)
- [ ] Agente 2 — Atendente Virtual (Claude API)
- [ ] Integração WhatsApp Business API
- [ ] Integração Instagram Graph API

---

## 9. ARQUIVOS DO PROJETO

```
taboca-gestao/
├── index.html
├── package.json          # deps: react, react-dom, recharts, lucide-react, @supabase/supabase-js
├── vite.config.js
├── .env                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .gitignore
├── public/
│   └── (assets)
├── src/
│   └── App.jsx           # ~3900 linhas — TODO o sistema em arquivo único
├── supabase_schema.sql   # Schema das 16 tabelas + índices + RLS
└── supabase_seed.sql     # Dados iniciais de todas as tabelas
```

---

## 10. VARIÁVEIS DE AMBIENTE

| Variável | Onde configurar | Descrição |
|----------|----------------|-----------|
| `VITE_SUPABASE_URL` | `.env` local + Vercel | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` local + Vercel | Chave anon do Supabase |

Para a Fase 4, serão necessárias novas variáveis:
- `VITE_ANTHROPIC_API_KEY` (ou proxy backend)
- Credenciais WhatsApp Business API
- Credenciais Instagram Graph API

---

## 11. OBSERVAÇÕES FINAIS

- O nome do sistema é **Taboca Gestão**
- O usuário principal é **Tiba** — todas as interfaces em **português brasileiro**
- Priorize clareza e velocidade — Tiba usa o sistema no dia a dia, muitas vezes no celular
- O sistema atualmente é um **único arquivo** (`App.jsx`) — na Fase 4, considerar modularização se a complexidade exigir
- Os prompts dos agentes são editáveis via Configurações sem necessidade de código
- A aplicação funciona mesmo sem Supabase (fallback para dados mock)

---

*Prompt elaborado para Tiberio — Taboca Pão e Pizza*
*Sistema: Taboca Gestão v2.0*
