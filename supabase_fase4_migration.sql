-- ═══════════════════════════════════════════════════
-- FASE 4 — Migration: Novas tabelas para IA e Canais
-- Executar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Configuração WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider TEXT DEFAULT 'official', -- 'official' | 'evolution' | 'baileys'
  api_url TEXT DEFAULT 'https://graph.facebook.com/v18.0',
  api_token TEXT,
  phone_number TEXT,
  phone_number_id TEXT,
  webhook_secret TEXT,
  auto_reply BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro padrão
INSERT INTO whatsapp_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_auth_whatsapp_config" ON whatsapp_config FOR ALL USING (true) WITH CHECK (true);

-- 2. Configuração Instagram
CREATE TABLE IF NOT EXISTS instagram_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  page_id TEXT,
  access_token TEXT,
  ig_user_id TEXT,
  webhook_verify_token TEXT,
  auto_reply BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO instagram_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE instagram_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_auth_instagram_config" ON instagram_config FOR ALL USING (true) WITH CHECK (true);

-- 3. Campanhas de Venda
CREATE TABLE IF NOT EXISTS campanhas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  grupo_ids JSONB NOT NULL DEFAULT '[]',
  mensagem TEXT NOT NULL DEFAULT '',
  canal TEXT DEFAULT 'whatsapp', -- 'whatsapp' | 'instagram' | 'ambos'
  status TEXT DEFAULT 'rascunho', -- 'rascunho' | 'agendada' | 'enviada' | 'cancelada'
  data_envio TIMESTAMPTZ,
  total_enviados INT DEFAULT 0,
  total_clientes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_auth_campanhas" ON campanhas FOR ALL USING (true) WITH CHECK (true);

-- 4. Índices adicionais
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_canal ON mensagens(canal);
CREATE INDEX IF NOT EXISTS idx_mensagens_de_cliente ON mensagens(de_cliente);

-- 5. Adicionar campo 'origem' em mensagens para rastrear se foi IA ou manual
DO $$ BEGIN
  ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';
  -- origem: 'manual' | 'ia_automatico' | 'ia_assistido' | 'campanha'
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6. Adicionar campo 'whatsapp_msg_id' para controle de deduplicação
DO $$ BEGIN
  ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS external_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
