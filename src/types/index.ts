export interface User {
  id?: number;
  email: string;
  password: string;
  is_admin?: boolean;
  access_key_used?: string;
  created_at?: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  instructions?: string;
  avatar?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  webhook_url?: string;
  assistant_id?: string; // OpenAI Assistant ID
  thread_expiry_hours?: number; // Tempo de expiração da thread
  custom_fields?: CustomField[]; // Campos customizados
  created_at?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // Para campos select
  placeholder?: string;
}

export interface UserThread {
  id?: number;
  user_email: string;
  agent_id: number;
  thread_id: string; // OpenAI Thread ID
  created_at: string;
  expires_at: string;
  is_active: boolean;
  custom_data?: Record<string, any>; // Dados dos campos customizados
}

export interface Message {
  id?: number;
  user_email: string;
  agent_id: number;
  thread_id?: string;
  content: string;
  is_from_user: boolean;
  openai_message_id?: string;
  timestamp?: string;
  created_at?: string;
}

export interface AccessKey {
  id?: number;
  key_value: string;
  is_used: boolean;
  used_by?: string;
  created_at?: string;
  used_at?: string;
}

export interface SystemConfig {
  id?: number;
  key: string;
  value: string;
  description?: string;
  is_sensitive: boolean; // Para campos como API keys
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, accessKey: string) => Promise<boolean>;
  logout: () => void;
}

export interface ChatState {
  selectedAgent: Agent | null;
  messages: Message[];
  isTyping: boolean;
  agents: Agent[];
  currentThread: UserThread | null;
}

export interface OpenAIModels {
  'gpt-4o': {
    name: 'GPT-4o';
    description: 'Mais recente e avançado';
    release_date: '2024-05-13';
    context_window: 128000;
  };
  'gpt-4o-mini': {
    name: 'GPT-4o Mini';
    description: 'Versão otimizada e econômica';
    release_date: '2024-07-18';
    context_window: 128000;
  };
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo';
    description: 'Rápido e eficiente';
    release_date: '2024-04-09';
    context_window: 128000;
  };
  'gpt-4': {
    name: 'GPT-4';
    description: 'Modelo base GPT-4';
    release_date: '2023-03-14';
    context_window: 8192;
  };
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo';
    description: 'Rápido e econômico';
    release_date: '2023-03-01';
    context_window: 16385;
  };
}