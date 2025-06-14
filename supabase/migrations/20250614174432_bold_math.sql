/*
  # Adicionar suporte para OpenAI Assistants API v2

  1. New Tables
    - `user_threads` - Threads de usuários com agentes
    - `system_config` - Configurações do sistema

  2. Modified Tables
    - `agentes` - Adicionar campos para OpenAI Assistants
    - `mensagens` - Adicionar campos para threads

  3. Security
    - Manter RLS habilitado
    - Adicionar políticas apropriadas
*/

-- Adicionar campos à tabela agentes para OpenAI Assistants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'assistant_id'
  ) THEN
    ALTER TABLE agentes ADD COLUMN assistant_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'thread_expiry_hours'
  ) THEN
    ALTER TABLE agentes ADD COLUMN thread_expiry_hours INTEGER DEFAULT 24;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE agentes ADD COLUMN custom_fields JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Adicionar campos à tabela mensagens para threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mensagens' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE mensagens ADD COLUMN thread_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mensagens' AND column_name = 'openai_message_id'
  ) THEN
    ALTER TABLE mensagens ADD COLUMN openai_message_id TEXT;
  END IF;
END $$;

-- Criar tabela de threads de usuários
CREATE TABLE IF NOT EXISTS user_threads (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  agent_id INTEGER NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  custom_data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_email, agent_id, thread_id)
);

-- Habilitar RLS na tabela user_threads
ALTER TABLE user_threads ENABLE ROW LEVEL SECURITY;

-- Políticas para user_threads
CREATE POLICY "Users can manage own threads"
  ON user_threads
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS na tabela system_config
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Políticas para system_config (apenas admin pode acessar)
CREATE POLICY "Admins can manage system config"
  ON system_config
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Inserir configurações padrão do sistema
INSERT INTO system_config (key, value, description, is_sensitive) 
VALUES 
  ('openai_api_key', '', 'Chave da API OpenAI', true),
  ('default_thread_expiry_hours', '24', 'Tempo padrão de expiração de threads (horas)', false),
  ('default_model', 'gpt-4o-mini', 'Modelo padrão para novos agentes', false),
  ('max_tokens_limit', '4000', 'Limite máximo de tokens por resposta', false)
ON CONFLICT (key) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_threads_user_agent ON user_threads(user_email, agent_id);
CREATE INDEX IF NOT EXISTS idx_user_threads_expires ON user_threads(expires_at);
CREATE INDEX IF NOT EXISTS idx_mensagens_thread ON mensagens(thread_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);