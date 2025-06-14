import React, { useState } from 'react';
import { Save, X, Bot, MessageSquare, Settings, Sparkles, Plus, Trash2, Clock } from 'lucide-react';
import { Agent, CustomField, OpenAIModels } from '../../types';
import { agentsAPI } from '../../utils/supabase';
import { openaiAPI } from '../../utils/openai';

interface AgentFormProps {
  agent?: Agent | null;
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

const OPENAI_MODELS: OpenAIModels = {
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Mais recente e avançado',
    release_date: '2024-05-13',
    context_window: 128000,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'Versão otimizada e econômica',
    release_date: '2024-07-18',
    context_window: 128000,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Rápido e eficiente',
    release_date: '2024-04-09',
    context_window: 128000,
  },
  'gpt-4': {
    name: 'GPT-4',
    description: 'Modelo base GPT-4',
    release_date: '2023-03-14',
    context_window: 8192,
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Rápido e econômico',
    release_date: '2023-03-01',
    context_window: 16385,
  },
};

export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [instructions, setInstructions] = useState(agent?.instructions || '');
  const [avatar, setAvatar] = useState(agent?.avatar || '');
  const [model, setModel] = useState(agent?.model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(agent?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.max_tokens || 1000);
  const [threadExpiryHours, setThreadExpiryHours] = useState(agent?.thread_expiry_hours || 24);
  const [customFields, setCustomFields] = useState<CustomField[]>(agent?.custom_fields || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createAssistant, setCreateAssistant] = useState(!agent?.assistant_id);

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setCustomFields([...customFields, newField]);
  };

  const handleUpdateCustomField = (index: number, field: CustomField) => {
    const updatedFields = [...customFields];
    updatedFields[index] = field;
    setCustomFields(updatedFields);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !instructions.trim()) {
      setError('Nome, descrição e instruções são obrigatórios.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let assistantId = agent?.assistant_id;

      // Criar ou atualizar Assistant na OpenAI se solicitado
      if (createAssistant) {
        if (agent?.assistant_id) {
          // Atualizar assistant existente
          const { assistant, error: openaiError } = await openaiAPI.updateAssistant(
            agent.assistant_id,
            name.trim(),
            instructions.trim(),
            model
          );
          
          if (openaiError) {
            console.warn('Erro ao atualizar assistant na OpenAI:', openaiError);
            // Continua mesmo com erro na OpenAI
          } else if (assistant) {
            assistantId = assistant.id;
          }
        } else {
          // Criar novo assistant
          const { assistant, error: openaiError } = await openaiAPI.createAssistant(
            name.trim(),
            instructions.trim(),
            model
          );
          
          if (openaiError) {
            console.warn('Erro ao criar assistant na OpenAI:', openaiError);
            // Continua mesmo com erro na OpenAI
          } else if (assistant) {
            assistantId = assistant.id;
          }
        }
      }

      // Salvar no banco de dados
      let result;
      
      if (agent) {
        // Editando agente existente
        result = await agentsAPI.updateAgent(
          agent.id,
          name.trim(),
          description.trim(),
          instructions.trim(),
          avatar.trim() || undefined,
          model,
          temperature,
          maxTokens,
          assistantId,
          threadExpiryHours,
          customFields
        );
      } else {
        // Criando novo agente
        result = await agentsAPI.createAgent(
          name.trim(),
          description.trim(),
          instructions.trim(),
          avatar.trim() || undefined,
          model,
          temperature,
          maxTokens,
          assistantId,
          threadExpiryHours,
          customFields
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
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {agent ? 'Editar Agente' : 'Criar Novo Agente'}
              </h1>
              <p className="text-gray-400">
                Configure seu assistente de IA personalizado com OpenAI Assistants API
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-gray-700/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
            </div>
            
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
                  placeholder="Ex: Assistente de Vendas"
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

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Descrição *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Ex: Especialista em vendas e atendimento ao cliente"
                required
              />
            </div>
          </div>

          {/* Instruções do Agente */}
          <div className="bg-gray-700/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Instruções do Agente</h3>
            </div>
            
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
                Prompt do Sistema *
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Você é um assistente especializado em... Suas responsabilidades incluem... Sempre responda de forma..."
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Defina como o agente deve se comportar, seu tom de voz, especialidades e limitações.
              </p>
            </div>
          </div>

          {/* Configurações do Modelo */}
          <div className="bg-gray-700/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Configurações do Modelo</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                  Modelo OpenAI
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {Object.entries(OPENAI_MODELS).map(([key, modelInfo]) => (
                    <option key={key} value={key}>
                      {modelInfo.name} - {modelInfo.release_date}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {OPENAI_MODELS[model as keyof OpenAIModels]?.description} • 
                  {OPENAI_MODELS[model as keyof OpenAIModels]?.context_window.toLocaleString()} tokens
                </p>
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-300 mb-2">
                  Criatividade: {temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-300 mb-2">
                  Máximo de Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controla o tamanho máximo das respostas
                </p>
              </div>

              <div>
                <label htmlFor="threadExpiryHours" className="block text-sm font-medium text-gray-300 mb-2">
                  Expiração da Thread (horas)
                </label>
                <input
                  type="number"
                  id="threadExpiryHours"
                  min="1"
                  max="168"
                  value={threadExpiryHours}
                  onChange={(e) => setThreadExpiryHours(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo para reiniciar conversa (1-168h)
                </p>
              </div>
            </div>
          </div>

          {/* Campos Customizados */}
          <div className="bg-gray-700/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Campos Customizados</h3>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Campo</span>
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Nenhum campo customizado. Adicione campos específicos para este agente (ex: peso, altura para nutricionista).
              </p>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.id} className="bg-gray-800/30 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nome do Campo
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleUpdateCustomField(index, { ...field, name: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Ex: Peso"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tipo
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateCustomField(index, { ...field, type: e.target.value as any })}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="textarea">Texto Longo</option>
                          <option value="select">Seleção</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => handleUpdateCustomField(index, { ...field, placeholder: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Ex: Digite seu peso em kg"
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateCustomField(index, { ...field, required: e.target.checked })}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-300">Obrigatório</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(index)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OpenAI Assistant */}
          <div className="bg-gray-700/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">OpenAI Assistant</h3>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="createAssistant"
                checked={createAssistant}
                onChange={(e) => setCreateAssistant(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="createAssistant" className="text-sm text-gray-300">
                {agent?.assistant_id 
                  ? 'Atualizar Assistant na OpenAI com as configurações atuais'
                  : 'Criar Assistant na OpenAI automaticamente'
                }
              </label>
            </div>
            
            {agent?.assistant_id && (
              <p className="text-xs text-gray-500 mt-2">
                Assistant ID atual: <span className="font-mono text-purple-400">{agent.assistant_id}</span>
              </p>
            )}
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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};