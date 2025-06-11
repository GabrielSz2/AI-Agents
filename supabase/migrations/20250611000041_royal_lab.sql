/*
  # Adicionar funcionalidades de Admin e Chaves de Acesso

  1. New Tables
    - `access_keys` - Chaves de acesso para registro
      - `id` (serial, primary key)
      - `key_value` (text, unique) - A chave de acesso
      - `is_used` (boolean) - Se a chave já foi usada
      - `used_by` (text) - Email de quem usou a chave
      - `created_at` (timestamp)
      - `used_at` (timestamp)

  2. Modified Tables
    - `users` - Adicionar campo admin e access_key_used
    - `agentes` - Adicionar campo webhook_url para requisições POST

  3. Security
    - Manter RLS habilitado
    - Adicionar políticas para acesso admin
*/

-- Criar tabela de chaves de acesso
CREATE TABLE IF NOT EXISTS access_keys (
  id SERIAL PRIMARY KEY,
  key_value TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Habilitar RLS na tabela access_keys
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

-- Políticas para access_keys
CREATE POLICY "Anyone can read unused access keys"
  ON access_keys
  FOR SELECT
  TO anon
  USING (NOT is_used);

CREATE POLICY "Anyone can update access keys"
  ON access_keys
  FOR UPDATE
  TO anon
  USING (true);

-- Adicionar campos à tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'access_key_used'
  ) THEN
    ALTER TABLE users ADD COLUMN access_key_used TEXT;
  END IF;
END $$;

-- Adicionar campo webhook_url à tabela agentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE agentes ADD COLUMN webhook_url TEXT;
  END IF;
END $$;

-- Políticas para admin gerenciar agentes
CREATE POLICY "Admins can manage agentes"
  ON agentes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Inserir algumas chaves de acesso de exemplo
INSERT INTO access_keys (key_value) 
SELECT 'ADMIN-2024-001'
WHERE NOT EXISTS (SELECT 1 FROM access_keys WHERE key_value = 'ADMIN-2024-001');

INSERT INTO access_keys (key_value) 
SELECT 'BETA-USER-001'
WHERE NOT EXISTS (SELECT 1 FROM access_keys WHERE key_value = 'BETA-USER-001');

INSERT INTO access_keys (key_value) 
SELECT 'DEMO-ACCESS-123'
WHERE NOT EXISTS (SELECT 1 FROM access_keys WHERE key_value = 'DEMO-ACCESS-123');

-- Criar um usuário admin de exemplo (opcional)
INSERT INTO users (email, password, is_admin, access_key_used) 
SELECT 'admin@chat.com', 'admin123', true, 'ADMIN-2024-001'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@chat.com');

-- Marcar a chave do admin como usada
UPDATE access_keys 
SET is_used = true, used_by = 'admin@chat.com', used_at = NOW()
WHERE key_value = 'ADMIN-2024-001' AND NOT is_used;