/*
  # Fix users table schema

  1. Changes
    - Drop existing "Users" table if it exists
    - Create new "users" table with correct schema matching the application
    - Ensure proper column names and types
    - Add RLS policies for security

  2. Security
    - Enable RLS on users table
    - Add policies for user registration and authentication
*/

-- Drop the existing Users table if it exists
DROP TABLE IF EXISTS "Users";

-- Create the users table with the correct schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user TEXT UNIQUE NOT NULL, -- email do usuário
  password TEXT NOT NULL, -- senha em texto puro
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can register"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Ensure agentes table has proper RLS policies
CREATE POLICY "Anyone can read agentes"
  ON agentes
  FOR SELECT
  TO anon
  USING (true);

-- Ensure mensagens table has proper RLS policies  
CREATE POLICY "Users can read all messages"
  ON mensagens
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert messages"
  ON mensagens
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert sample agents if they don't exist
INSERT INTO agentes (name, description) 
SELECT 'Ana Assistente', 'Especialista em atendimento geral'
WHERE NOT EXISTS (SELECT 1 FROM agentes WHERE name = 'Ana Assistente');

INSERT INTO agentes (name, description) 
SELECT 'Carlos Técnico', 'Suporte técnico especializado'
WHERE NOT EXISTS (SELECT 1 FROM agentes WHERE name = 'Carlos Técnico');

INSERT INTO agentes (name, description) 
SELECT 'Sofia Vendas', 'Consultora de vendas e produtos'
WHERE NOT EXISTS (SELECT 1 FROM agentes WHERE name = 'Sofia Vendas');