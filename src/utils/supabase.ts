import { createClient } from '@supabase/supabase-js';
import { User, Agent, Message, AccessKey, UserThread, SystemConfig, CustomField } from '../types';
import { hashPassword, verifyPassword, sanitizeInput } from './auth';

/**
 * Configuração do cliente Supabase
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Funções de autenticação customizada com segurança aprimorada
 */
export const authAPI = {
  async checkUserExists(email: string) {
    try {
      const sanitizedEmail = sanitizeInput(email);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, is_admin')
        .eq('email', sanitizedEmail)
        .limit(1);
      
      return { user: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return { user: null, error };
    }
  },

  async validateAccessKey(keyValue: string) {
    try {
      const sanitizedKey = sanitizeInput(keyValue);
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_value', sanitizedKey)
        .eq('is_used', false)
        .limit(1);
      
      return { accessKey: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao validar chave:', error);
      return { accessKey: null, error };
    }
  },

  async markAccessKeyAsUsed(keyValue: string, userEmail: string) {
    try {
      const sanitizedKey = sanitizeInput(keyValue);
      const sanitizedEmail = sanitizeInput(userEmail);
      
      const { data, error } = await supabase
        .from('access_keys')
        .update({
          is_used: true,
          used_by: sanitizedEmail,
          used_at: new Date().toISOString()
        })
        .eq('key_value', sanitizedKey)
        .eq('is_used', false)
        .select()
        .limit(1);
      
      return { accessKey: data && data.length > 0 ? data[0] : null, error };
    } catch (err) {
      console.error('Erro ao marcar chave como usada:', err);
      return { accessKey: null, error: err };
    }
  },

  async registerUser(email: string, password: string, accessKey: string) {
    try {
      // Sanitiza entradas
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedKey = sanitizeInput(accessKey);
      
      // Verifica se o email já existe
      const { user: existingUser } = await this.checkUserExists(sanitizedEmail);
      if (existingUser) {
        return { user: null, error: { message: 'Email já está em uso' } };
      }

      // Valida formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return { user: null, error: { message: 'Email inválido' } };
      }

      // Gera hash da senha
      const hashedPassword = await hashPassword(password);

      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          email: sanitizedEmail, 
          password: hashedPassword, 
          access_key_used: sanitizedKey 
        }])
        .select('id, email, is_admin, created_at')
        .limit(1);
      
      const newUser = data && data.length > 0 ? data[0] : null;
      
      // Enviar email de agradecimento (simulado)
      if (newUser && !error) {
        try {
          await this.sendWelcomeEmail(sanitizedEmail);
        } catch (emailError) {
          console.warn('Erro ao enviar email de boas-vindas:', emailError);
        }
      }
      
      return { user: newUser, error };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { user: null, error };
    }
  },

  async loginUser(email: string, password: string) {
    try {
      const sanitizedEmail = sanitizeInput(email);
      
      // Busca usuário pelo email
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', sanitizedEmail)
        .limit(1);
      
      if (error || !data || data.length === 0) {
        return { user: null, error: { message: 'Usuário não encontrado' } };
      }

      const user = data[0];
      
      // Verifica senha
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { user: null, error: { message: 'Senha incorreta' } };
      }

      // Remove senha do objeto retornado
      const { password: _, ...userWithoutPassword } = user;
      
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { user: null, error };
    }
  },

  async sendWelcomeEmail(email: string) {
    // Simulação de envio de email
    console.log(`📧 Email de boas-vindas enviado para: ${email}`);
    return { success: true };
  }
};

/**
 * Funções para gerenciar agentes
 */
export const agentsAPI = {
  async getAllAgents() {
    try {
      const { data, error } = await supabase
        .from('agentes')
        .select('*')
        .order('created_at', { ascending: true });
      
      return { agents: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      return { agents: [], error };
    }
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
    try {
      const { data, error } = await supabase
        .from('agentes')
        .insert([{
          name: sanitizeInput(name),
          description: sanitizeInput(description),
          instructions: sanitizeInput(instructions),
          avatar: avatar ? sanitizeInput(avatar) : undefined,
          model,
          temperature,
          max_tokens: maxTokens,
          assistant_id: assistantId ? sanitizeInput(assistantId) : undefined,
          thread_expiry_hours: threadExpiryHours,
          custom_fields: customFields
        }])
        .select()
        .limit(1);
      
      return { agent: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      return { agent: null, error };
    }
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
    try {
      const { data, error } = await supabase
        .from('agentes')
        .update({
          name: sanitizeInput(name),
          description: sanitizeInput(description),
          instructions: sanitizeInput(instructions),
          avatar: avatar ? sanitizeInput(avatar) : undefined,
          model,
          temperature,
          max_tokens: maxTokens,
          assistant_id: assistantId ? sanitizeInput(assistantId) : undefined,
          thread_expiry_hours: threadExpiryHours,
          custom_fields: customFields
        })
        .eq('id', id)
        .select()
        .limit(1);
      
      return { agent: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      return { agent: null, error };
    }
  },

  async deleteAgent(id: number) {
    try {
      const { error } = await supabase
        .from('agentes')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Erro ao deletar agente:', error);
      return { error };
    }
  }
};

/**
 * Funções para gerenciar threads de usuários
 */
export const threadsAPI = {
  async getActiveThread(userEmail: string, agentId: number) {
    try {
      const sanitizedEmail = sanitizeInput(userEmail);
      const { data, error } = await supabase
        .from('user_threads')
        .select('*')
        .eq('user_email', sanitizedEmail)
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .limit(1);
      
      return { thread: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao buscar thread ativa:', error);
      return { thread: null, error };
    }
  },

  async createUserThread(
    userEmail: string, 
    agentId: number, 
    threadId: string, 
    expiryHours: number = 24,
    customData: Record<string, any> = {}
  ) {
    try {
      const sanitizedEmail = sanitizeInput(userEmail);
      const sanitizedThreadId = sanitizeInput(threadId);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      const { data, error } = await supabase
        .from('user_threads')
        .insert([{
          user_email: sanitizedEmail,
          agent_id: agentId,
          thread_id: sanitizedThreadId,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          custom_data: customData
        }])
        .select()
        .limit(1);
      
      return { thread: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao criar thread:', error);
      return { thread: null, error };
    }
  },

  async deactivateThread(id: number) {
    try {
      const { data, error } = await supabase
        .from('user_threads')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .limit(1);
      
      return { thread: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao desativar thread:', error);
      return { thread: null, error };
    }
  },

  async getExpiredThreads() {
    try {
      const { data, error } = await supabase
        .from('user_threads')
        .select('*')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());
      
      return { threads: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar threads expiradas:', error);
      return { threads: [], error };
    }
  }
};

/**
 * Funções para gerenciar mensagens
 */
export const messagesAPI = {
  async getMessages(userEmail: string, agentId: number, threadId?: string) {
    try {
      const sanitizedEmail = sanitizeInput(userEmail);
      
      let query = supabase
        .from('mensagens')
        .select('*')
        .eq('user_email', sanitizedEmail)
        .eq('agent_id', agentId);

      if (threadId) {
        query = query.eq('thread_id', sanitizeInput(threadId));
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      
      return { messages: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { messages: [], error };
    }
  },

  async sendMessage(
    userEmail: string, 
    agentId: number, 
    content: string, 
    isFromUser: boolean,
    threadId?: string,
    openaiMessageId?: string
  ) {
    try {
      const sanitizedEmail = sanitizeInput(userEmail);
      const sanitizedContent = sanitizeInput(content);
      const sanitizedThreadId = threadId ? sanitizeInput(threadId) : undefined;
      const sanitizedOpenaiId = openaiMessageId ? sanitizeInput(openaiMessageId) : undefined;
      
      const { data, error } = await supabase
        .from('mensagens')
        .insert([{
          user_email: sanitizedEmail,
          agent_id: agentId,
          content: sanitizedContent,
          is_from_user: isFromUser,
          thread_id: sanitizedThreadId,
          openai_message_id: sanitizedOpenaiId,
          timestamp: new Date().toISOString()
        }])
        .select()
        .limit(1);
      
      return { message: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return { message: null, error };
    }
  },

  async getAgentResponse(agentId: number, userMessage: string, userEmail: string) {
    try {
      const sanitizedMessage = sanitizeInput(userMessage);
      const sanitizedEmail = sanitizeInput(userEmail);
      
      // Busca o agente no banco
      const { data: agents, error: agentError } = await supabase
        .from('agentes')
        .select('*')
        .eq('id', agentId)
        .limit(1);

      if (agentError || !agents || agents.length === 0) {
        throw new Error('Agente não encontrado');
      }

      const agent = agents[0];

      // Se não tem assistant_id, usa resposta simulada
      if (!agent.assistant_id) {
        return this.getSimulatedResponse(agent.name, sanitizedMessage);
      }

      // Chama a edge function para processar com OpenAI
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: sanitizedEmail,
          agent_id: agentId,
          message: sanitizedMessage,
          assistant_id: agent.assistant_id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na edge function:', errorText);
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.resposta || 'Desculpe, não consegui processar sua mensagem.';
    } catch (error) {
      console.error('Erro ao obter resposta do agente:', error);
      return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
    }
  },

  getSimulatedResponse(agentName: string, userMessage: string) {
    const responses = [
      `Olá! Sou ${agentName}. Recebi sua mensagem: "${userMessage}". Como posso ajudá-lo?`,
      `Entendi sua solicitação sobre "${userMessage}". Vou analisar e retornar com uma resposta detalhada.`,
      `Obrigado por entrar em contato! Sobre "${userMessage}", posso fornecer algumas informações úteis.`,
      `Interessante pergunta sobre "${userMessage}". Deixe-me explicar melhor esse assunto.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

/**
 * Funções para gerenciar chaves de acesso
 */
export const accessKeysAPI = {
  async getAllAccessKeys() {
    try {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      return { accessKeys: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar chaves:', error);
      return { accessKeys: [], error };
    }
  },

  async createAccessKey(keyValue: string) {
    try {
      const sanitizedKey = sanitizeInput(keyValue);
      const { data, error } = await supabase
        .from('access_keys')
        .insert([{ key_value: sanitizedKey }])
        .select()
        .limit(1);
      
      return { accessKey: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao criar chave:', error);
      return { accessKey: null, error };
    }
  },

  async deleteAccessKey(id: number) {
    try {
      const { error } = await supabase
        .from('access_keys')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Erro ao deletar chave:', error);
      return { error };
    }
  }
};

/**
 * Funções para configurações do sistema
 */
export const systemConfigAPI = {
  async getAllConfigs() {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('key', { ascending: true });
      
      return { configs: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return { configs: [], error };
    }
  },

  async getConfig(key: string) {
    try {
      const sanitizedKey = sanitizeInput(key);
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', sanitizedKey)
        .limit(1);
      
      return { config: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return { config: null, error };
    }
  },

  async setConfig(key: string, value: string, description?: string, isSensitive: boolean = false) {
    try {
      const sanitizedKey = sanitizeInput(key);
      const sanitizedValue = sanitizeInput(value);
      const sanitizedDescription = description ? sanitizeInput(description) : undefined;
      
      const { data, error } = await supabase
        .from('system_config')
        .upsert([{
          key: sanitizedKey,
          value: sanitizedValue,
          description: sanitizedDescription,
          is_sensitive: isSensitive,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'key'
        })
        .select()
        .limit(1);
      
      return { config: data && data.length > 0 ? data[0] : null, error };
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return { config: null, error };
    }
  },

  async deleteConfig(key: string) {
    try {
      const sanitizedKey = sanitizeInput(key);
      const { error } = await supabase
        .from('system_config')
        .delete()
        .eq('key', sanitizedKey);
      
      return { error };
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      return { error };
    }
  }
};