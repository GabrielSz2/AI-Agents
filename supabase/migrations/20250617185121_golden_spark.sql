/*
  # Migração de Segurança - Hash de Senhas

  1. Security Updates
    - Adicionar função para hash de senhas
    - Migrar senhas existentes para formato hash
    - Adicionar trigger para hash automático

  2. Changes
    - Função bcrypt para PostgreSQL
    - Trigger para hash de senhas em INSERT/UPDATE
    - Migração de dados existentes
*/

-- Instalar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para gerar hash bcrypt
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Função para verificar senha
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- Trigger para hash automático de senhas
CREATE OR REPLACE FUNCTION hash_user_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Só faz hash se a senha não começar com $2b$ (já é hash bcrypt)
  IF NEW.password IS NOT NULL AND NOT (NEW.password LIKE '$2b$%') THEN
    NEW.password := hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para novos usuários e atualizações
DROP TRIGGER IF EXISTS trigger_hash_password ON users;
CREATE TRIGGER trigger_hash_password
  BEFORE INSERT OR UPDATE OF password ON users
  FOR EACH ROW
  EXECUTE FUNCTION hash_user_password();

-- Migrar senhas existentes para hash (apenas se não forem hash)
UPDATE users 
SET password = hash_password(password)
WHERE password IS NOT NULL 
  AND NOT (password LIKE '$2b$%')
  AND LENGTH(password) < 60; -- Senhas hash bcrypt têm 60 caracteres

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE password IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_access_keys_unused ON access_keys(key_value) WHERE NOT is_used;
CREATE INDEX IF NOT EXISTS idx_user_threads_active ON user_threads(user_email, agent_id) WHERE is_active = true;

-- Função para limpeza de threads expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_threads()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE user_threads 
  SET is_active = false 
  WHERE is_active = true 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Função para validação de email
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraint para validação de email
ALTER TABLE users 
ADD CONSTRAINT valid_email_format 
CHECK (is_valid_email(email));

-- Adicionar constraint para senhas não vazias
ALTER TABLE users 
ADD CONSTRAINT password_not_empty 
CHECK (LENGTH(TRIM(password)) > 0);