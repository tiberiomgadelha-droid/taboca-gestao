# Taboca Gestão — Fase 3: Persistência de Dados com Supabase

## Contexto do Projeto

**Aplicação:** Taboca Gestão — SPA React 18 + Vite 5 para gestão de padaria artesanal e delivery de pizza em Ilhéus, BA.

**Repositório:** github.com/tiberiomgadelha-droid/taboca-gestao (privado)
**Deploy:** Vercel auto-deploy via push na branch `main`
**URL:** https://gestao.tabocapaoepizza.com.br
**Login atual:** Tiberio / 210261

**Arquivo principal:** `src/App.jsx` (~3500 linhas, single-file architecture)

**Stack atual:** React 18, Vite 5, Recharts, Lucide React, CSS-in-JS inline
**Design System:** primary #7B3A10, amber #D4884A, cream #FFF8F0, bg #FAF7F4, navy #1E2A4A, green #059669, red #DC2626

---

## Problema Atual

Todos os dados são armazenados em `useState(mkData)` — uma função que retorna dados mock hardcoded. **Ao recarregar a página ou reiniciar o servidor, todos os dados inseridos pelo usuário são perdidos.** Não há nenhuma camada de persistência implementada.

---

## Objetivo da Fase 3

Migrar a persistência de dados do estado React (volátil) para **Supabase** (PostgreSQL + Auth + Realtime), mantendo a arquitetura single-file e o design system existentes.

---

## Estrutura de Dados Atual (mkData)

Abaixo estão todas as entidades que precisam ser migradas para tabelas Supabase:

### 1. transactions (Movimentações Financeiras)
```js
{
  id: Number,           // timestamp
  descricao: String,
  data: String,         // ISO datetime "2026-03-23T12:00"
  conta: String,        // "PIX", "Caixa", "Cartão"
  categoria: String,    // "Vendas Delivery", "Insumos", "Salários", etc.
  tipo: String,         // "receita" | "despesa"
  valor: Number,
  // Opcional (quando categoria = "Insumos"):
  insumo_reposto: { id, nome, quantidade, unidade }
}
```

### 2. produtos (Produtos Finais)
```js
{
  id: Number,
  nome: String,           // "Bambuguette"
  categoria: String,      // "panificação" | "pizzas" | "bebidas"
  quantidade: Number,     // estoque atual
  valor_unitario: Number,
  prazo_validade: String, // "2026-03-16"
  alerta_minimo: Number,
  emoji: String,          // "🥖"
  descricao: String
}
```

### 3. insumos (Matérias-primas)
```js
{
  id: Number,
  nome: String,            // "Farinha Especial T65"
  categoria: String,       // "farinhas", "condimentos", "embalagens", etc.
  quantidade: Number,      // estoque atual
  unidade: String,         // "kg", "unid", "L"
  valor_unitario: Number,
  prazo_validade: String | null,
  alerta_minimo: Number
}
```

### 4. fichas (Fichas Técnicas de Produção)
```js
{
  id: Number,
  produto_id: Number,          // FK → produtos
  nome_produto: String,        // campo editável (pode diferir do produto)
  categoria_produto: String,   // "panificação" | "pizzas" | "bebidas"
  valor_venda_unitario: Number,
  custo_material: Number,
  custo_mao_obra: Number,
  custo_bruto_producao: Number,
  margem_lucro: Number,        // percentual
  modo_preparo: String,
  peso_cru: Number,
  peso_pronto: Number,
  percentual_perda: Number,
  ingredientes: [{ insumo_id: Number, quantidade: Number }],  // JSON array
  etapas: [{ nome: String, tempo: String, colaborador: String }]  // JSON array
}
```

### 5. producoes (Registros de Produção)
```js
{
  id: Number,
  data: String,              // "2026-03-12"
  produto_id: Number,        // FK → produtos
  quantidade: Number,
  operador: String,          // nome do colaborador (deve bater com colaboradores.nome)
  observacao: String,
  etapas_producao: [{etapa_nome, colaborador}],  // JSON array
  pago_colaborador: Boolean  // false = valor pendente para acumular
}
```

### 6. colaboradores
```js
{
  id: Number,
  nome: String,            // "Tiberio Gadelha"
  funcao: String,          // "Produtor / Gestor"
  email: String,
  whatsapp: String,
  foto: String,            // URL
  valor_por_fornada: Number | null,
  ativo: Boolean
}
```

### 7. bens (Ativos / Patrimônio)
```js
{
  id: Number,
  nome: String,
  valor: Number,
  data_aquisicao: String,
  categoria: String,       // "Equipamentos", "Utensílios"
  depreciado: Boolean
}
```

### 8. clientes
```js
{
  id: Number,
  nome: String,
  whatsapp: String,
  instagram: String,
  endereco_completo: String,
  localidade_id: Number,      // FK → localidades
  link_googlemaps: String,
  preferencias: String,
  grupo_id: Number,           // FK → grupos
  data_cadastro: String
}
```

### 9. pedidos
```js
{
  id: Number,
  data_pedido: String,
  cliente_id: Number,          // FK → clientes
  localidade_id: Number,       // FK → localidades
  itens: [{ produto_id, quantidade, valor }],  // JSON array
  valor_total: Number,
  status_producao: String,     // "pendente" | "pronto"
  status_entrega: String,      // "aguardando" | "aguardando_entrega" | "entregue"
  observacoes: String,
  pagamento_confirmado: Boolean
}
```

### 10. localidades
```js
{
  id: Number,
  nome_localidade: String,     // "Pontal"
  valor_entrega: Number,       // 8.00
  tempo_estimado: String       // "25-35min"
}
```

### 11. grupos (Grupos de Clientes)
```js
{
  id: Number,
  nome_grupo: String,          // "Frequentes"
  descricao: String,
  lista_cliente_ids: [Number]  // array de IDs (desnormalizar para junction table)
}
```

### 12. settings (Configurações)
```js
{
  meta_faturamento: Number,
  nome_empresa: String,
  responsavel: String,
  cargo: String,
  prompt_agente1: String,      // prompt do assistente de gestão
  prompt_agente2: String,      // prompt do atendente virtual
  contas: [{ id, nome, saldo_inicial }]  // JSON array
}
```

### 13. activityLog (Log de Atividades)
```js
{
  id: Number,
  tipo: String,       // "transacao", "producao", "pedido", "cliente", "colaborador"
  descricao: String,
  data: String,       // ISO datetime
  operador: String,
  icon: String
}
```

---

## Tarefas da Fase 3

### Tarefa 1 — Configurar Supabase

1. Criar projeto no Supabase (região São Paulo `sa-east-1`)
2. Criar todas as tabelas acima com tipagem correta (usar `jsonb` para arrays de objetos como `ingredientes`, `etapas`, `itens`)
3. Configurar Row Level Security (RLS) — inicialmente liberar para authenticated users
4. Criar políticas de acesso básicas
5. Gerar seed SQL com os dados mock atuais do `mkData()`

### Tarefa 2 — Autenticação

1. Configurar Supabase Auth com email/password
2. Criar usuário admin: `tiberiomgadelha@gmail.com` / senha a definir
3. Substituir o login hardcoded atual (`Tiberio` / `210261`) por autenticação real
4. Manter a mesma tela de login com o logo Taboca
5. Implementar sessão persistente (refresh token)
6. Adicionar botão de logout funcional

### Tarefa 3 — Camada de Dados (CRUD)

1. Instalar `@supabase/supabase-js`
2. Criar client Supabase com variáveis de ambiente Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Substituir `useState(mkData)` por:
   - Carregar dados do Supabase no `useEffect` inicial (loading state)
   - Cada operação de escrita (criar, editar, deletar) deve:
     a. Atualizar o Supabase (INSERT/UPDATE/DELETE)
     b. Atualizar o estado React local (otimistic update)
     c. Tratar erros com fallback (reverter estado local se falhar)
4. Funções auxiliares sugeridas:
   ```js
   const supabase = createClient(url, key);
   const fetchAll = async () => { /* carregar todas as tabelas */ };
   const upsertRecord = async (table, record) => { /* inserir ou atualizar */ };
   const deleteRecord = async (table, id) => { /* deletar */ };
   ```

### Tarefa 4 — Migrar Cada Componente

Para cada painel, substituir as chamadas `setData(prev => ...)` por funções que persistem no Supabase:

| Componente | Operações |
|---|---|
| PanelContabilidade | CRUD transactions, lancarPagamento (transaction + update producoes) |
| ModalNovaTransacao | INSERT transaction + UPDATE insumo (quando categoria = Insumos) |
| PanelEstoque | CRUD insumos, CRUD fichas |
| PanelProducao | INSERT producao + UPDATE produtos + UPDATE insumos |
| PanelClientes | CRUD clientes |
| ModalNovoCliente | INSERT cliente + UPDATE grupo |
| PanelPedidos | CRUD pedidos + UPDATE produtos (baixa estoque) |
| PanelAssistente | READ all (contexto para IA) |
| Header/Settings | UPDATE settings |

**Atenção especial às operações compostas:**
- `saveNovaProducao`: insere produção + atualiza estoque de produtos + desconta insumos + verifica pedidos pendentes
- `lancarPagamento`: insere transação de despesa + marca produções como pagas
- `ModalNovaTransacao` com insumos: insere transação + atualiza quantidade do insumo
- `ModalNovoPedido`: insere pedido + baixa estoque (se disponível)

### Tarefa 5 — Realtime (Opcional/Futuro)

- Configurar Supabase Realtime para sincronizar entre abas/dispositivos
- Usar `supabase.channel('*').on('postgres_changes', ...)` para ouvir mudanças

### Tarefa 6 — Variáveis de Ambiente e Deploy

1. Criar `.env` local:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxx...
   ```
2. Configurar as mesmas variáveis no Vercel (Settings → Environment Variables)
3. Adicionar `.env` ao `.gitignore`
4. Testar deploy completo

---

## Schema SQL Sugerido

```sql
-- Ativar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurações do sistema (singleton)
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  meta_faturamento DECIMAL(10,2) DEFAULT 3000,
  nome_empresa TEXT DEFAULT 'Taboca Pão e Pizza',
  responsavel TEXT DEFAULT 'Tiberio Gadelha',
  cargo TEXT DEFAULT 'DIRETOR DE OPERAÇÕES',
  prompt_agente1 TEXT,
  prompt_agente2 TEXT,
  contas JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colaboradores
CREATE TABLE colaboradores (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  foto TEXT,
  valor_por_fornada DECIMAL(10,2),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos finais
CREATE TABLE produtos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,       -- panificação, pizzas, bebidas
  quantidade DECIMAL(10,2) DEFAULT 0,
  valor_unitario DECIMAL(10,2) NOT NULL,
  prazo_validade DATE,
  alerta_minimo DECIMAL(10,2) DEFAULT 0,
  emoji TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insumos (matérias-primas)
CREATE TABLE insumos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade DECIMAL(10,3) DEFAULT 0,
  unidade TEXT NOT NULL,          -- kg, unid, L
  valor_unitario DECIMAL(10,2) NOT NULL,
  prazo_validade DATE,
  alerta_minimo DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fichas técnicas
CREATE TABLE fichas (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
  nome_produto TEXT,
  categoria_produto TEXT,
  valor_venda_unitario DECIMAL(10,2),
  custo_material DECIMAL(10,2),
  custo_mao_obra DECIMAL(10,2),
  custo_bruto_producao DECIMAL(10,2),
  margem_lucro DECIMAL(5,2),
  modo_preparo TEXT,
  peso_cru DECIMAL(10,2),
  peso_pronto DECIMAL(10,2),
  percentual_perda DECIMAL(5,2),
  ingredientes JSONB DEFAULT '[]',   -- [{insumo_id, quantidade}]
  etapas JSONB DEFAULT '[]',          -- [{nome, tempo, colaborador}]
  tempo_preparo TEXT,
  rendimento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações financeiras
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  conta TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(10,2) NOT NULL,
  insumo_reposto JSONB,              -- {id, nome, quantidade, unidade}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produções
CREATE TABLE producoes (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  produto_id BIGINT REFERENCES produtos(id),
  quantidade INT NOT NULL,
  operador TEXT NOT NULL,
  observacao TEXT,
  etapas_producao JSONB DEFAULT '[]',
  pago_colaborador BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bens / Patrimônio
CREATE TABLE bens (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_aquisicao DATE,
  categoria TEXT,
  depreciado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Localidades
CREATE TABLE localidades (
  id BIGSERIAL PRIMARY KEY,
  nome_localidade TEXT NOT NULL,
  valor_entrega DECIMAL(10,2) DEFAULT 0,
  tempo_estimado TEXT
);

-- Grupos de clientes
CREATE TABLE grupos (
  id BIGSERIAL PRIMARY KEY,
  nome_grupo TEXT NOT NULL,
  descricao TEXT
);

-- Clientes
CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT,
  instagram TEXT,
  endereco_completo TEXT,
  localidade_id BIGINT REFERENCES localidades(id),
  link_googlemaps TEXT,
  preferencias TEXT,
  grupo_id BIGINT REFERENCES grupos(id),
  data_cadastro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table para grupos ↔ clientes (substitui lista_cliente_ids)
CREATE TABLE grupo_clientes (
  grupo_id BIGINT REFERENCES grupos(id) ON DELETE CASCADE,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE CASCADE,
  PRIMARY KEY (grupo_id, cliente_id)
);

-- Pedidos
CREATE TABLE pedidos (
  id BIGSERIAL PRIMARY KEY,
  data_pedido TIMESTAMPTZ DEFAULT NOW(),
  cliente_id BIGINT REFERENCES clientes(id),
  localidade_id BIGINT REFERENCES localidades(id),
  itens JSONB NOT NULL DEFAULT '[]',
  valor_total DECIMAL(10,2),
  status_producao TEXT DEFAULT 'pendente',
  status_entrega TEXT DEFAULT 'aguardando',
  observacoes TEXT,
  pagamento_confirmado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de atividades
CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  operador TEXT,
  icon TEXT
);

-- Índices úteis
CREATE INDEX idx_transactions_data ON transactions(data DESC);
CREATE INDEX idx_transactions_tipo ON transactions(tipo);
CREATE INDEX idx_producoes_operador ON producoes(operador);
CREATE INDEX idx_producoes_pago ON producoes(pago_colaborador);
CREATE INDEX idx_pedidos_status ON pedidos(status_producao, status_entrega);
CREATE INDEX idx_clientes_grupo ON clientes(grupo_id);
CREATE INDEX idx_activity_log_data ON activity_log(data DESC);

-- RLS básico (liberar para authenticated)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE producoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE localidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Política: authenticated users podem tudo
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['settings','colaboradores','produtos','insumos','fichas','transactions','producoes','bens','localidades','grupos','clientes','grupo_clientes','pedidos','activity_log']
  LOOP
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
```

---

## Regras Importantes

1. **Manter arquitetura single-file** — todo o código continua em `src/App.jsx`
2. **Não alterar o design system** — cores, fontes, layout permanecem idênticos
3. **Otimistic updates** — atualizar UI imediatamente, reverter se Supabase falhar
4. **Loading states** — mostrar skeleton/spinner enquanto carrega dados iniciais
5. **Tratamento de erros** — toast/alert quando uma operação falhar
6. **Não perder funcionalidades** — todas as integrações existentes (financeiro↔estoque, produção→colaborador, etc.) devem continuar funcionando
7. **Operações compostas devem ser atômicas** — usar `supabase.rpc()` para transações que envolvem múltiplas tabelas quando possível
8. **IDs** — migrar de `Date.now()` para `BIGSERIAL` do Supabase (o banco gera o ID)

---

## Ordem de Execução Sugerida

1. Criar projeto Supabase + rodar schema SQL
2. Inserir dados seed (mock data atual)
3. Instalar `@supabase/supabase-js` no projeto
4. Implementar autenticação (login/logout)
5. Criar camada de fetch (carregar dados no boot)
6. Migrar operações de escrita painel por painel
7. Testar todas as integrações compostas
8. Configurar variáveis no Vercel
9. Deploy e teste final em produção
