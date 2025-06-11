import React, { useState } from 'react';
import { Save, X, Bot } from 'lucide-react';
import { Agent } from '../../types';
import { agentsAPI } from '../../utils/supabase';

interface AgentFormProps {
  agent?: Agent | null;
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [webhookUrl, setWebhookUrl] = useState(agent?.webhook_url || '');
  const [avatar, setAvatar] = useState(agent?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !webhookUrl.trim()) {
      setError('Nome, descrição e URL do webhook são obrigatórios.');
      return;
    }

    // Validação básica de URL
    try {
      new URL(webhookUrl);
    } catch {
      setError('URL do webhook inválida.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let result;
      
      if (agent) {
        // Editando agente existente
        result = await agentsAPI.updateAgent(
          agent.id,
          name.trim(),
          description.trim(),
          webhookUrl.trim(),
          avatar.trim() || undefined
        );
      } else {
        // Criando novo agente
        result = await agentsAPI.createAgent(
          name.trim(),
          description.trim(),
          webhookUrl.trim(),
          avatar.trim() || undefined
        );
      }

      if (result.error || !result.agent) {
        setError('Erro ao salvar agente. Tente novamente.');
      } else {
        onSave(result.agent);
      }
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {agent ? 'Editar Agente' : 'Novo Agente'}
              </h1>
              <p className="text-gray-400">
                {agent ? 'Modifique as informações do agente' : 'Crie um novo agente para o chat'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Agente *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Ex: Ana Assistente"
                required
              />
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-2">
                URL do Avatar (opcional)
              </label>
              <input
                type="url"
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Ex: Especialista em atendimento geral"
              required
            />
          </div>

          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-300 mb-2">
              URL do Webhook *
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="https://api.exemplo.com/webhook/agent"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Esta URL receberá requisições POST com as mensagens dos usuários e deve retornar a resposta do agente.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-6 py-3 rounded-xl transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{agent ? 'Salvar Alterações' : 'Criar Agente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};