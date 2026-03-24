-- Migration: Adicionar campo bot_ativo na tabela clientes
-- Permite desativar o agente de atendimento por cliente individual
-- Default: true (novos contatos são atendidos automaticamente pelo bot)

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bot_ativo BOOLEAN DEFAULT true;

-- Atualizar clientes existentes para ter bot ativo por padrão
UPDATE clientes SET bot_ativo = true WHERE bot_ativo IS NULL;
