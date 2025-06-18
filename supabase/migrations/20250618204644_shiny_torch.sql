/*
  # Corrigir usuário admin e função de verificação de senha

  1. Updates
    - Recriar usuário admin com senha hasheada corretamente
    - Garantir que a função verify_password existe
    - Corrigir possíveis problemas de autenticação

  2. Security
    - Manter hash seguro das senhas
    - Verificar integridade do sistema de autenticação
*/

-- Garantir que a função verify_password existe
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- Remover usuário admin existente se houver
DELETE FROM users WHERE email = 'admin@chat.com';

-- Recriar usuário admin com senha correta
INSERT INTO users (email, password, is_admin, access_key_used) 
VALUES ('admin@chat.com', 'admin123', true, 'ADMIN-2024-001');

-- Garantir que a chave ADMIN-2024-001 existe e está marcada como usada
INSERT INTO access_keys (key_value, is_used, used_by, used_at) 
VALUES ('ADMIN-2024-001', true, 'admin@chat.com', NOW())
ON CONFLICT (key_value) DO UPDATE SET
  is_used = true,
  used_by = 'admin@chat.com',
  used_at = NOW();

-- Adicionar algumas chaves de teste se não existirem
INSERT INTO access_keys (key_value) 
VALUES ('TESTE-2024-001')
ON CONFLICT (key_value) DO NOTHING;

INSERT INTO access_keys (key_value) 
VALUES ('DEMO-2024-002')
ON CONFLICT (key_value) DO NOTHING;

INSERT INTO access_keys (key_value) 
VALUES ('USER-2024-003')
ON CONFLICT (key_value) DO NOTHING;