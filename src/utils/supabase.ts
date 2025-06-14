import { createClient } from '@supabase/supabase-js';
import { User, Agent, Message, AccessKey, UserThread, SystemConfig, CustomField } from '../types';

/**
 * Configuração do cliente Supabase
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Funções de autenticação customizada
 */
export const authAPI = {
  async checkUserExists(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return { user: data, error };
  },

  async validateAccessKey(keyValue: string) {
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .eq('key_value', keyValue)
      .eq('is_used', false)
      .single();
    
    return { accessKey: data, error };
  },

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

  async registerUser(email: string, password: string, accessKey: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password, access_key_used: accessKey }])
      .select()
      .single();
    
    return { user: data, error };
  },

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
  async getAllAgents() {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .order('created_at', { ascending: true });
    
    return { agents: data || [], error };
  },

  async createAgent(
    name: string, 
    description: string, 
    instructions: string,
    avatar?: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.7,
    maxTokens: number = 1000,
    assistantId?: string,
    threadExpiryHours: number = 24,
    customFields: CustomField[] = []
  ) {
    const { data, error } = await supabase
      .from('agentes')
      .insert([{
        name,
        description,
        instructions,
        avatar,
        model,
        temperature,
        max_tokens: maxTokens,
        assistant_id: assistantId,
        thread_expiry_hours: threadExpiryHours,
        custom_fields: customFields
      }])
      .select()
      .single();
    
    return { agent: data, error };
  },

  async updateAgent(
    id: number, 
    name: string, 
    description: string, 
    instructions: string,
    avatar?: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.7,
    maxTokens: number = 1000,
    assistantId?: string,
    threadExpiryHours: number = 24,
    customFields: CustomField[] = []
  ) {
    const { data, error } = await supabase
      .from('agentes')
      .update({
        name,
        description,
        instructions,
        avatar,
        model,
        temperature,
        max_tokens: maxTokens,
        assistant_id: assistantId,
        thread_expiry_hours: threadExpiryHours,
        custom_fields: customFields
      })
      .eq('id', id)
      .select()
      .single();
    
    return { agent: data, error };
  },

  async deleteAgent(id: number) {
    const { error } = await supabase
      .from('agentes')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

/**
 * Funções para gerenciar threads de usuários
 */
export const threadsAPI = {
  // Busca thread ativa do usuário para um agente
  async getActiveThread(userEmail: string, agentId: number) {
    const { data, error } = await supabase
      .from('user_threads')
      .select('*')
      .eq('user_email', userEmail)
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    return { thread: data, error };
  },

  // Cria nova thread para usuário
  async createUserThread(
    userEmail: string, 
    agentId: number, 
    threadId: string, 
    expiryHours: number = 24,
    customData: Record<string, any> = {}
  ) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const { data, error } = await supabase
      .from('user_threads')
      .insert([{
        user_email: userEmail,
        agent_id: agentId,
        thread_id: threadId,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        custom_data: customData
      }])
      .select()
      .single();
    
    return { thread: data, error };
  },

  // Desativa thread expirada
  async deactivateThread(id: number) {
    const { data, error } = await supabase
      .from('user_threads')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    return { thread: data, error };
  },

  // Busca threads expiradas para limpeza
  async getExpiredThreads() {
    const { data, error } = await supabase
      .from('user_threads')
      .select('*')
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString());
    
    return { threads: data || [], error };
  }
};

/**
 * Funções para gerenciar mensagens
 */
export const messagesAPI = {
  async getMessages(userEmail: string, agentId: number, threadId?: string) {
    let query = supabase
      .from('mensagens')
      .select('*')
      .eq('user_email', userEmail)
      .eq('agent_id', agentId);

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    
    return { messages: data || [], error };
  },

  async sendMessage(
    userEmail: string, 
    agentId: number, 
    content: string, 
    isFromUser: boolean,
    threadId?: string,
    openaiMessageId?: string
  ) {
    const { data, error } = await supabase
      .from('mensagens')
      .insert([{
        user_email: userEmail,
        agent_id: agentId,
        content,
        is_from_user: isFromUser,
        thread_id: threadId,
        openai_message_id: openaiMessageId,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { message: data, error };
  }
};

/**
 * Funções para gerenciar chaves de acesso
 */
export const accessKeysAPI = {
  async getAllAccessKeys() {
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { accessKeys: data || [], error };
  },

  async createAccessKey(keyValue: string) {
    const { data, error } = await supabase
      .from('access_keys')
      .insert([{ key_value: keyValue }])
      .select()
      .single();
    
    return { accessKey: data, error };
  },

  async deleteAccessKey(id: number) {
    const { error } = await supabase
      .from('access_keys')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

/**
 * Funções para configurações do sistema
 */
export const systemConfigAPI = {
  async getAllConfigs() {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('key', { ascending: true });
    
    return { configs: data || [], error };
  },

  async getConfig(key: string) {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', key)
      .single();
    
    return { config: data, error };
  },

  async setConfig(key: string, value: string, description?: string, isSensitive: boolean = false) {
    const { data, error } = await supabase
      .from('system_config')
      .upsert([{
        key,
        value,
        description,
        is_sensitive: isSensitive,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { config: data, error };
  },

  async deleteConfig(key: string) {
    const { error } = await supabase
      .from('system_config')
      .delete()
      .eq('key', key);
    
    return { error };
  }
};