import OpenAI from 'openai';
import { systemConfigAPI } from './supabase';

let openaiClient: OpenAI | null = null;

// Inicializa o cliente OpenAI com a API key do banco
export const initializeOpenAI = async (): Promise<OpenAI | null> => {
  try {
    const { config } = await systemConfigAPI.getConfig('openai_api_key');
    if (!config?.value) {
      console.error('OpenAI API key não configurada');
      return null;
    }

    openaiClient = new OpenAI({
      apiKey: config.value,
      dangerouslyAllowBrowser: false // Nunca usar no browser
    });

    return openaiClient;
  } catch (error) {
    console.error('Erro ao inicializar OpenAI:', error);
    return null;
  }
};

// Obtém o cliente OpenAI (inicializa se necessário)
export const getOpenAIClient = async (): Promise<OpenAI | null> => {
  if (!openaiClient) {
    return await initializeOpenAI();
  }
  return openaiClient;
};

// Funções da OpenAI Assistants API
export const openaiAPI = {
  // Cria um novo assistant
  async createAssistant(name: string, instructions: string, model: string = 'gpt-4o-mini') {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const assistant = await client.beta.assistants.create({
        name,
        instructions,
        model,
        tools: [{ type: 'code_interpreter' }]
      });

      return { assistant, error: null };
    } catch (error) {
      console.error('Erro ao criar assistant:', error);
      return { assistant: null, error };
    }
  },

  // Atualiza um assistant existente
  async updateAssistant(assistantId: string, name: string, instructions: string, model: string = 'gpt-4o-mini') {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const assistant = await client.beta.assistants.update(assistantId, {
        name,
        instructions,
        model
      });

      return { assistant, error: null };
    } catch (error) {
      console.error('Erro ao atualizar assistant:', error);
      return { assistant: null, error };
    }
  },

  // Deleta um assistant
  async deleteAssistant(assistantId: string) {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      await client.beta.assistants.del(assistantId);
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar assistant:', error);
      return { error };
    }
  },

  // Cria uma nova thread
  async createThread() {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const thread = await client.beta.threads.create();
      return { thread, error: null };
    } catch (error) {
      console.error('Erro ao criar thread:', error);
      return { thread: null, error };
    }
  },

  // Adiciona mensagem à thread
  async addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user') {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const message = await client.beta.threads.messages.create(threadId, {
        role,
        content
      });

      return { message, error: null };
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      return { message: null, error };
    }
  },

  // Executa o assistant na thread
  async runAssistant(threadId: string, assistantId: string) {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const run = await client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });

      return { run, error: null };
    } catch (error) {
      console.error('Erro ao executar assistant:', error);
      return { run: null, error };
    }
  },

  // Verifica o status da execução
  async checkRunStatus(threadId: string, runId: string) {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const run = await client.beta.threads.runs.retrieve(threadId, runId);
      return { run, error: null };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { run: null, error };
    }
  },

  // Busca mensagens da thread
  async getThreadMessages(threadId: string, limit: number = 20) {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      const messages = await client.beta.threads.messages.list(threadId, {
        limit,
        order: 'asc'
      });

      return { messages: messages.data, error: null };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { messages: [], error };
    }
  },

  // Deleta uma thread
  async deleteThread(threadId: string) {
    const client = await getOpenAIClient();
    if (!client) throw new Error('OpenAI client não inicializado');

    try {
      await client.beta.threads.del(threadId);
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar thread:', error);
      return { error };
    }
  }
};