import { createClient } from '@supabase/supabase-js';

/**
 * Configuração do cliente Supabase
 * Substitua estas variáveis pelas suas credenciais do Supabase
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Funções de autenticação customizada
 */
export const authAPI = {
  // Verifica se um usuário existe pelo email
  async checkUserExists(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email) // changed from 'user' to 'email'
      .single();
    
    return { user: data, error };
  },

  // Registra um novo usuário
  async registerUser(email: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password }]) // changed from 'user' to 'email'
      .select()
      .single();
    
    return { user: data, error };
  },

  // Faz login do usuário
  async loginUser(email: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email) // changed from 'user' to 'email'
      .eq('password', password)
      .single();
    
    return { user: data, error };
  }
};

/**
 * Funções para gerenciar agentes
 */
export const agentsAPI = {
  // Busca todos os agentes disponíveis
  async getAllAgents() {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .order('created_at', { ascending: true });
    
    return { agents: data || [], error };
  }
};

/**
 * Funções para gerenciar mensagens
 */
export const messagesAPI = {
  // Busca mensagens de uma conversa específica
  async getMessages(userEmail: string, agentId: number) {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('user_email', userEmail)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });
    
    return { messages: data || [], error };
  },

  // Envia uma nova mensagem
  async sendMessage(userEmail: string, agentId: number, content: string, isFromUser: boolean) {
    const { data, error } = await supabase
      .from('mensagens')
      .insert([{
        user_email: userEmail,
        agent_id: agentId,
        content,
        is_from_user: isFromUser,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { message: data, error };
  },

  // Simula busca por resposta do agente (substituir por lógica real)
  async getAgentResponse(agentId: number) {
    // Simula delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui você pode implementar a lógica para buscar a resposta
    // Por enquanto, vamos retornar uma resposta simulada
    const responses = [
      "Olá! Como posso ajudá-lo hoje?",
      "Entendi sua pergunta. Deixe-me processar isso...",
      "Interessante! Posso fornecer mais informações sobre isso.",
      "Obrigado por sua mensagem. Estou aqui para ajudar!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
};