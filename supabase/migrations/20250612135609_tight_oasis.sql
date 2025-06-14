/*
  # Adicionar campos de IA para agentes

  1. New Columns
    - `instructions` (text) - Prompt do sistema para o agente
    - `model` (text) - Modelo do ChatGPT a ser usado
    - `temperature` (decimal) - Criatividade do modelo
    - `max_tokens` (integer) - Máximo de tokens na resposta

  2. Updates
    - Remover campo webhook_url (não mais necessário)
    - Atualizar agentes existentes com valores padrão
*/

-- Adicionar novos campos para configuração de IA
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'instructions'
  ) THEN
    ALTER TABLE agentes ADD COLUMN instructions TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'model'
  ) THEN
    ALTER TABLE agentes ADD COLUMN model TEXT DEFAULT 'gpt-4o-mini';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'temperature'
  ) THEN
    ALTER TABLE agentes ADD COLUMN temperature DECIMAL(3,2) DEFAULT 0.7;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agentes' AND column_name = 'max_tokens'
  ) THEN
    ALTER TABLE agentes ADD COLUMN max_tokens INTEGER DEFAULT 1000;
  END IF;
END $$;

-- Atualizar agentes existentes com instruções padrão
UPDATE agentes 
SET instructions = CASE 
  WHEN name = 'Ana Assistente' THEN 'Você é Ana, uma assistente virtual especializada em atendimento geral. Seja sempre educada, prestativa e profissional. Ajude os usuários com suas dúvidas de forma clara e objetiva.'
  WHEN name = 'Carlos Técnico' THEN 'Você é Carlos, um especialista em suporte técnico. Forneça soluções práticas e detalhadas para problemas técnicos. Use linguagem clara e ofereça passos específicos para resolver questões.'
  WHEN name = 'Sofia Vendas' THEN 'Você é Sofia, uma consultora de vendas experiente. Seja persuasiva mas não insistente. Foque em entender as necessidades do cliente e apresente soluções que agreguem valor.'
  ELSE CONCAT('Você é ', name, '. ', description, '. Seja sempre útil e profissional em suas respostas.')
END
WHERE instructions IS NULL;

-- Definir valores padrão para campos de configuração
UPDATE agentes 
SET 
  model = 'gpt-4o-mini',
  temperature = 0.7,
  max_tokens = 1000
WHERE model IS NULL OR temperature IS NULL OR max_tokens IS NULL;