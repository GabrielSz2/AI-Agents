import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Users, Bot, ArrowLeft, MessageSquare, Settings, Sparkles, Cog } from 'lucide-react';
import { Agent, AccessKey } from '../../types';
import { agentsAPI, accessKeysAPI } from '../../utils/supabase';
import { AgentForm } from './AgentForm';
import { AccessKeyManager } from './AccessKeyManager';
import { SystemConfigManager } from './SystemConfigManager';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'keys' | 'config'>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsResult, keysResult] = await Promise.all([
        agentsAPI.getAllAgents(),
        accessKeysAPI.getAllAccessKeys()
      ]);

      if (!agentsResult.error) {
        setAgents(agentsResult.agents);
      }

      if (!keysResult.error) {
        setAccessKeys(keysResult.accessKeys);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setShowAgentForm(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentForm(true);
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agente?')) {
      return;
    }

    try {
      const { error } = await agentsAPI.deleteAgent(id);
      if (!error) {
        setAgents(agents.filter(agent => agent.id !== id));
      } else {
        alert('Erro ao excluir agente');
      }
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      alert('Erro ao excluir agente');
    }
  };

  const handleAgentSaved = (savedAgent: Agent) => {
    if (editingAgent) {
      setAgents(agents.map(agent => 
        agent.id === savedAgent.id ? savedAgent : agent
      ));
    } else {
      setAgents([...agents, savedAgent]);
    }
    setShowAgentForm(false);
    setEditingAgent(null);
  };

  const handleAccessKeysUpdate = (updatedKeys: AccessKey[]) => {
    setAccessKeys(updatedKeys);
  };

  if (showAgentForm) {
    return (
      <AgentForm
        agent={editingAgent}
        onSave={handleAgentSaved}
        onCancel={() => {
          setShowAgentForm(false);
          setEditingAgent(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-gray-400">Gerencie agentes de IA, chaves de acesso e configurações</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'agents'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Agentes de IA</span>
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'keys'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Chaves de Acesso</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Cog className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'agents' && (
              <div className="space-y-6">
                {/* Agents Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">
                      Agentes de IA ({agents.length})
                    </h2>
                  </div>
                  <button
                    onClick={handleCreateAgent}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Agente</span>
                  </button>
                </div>

                {/* Agents List */}
                <div className="grid gap-4">
                  {agents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                      <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum agente cadastrado</p>
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center">
                                {agent.avatar ? (
                                  <img 
                                    src={agent.avatar} 
                                    alt={agent.name}
                                    className="w-full h-full rounded-lg object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-medium text-purple-300">
                                    {agent.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {agent.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {agent.description}
                                </p>
                                {agent.assistant_id && (
                                  <p className="text-xs text-purple-400 font-mono">
                                    Assistant ID: {agent.assistant_id}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Agent Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Sparkles className="w-4 h-4 text-blue-400" />
                                  <span className="text-xs font-medium text-blue-400">MODELO</span>
                                </div>
                                <p className="text-sm text-white font-mono">
                                  {agent.model || 'gpt-4o-mini'}
                                </p>
                              </div>
                              
                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Settings className="w-4 h-4 text-green-400" />
                                  <span className="text-xs font-medium text-green-400">CRIATIVIDADE</span>
                                </div>
                                <p className="text-sm text-white">
                                  {agent.temperature || 0.7}
                                </p>
                              </div>
                              
                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-purple-400" />
                                  <span className="text-xs font-medium text-purple-400">MAX TOKENS</span>
                                </div>
                                <p className="text-sm text-white">
                                  {agent.max_tokens || 1000}
                                </p>
                              </div>

                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-orange-400" />
                                  <span className="text-xs font-medium text-orange-400">THREAD EXPIRY</span>
                                </div>
                                <p className="text-sm text-white">
                                  {agent.thread_expiry_hours || 24}h
                                </p>
                              </div>
                            </div>

                            {agent.instructions && (
                              <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">Instruções:</p>
                                <p className="text-sm text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg line-clamp-3">
                                  {agent.instructions}
                                </p>
                              </div>
                            )}

                            {agent.custom_fields && agent.custom_fields.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">Campos Customizados:</p>
                                <div className="flex flex-wrap gap-2">
                                  {agent.custom_fields.map((field, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                                    >
                                      {field.name} ({field.type})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditAgent(agent)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'keys' && (
              <AccessKeyManager
                accessKeys={accessKeys}
                onUpdate={handleAccessKeysUpdate}
              />
            )}

            {activeTab === 'config' && (
              <SystemConfigManager onUpdate={loadData} />
            )}
          </>
        )}
      </div>
    </div>
  );
};