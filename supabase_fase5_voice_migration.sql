-- ============================================================
-- FASE 5 — MIGRATION: Suporte a Voz (STT + TTS)
-- Sistema Taboca Gestão
-- Executar no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar coluna 'tipo' na tabela mensagens
-- Rastreia o tipo da mensagem original (text, audio, image, video, sticker)
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'text';

COMMENT ON COLUMN mensagens.tipo IS 'Tipo da mensagem original: text, audio, image, video, sticker';

-- 2. Adicionar coluna 'preferencia_audio' na tabela clientes
-- Indica se o cliente prefere receber respostas em áudio
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS preferencia_audio BOOLEAN DEFAULT false;

COMMENT ON COLUMN clientes.preferencia_audio IS 'Se true, respostas serão enviadas em áudio quando possível';

-- 3. Adicionar coluna 'transcricao' na tabela mensagens
-- Guarda a transcrição original de mensagens de áudio
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS transcricao TEXT;

COMMENT ON COLUMN mensagens.transcricao IS 'Transcrição de mensagens de áudio (via Groq Whisper)';

-- 4. Criar bucket no Supabase Storage para áudios gerados (TTS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-responses',
  'audio-responses',
  true,
  5242880,  -- 5MB max
  ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies para o bucket audio-responses
-- Service role pode inserir e deletar (Edge Functions)
DO $$
BEGIN
  -- Policy de leitura pública (para WhatsApp API buscar o áudio)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'audio_public_read' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "audio_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-responses');
  END IF;

  -- Policy de inserção para authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'audio_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "audio_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio-responses');
  END IF;

  -- Policy de deleção para cleanup
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'audio_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "audio_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio-responses');
  END IF;
END $$;

-- 6. Índice para buscar mensagens por tipo
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo);

-- ============================================================
-- FIM DA MIGRATION FASE 5
-- Próximo passo: Configurar Supabase Secrets:
--   GROQ_API_KEY = gsk_...
--   ELEVENLABS_API_KEY = xi_...
-- ============================================================
