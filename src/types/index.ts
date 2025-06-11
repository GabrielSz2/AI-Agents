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
  avatar?: string;
  webhook_url?: string;
  created_at?: string;
}

export interface Message {
  id?: number;
  user_email: string;
  agent_id: number;
  content: string;
  is_from_user: boolean;
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
}