/*
  # Fix agent deletion cascade constraint

  1. Changes
    - Drop existing foreign key constraint on mensagens table
    - Re-add foreign key constraint with ON DELETE CASCADE
    - This allows agents to be deleted even when they have associated messages
    - When an agent is deleted, all their messages will be automatically deleted too

  2. Security
    - Maintains existing RLS policies
    - No changes to table structure, only constraint behavior
*/

-- Drop the existing foreign key constraint
ALTER TABLE mensagens DROP CONSTRAINT IF EXISTS mensagens_agent_id_fkey;

-- Re-add the foreign key constraint with CASCADE deletion
ALTER TABLE mensagens ADD CONSTRAINT mensagens_agent_id_fkey 
  FOREIGN KEY (agent_id) REFERENCES agentes(id) ON DELETE CASCADE;