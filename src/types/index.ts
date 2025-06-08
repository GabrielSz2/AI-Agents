export interface User {
  id?: number;
  user: string; // email
  password: string;
  created_at?: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  avatar?: string;
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface ChatState {
  selectedAgent: Agent | null;
  messages: Message[];
  isTyping: boolean;
  agents: Agent[];
}