import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Users, Bot, ArrowLeft } from 'lucide-react';
import { Agent, AccessKey } from '../../types';
import { agentsAPI, accessKeysAPI } from '../../utils/supabase';
import { AgentForm } from './AgentForm';
import { AccessKeyManager } from './AccessKeyManager';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'keys'>('agents');
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
              <p className="text-gray-400">Gerencie agentes e chaves de acesso</p>
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
            <span>Agentes</span>
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
                      Agentes ({agents.length})
                    </h2>
                  </div>
                  <button
                    onClick={handleCreateAgent}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Agente</span>
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
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-300">
                                  {agent.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {agent.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {agent.description}
                                </p>
                              </div>
                            </div>
                            {agent.webhook_url && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                                <p className="text-sm text-purple-400 font-mono bg-gray-900/50 px-3 py-2 rounded-lg break-all">
                                  {agent.webhook_url}
                                </p>
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
          </>
        )}
      </div>
    </div>
  );
};