import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Agent, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI } from '../../utils/supabase';
import { Sidebar } from './Sidebar';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export const ChatInterface: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega agentes ao montar o componente
  useEffect(() => {
    loadAgents();
  }, []);

  // Carrega mensagens quando um agente é selecionado
  useEffect(() => {
    if (selectedAgent && user) {
      loadMessages(user.user, selectedAgent.id);
    }
  }, [selectedAgent, user]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      // Simula chamada à API do Supabase
      // Substitua pela implementação real usando agentsAPI.getAllAgents()
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - substitua pela chamada real
      const mockAgents: Agent[] = [
        {
          id: 1,
          name: "Ana Assistente",
          description: "Especialista em atendimento geral",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Carlos Técnico",
          description: "Suporte técnico especializado",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: "Sofia Vendas",
          description: "Consultora de vendas e produtos",
          created_at: new Date().toISOString()
        }
      ];
      
      setAgents(mockAgents);
      if (mockAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(mockAgents[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const loadMessages = async (userEmail: string, agentId: number) => {
    setIsLoadingMessages(true);
    try {
      const { messages: loadedMessages, error } = await messagesAPI.getMessages(userEmail, agentId);
      if (!error) {
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedAgent || !user || isSending) {
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Adiciona mensagem do usuário
      const userMessage: Message = {
        user_email: user.user,
        agent_id: selectedAgent.id,
        content: messageContent,
        is_from_user: true,
        timestamp: new Date().toISOString()
      };

      // Salva mensagem do usuário no Supabase
      const { message: savedUserMessage, error } = await messagesAPI.sendMessage(
        user.user,
        selectedAgent.id,
        messageContent,
        true
      );

      if (!error && savedUserMessage) {
        setMessages(prev => [...prev, savedUserMessage]);
      } else {
        // Se falhar, adiciona localmente
        setMessages(prev => [...prev, userMessage]);
      }

      // Mostra indicador de digitação
      setIsTyping(true);

      // Busca resposta do agente
      const agentResponse = await messagesAPI.getAgentResponse(selectedAgent.id);
      
      // Salva resposta do agente
      const { message: savedAgentMessage, error: agentError } = await messagesAPI.sendMessage(
        user.user,
        selectedAgent.id,
        agentResponse,
        false
      );

      setIsTyping(false);

      if (!agentError && savedAgentMessage) {
        setMessages(prev => [...prev, savedAgentMessage]);
      } else {
        // Se falhar, adiciona localmente
        const agentMessage: Message = {
          user_email: user.user,
          agent_id: selectedAgent.id,
          content: agentResponse,
          is_from_user: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex">
      {/* Sidebar */}
      <Sidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        isLoading={isLoadingAgents}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-medium text-purple-300">
                    {selectedAgent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedAgent.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-medium text-purple-300">
                      {selectedAgent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Inicie uma conversa com {selectedAgent.name}
                  </h3>
                  <p className="text-gray-400">
                    Digite uma mensagem abaixo para começar
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    agentName={selectedAgent.name}
                  />
                ))
              )}

              {isTyping && (
                <TypingIndicator agentName={selectedAgent.name} />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50 p-6">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Enviar mensagem para ${selectedAgent.name}...`}
                  className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all flex items-center justify-center"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Send className="w-12 h-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Selecione um agente
              </h2>
              <p className="text-gray-400 max-w-md">
                Escolha um dos agentes disponíveis na barra lateral para iniciar uma conversa
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};