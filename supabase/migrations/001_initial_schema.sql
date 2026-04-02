-- ═══════════════════════════════════════════════════
-- TABOCA GESTÃO — Schema Supabase (Fase 3)
-- Executar no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════

-- Ativar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────
-- 1. settings (singleton)
-- ───────────────────────────────────────────────────
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  meta_faturamento DECIMAL(10,2) DEFAULT 3000,
  nome_empresa TEXT DEFAULT 'Taboca Pão e Pizza',
  responsavel TEXT DEFAULT 'Tiberio Gadelha',
  cargo TEXT DEFAULT 'DIRETOR DE OPERAÇÕES',
  prompt_agente1 TEXT,
  prompt_agente2 TEXT,
  contas JSONB DEFAULT '[]',
  capital_social DECIMAL(10,2) DEFAULT 50000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 2. colaboradores
-- ───────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────
-- 3. produtos
-- ───────────────────────────────────────────────────
CREATE TABLE produtos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 0,
  valor_unitario DECIMAL(10,2) NOT NULL,
  prazo_validade DATE,
  alerta_minimo DECIMAL(10,2) DEFAULT 0,
  emoji TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 4. insumos
-- ───────────────────────────────────────────────────
CREATE TABLE insumos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade DECIMAL(10,3) DEFAULT 0,
  unidade TEXT NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  prazo_validade DATE,
  alerta_minimo DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 5. fichas (fichas técnicas)
-- ───────────────────────────────────────────────────
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
  ingredientes JSONB DEFAULT '[]',
  etapas JSONB DEFAULT '[]',
  tempo_preparo TEXT,
  rendimento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 6. transactions
-- ───────────────────────────────────────────────────
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  conta TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(10,2) NOT NULL,
  insumo_reposto JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 7. producoes
-- ───────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────
-- 8. bens
-- ───────────────────────────────────────────────────
CREATE TABLE bens (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_aquisicao DATE,
  categoria TEXT,
  depreciado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 9. localidades
-- ───────────────────────────────────────────────────
CREATE TABLE localidades (
  id BIGSERIAL PRIMARY KEY,
  nome_localidade TEXT NOT NULL,
  rota_descricao TEXT,
  valor_entrega DECIMAL(10,2) DEFAULT 0,
  link_rota_maps TEXT,
  tempo_estimado TEXT
);

-- ───────────────────────────────────────────────────
-- 10. grupos
-- ───────────────────────────────────────────────────
CREATE TABLE grupos (
  id BIGSERIAL PRIMARY KEY,
  nome_grupo TEXT NOT NULL,
  descricao TEXT,
  cor TEXT,
  lista_cliente_ids JSONB DEFAULT '[]'
);

-- ───────────────────────────────────────────────────
-- 11. clientes
-- ───────────────────────────────────────────────────
CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT,
  instagram TEXT,
  endereco_completo TEXT,
  localidade_id BIGINT REFERENCES localidades(id),
  link_googlemaps TEXT,
  foto_fachada_url TEXT,
  preferencias TEXT,
  grupo_id BIGINT REFERENCES grupos(id),
  data_cadastro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 12. pedidos
-- ───────────────────────────────────────────────────
CREATE TABLE pedidos (
  id BIGSERIAL PRIMARY KEY,
  data_pedido TIMESTAMPTZ DEFAULT NOW(),
  data_entrega TIMESTAMPTZ,
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

-- ───────────────────────────────────────────────────
-- 13. mensagens
-- ───────────────────────────────────────────────────
CREATE TABLE mensagens (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id),
  canal TEXT NOT NULL,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  conteudo TEXT NOT NULL,
  status TEXT DEFAULT 'nao_lida',
  pedido_id BIGINT REFERENCES pedidos(id),
  de_cliente BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 14. rotas
-- ───────────────────────────────────────────────────
CREATE TABLE rotas (
  id BIGSERIAL PRIMARY KEY,
  nome_rota TEXT NOT NULL,
  data DATE,
  lista_pedido_ids JSONB DEFAULT '[]',
  status_rota TEXT DEFAULT 'planejado',
  entregador TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 15. fornadas
-- ───────────────────────────────────────────────────
CREATE TABLE fornadas (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  hora_inicio TEXT,
  hora_fim TEXT,
  tipo TEXT,
  encerramento_encomenda TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────
-- 16. activity_log
-- ───────────────────────────────────────────────────
CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  operador TEXT,
  icon TEXT
);

-- ═══════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════
CREATE INDEX idx_transactions_data ON transactions(data DESC);
CREATE INDEX idx_transactions_tipo ON transactions(tipo);
CREATE INDEX idx_producoes_operador ON producoes(operador);
CREATE INDEX idx_producoes_pago ON producoes(pago_colaborador);
CREATE INDEX idx_pedidos_status ON pedidos(status_producao, status_entrega);
CREATE INDEX idx_clientes_grupo ON clientes(grupo_id);
CREATE INDEX idx_activity_log_data ON activity_log(data DESC);
CREATE INDEX idx_mensagens_cliente ON mensagens(cliente_id);
CREATE INDEX idx_mensagens_status ON mensagens(status);

-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════
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
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Política: authenticated users podem tudo
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'settings','colaboradores','produtos','insumos','fichas',
    'transactions','producoes','bens','localidades','grupos',
    'clientes','pedidos','mensagens','rotas','fornadas','activity_log'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "allow_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;
