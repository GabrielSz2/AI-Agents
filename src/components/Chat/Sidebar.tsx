import React from 'react';
import { MessageCircle, LogOut, User, Settings } from 'lucide-react';
import { Agent } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
  onShowAdmin: () => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  agents,
  selectedAgent,
  onSelectAgent,
  onShowAdmin,
  isLoading
}) => {
  const { user, logout } = useAuth();

  const getAgentInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">ChatBot</h1>
            <p className="text-sm text-gray-400">Plataforma de Chat</p>
          </div>
        </div>
        
        {/* User info */}
        <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-32">
                {user?.email || 'Usuário'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.is_admin ? 'Administrador' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {user?.is_admin && (
              <button
                onClick={onShowAdmin}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all"
                title="Painel Admin"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wider">
            Agentes Disponíveis
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3 rounded-xl">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Nenhum agente disponível
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left group ${
                    selectedAgent?.id === agent.id
                      ? 'bg-purple-600/20 border border-purple-500/30'
                      : 'hover:bg-gray-700/30 border border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium ${
                    selectedAgent?.id === agent.id
                      ? 'bg-purple-600/30 text-purple-300'
                      : 'bg-gray-700/50 text-gray-300 group-hover:bg-gray-600/50'
                  }`}>
                    {agent.avatar ? (
                      <img 
                        src={agent.avatar} 
                        alt={agent.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      getAgentInitials(agent.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      selectedAgent?.id === agent.id ? 'text-white' : 'text-gray-200'
                    }`}>
                      {agent.name}
                    </h3>
                    <p className={`text-sm truncate ${
                      selectedAgent?.id === agent.id ? 'text-purple-300' : 'text-gray-400'
                    }`}>
                      {agent.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};