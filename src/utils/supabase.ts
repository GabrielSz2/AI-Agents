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
      .eq('email', email)
      .single();
    
    return { user: data, error };
  },

  // Verifica se uma chave de acesso é válida
  async validateAccessKey(keyValue: string) {
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .eq('key_value', keyValue)
      .eq('is_used', false)
      .single();
    
    return { accessKey: data, error };
  },

  // Marca uma chave de acesso como usada
  async markAccessKeyAsUsed(keyValue: string, userEmail: string) {
    const { data, error } = await supabase
      .from('access_keys')
      .update({
        is_used: true,
        used_by: userEmail,
        used_at: new Date().toISOString()
      })
      .eq('key_value', keyValue)
      .select()
      .single();
    
    return { accessKey: data, error };
  },

  // Registra um novo usuário
  async registerUser(email: string, password: string, accessKey: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password, access_key_used: accessKey }])
      .select()
      .single();
    
    return { user: data, error };
  },

  // Faz login do usuário
  async loginUser(email: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
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
  },

  // Cria um novo agente (admin only)
  async createAgent(name: string, description: string, webhookUrl: string, avatar?: string) {
    const { data, error } = await supabase
      .from('agentes')
      .insert([{
        name,
        description,
        webhook_url: webhookUrl,
        avatar
      }])
      .select()
      .single();
    
    return { agent: data, error };
  },

  // Atualiza um agente (admin only)
  async updateAgent(id: number, name: string, description: string, webhookUrl: string, avatar?: string) {
    const { data, error } = await supabase
      .from('agentes')
      .update({
        name,
        description,
        webhook_url: webhookUrl,
        avatar
      })
      .eq('id', id)
      .select()
      .single();
    
    return { agent: data, error };
  },

  // Deleta um agente (admin only)
  async deleteAgent(id: number) {
    const { error } = await supabase
      .from('agentes')
      .delete()
      .eq('id', id);
    
    return { error };
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

  // Busca resposta do agente via webhook
  async getAgentResponse(agentId: number, userMessage: string) {
    try {
      // Busca o agente para obter a URL do webhook
      const { data: agent, error } = await supabase
        .from('agentes')
        .select('webhook_url, name')
        .eq('id', agentId)
        .single();

      if (error || !agent?.webhook_url) {
        // Fallback para resposta simulada se não houver webhook
        await new Promise(resolve => setTimeout(resolve, 2000));
        const responses = [
          "Olá! Como posso ajudá-lo hoje?",
          "Entendi sua pergunta. Deixe-me processar isso...",
          "Interessante! Posso fornecer mais informações sobre isso.",
          "Obrigado por sua mensagem. Estou aqui para ajudar!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }

      // Faz a requisição POST para o webhook do agente
      const response = await fetch(agent.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          agent_id: agentId,
          agent_name: agent.name,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Espera que o webhook retorne um objeto com a propriedade 'message' ou 'response'
      return result.message || result.response || result.text || 'Desculpe, não consegui processar sua mensagem.';

    } catch (error) {
      console.error('Erro ao chamar webhook do agente:', error);
      
      // Fallback para resposta de erro amigável
      return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
    }
  }
};

/**
 * Funções para gerenciar chaves de acesso (admin only)
 */
export const accessKeysAPI = {
  // Busca todas as chaves de acesso
  async getAllAccessKeys() {
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { accessKeys: data || [], error };
  },

  // Cria uma nova chave de acesso
  async createAccessKey(keyValue: string) {
    const { data, error } = await supabase
      .from('access_keys')
      .insert([{ key_value: keyValue }])
      .select()
      .single();
    
    return { accessKey: data, error };
  },

  // Deleta uma chave de acesso
  async deleteAccessKey(id: number) {
    const { error } = await supabase
      .from('access_keys')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};