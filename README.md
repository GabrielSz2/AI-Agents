# Plataforma de Chat - Frontend

Uma plataforma de chat moderna e elegante construída com React, TypeScript e Tailwind CSS, com integração ao Supabase.

## ✨ Características

- **Autenticação Customizada**: Sistema de login e cadastro sem uso do Supabase Auth
- **Design Minimalista**: Interface limpa com tema escuro e acentos roxos
- **Chat em Tempo Real**: Conversas fluidas com indicadores de digitação
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Agentes Dinâmicos**: Carregamento automático de agentes do banco de dados
- **Microanimações**: Transições suaves e feedback visual

## 🛠️ Tecnologias

- React 18 com TypeScript
- Tailwind CSS para estilização
- Supabase para backend
- Lucide React para ícones
- Vite como bundler

## 📋 Estrutura do Banco de Dados Supabase

### Tabela `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user TEXT UNIQUE NOT NULL, -- email do usuário
  password TEXT NOT NULL, -- senha em texto puro
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela `agentes`
```sql
CREATE TABLE agentes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar TEXT, -- URL da imagem (opcional)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dados de exemplo
INSERT INTO agentes (name, description) VALUES
('Ana Assistente', 'Especialista em atendimento geral'),
('Carlos Técnico', 'Suporte técnico especializado'),
('Sofia Vendas', 'Consultora de vendas e produtos');
```

### Tabela `mensagens`
```sql
CREATE TABLE mensagens (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  agent_id INTEGER REFERENCES agentes(id),
  content TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  timestamp TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Configuração

1. **Clone o repositório**
2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute os scripts SQL acima para criar as tabelas
   - Copie o arquivo `.env.example` para `.env`
   - Adicione suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Execute o projeto**:
   ```bash
   npm run dev
   ```

## 🏗️ Arquitetura

### Componentes Principais

- **AuthProvider**: Contexto para gerenciamento de autenticação
- **LoginForm/RegisterForm**: Formulários de autenticação
- **ChatInterface**: Interface principal do chat
- **Sidebar**: Navegação lateral com lista de agentes
- **MessageBubble**: Componente individual de mensagem
- **TypingIndicator**: Indicador animado de digitação

### Hooks Customizados

- **useAuth**: Hook para gerenciar estado de autenticação

### Serviços

- **supabase.ts**: Configuração e funções de API do Supabase

## 🔐 Segurança

⚠️ **Nota Importante**: Esta implementação armazena senhas em texto puro conforme solicitado para prototipação. Para produção, implemente:

- Hash de senhas (bcrypt, argon2, etc.)
- Validação adequada no backend
- Autenticação JWT ou similar
- Rate limiting
- Sanitização de dados

## 📱 Funcionalidades

### Autenticação
- Cadastro com validação de e-mail único
- Login em duas etapas (e-mail → senha)
- Mensagens de erro amigáveis
- Persistência de sessão no localStorage

### Chat
- Seleção de agentes dinâmica
- Envio de mensagens em tempo real
- Indicador de digitação animado
- Histórico de conversas
- Interface responsiva

### Design
- Tema escuro elegante
- Gradientes roxos sutis
- Animações fluidas
- Feedback visual consistente
- Tipografia hierárquica

## 🔧 Personalização

### Cores
As cores principais estão definidas nas classes Tailwind:
- Primário: `purple-600`
- Secundário: `gray-800`
- Acentos: `purple-400`

### Agentes
Para adicionar novos agentes, simplesmente insira na tabela `agentes` do Supabase. Eles aparecerão automaticamente na interface.

### Respostas dos Agentes
Atualmente as respostas são simuladas. Implemente sua lógica de IA/bot no método `getAgentResponse` em `utils/supabase.ts`.

## 📚 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção
- `npm run lint` - Executa linter

## 🎨 Design System

- **Espaçamento**: Sistema baseado em 8px
- **Tipografia**: Hierarquia clara com pesos variados
- **Cores**: Paleta escura com acentos roxos
- **Componentes**: Modulares e reutilizáveis
- **Animações**: Sutis e funcionais

---

Desenvolvido com ❤️ usando as melhores práticas de React e design moderno.