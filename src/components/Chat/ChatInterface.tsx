import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Agent, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI, agentsAPI } from '../../utils/supabase';
import { Sidebar } from './Sidebar';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { sanitizeInput } from '../../utils/auth';

interface ChatInterfaceProps {
  onShowAdmin: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onShowAdmin }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageId, setMessageId] = useState(0); // Para prevenir duplicatas
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false); // Ref para controlar envio duplicado

  // Carrega agentes ao montar o componente
  useEffect(() => {
    loadAgents();
  }, []);

  // Carrega mensagens quando um agente é selecionado
  useEffect(() => {
    if (selectedAgent && user) {
      loadMessages(user.email, selectedAgent.id);
    }
  }, [selectedAgent, user]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    setError(null);
    try {
      const { agents: loadedAgents, error } = await agentsAPI.getAllAgents();
      if (!error) {
        setAgents(loadedAgents);
        if (loadedAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(loadedAgents[0]);
        }
      } else {
        setError('Erro ao carregar agentes. Tente recarregar a página.');
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const loadMessages = async (userEmail: string, agentId: number) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const { messages: loadedMessages, error } = await messagesAPI.getMessages(userEmail, agentId);
      if (!error) {
        setMessages(loadedMessages);
      } else {
        setError('Erro ao carregar histórico de mensagens.');
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setError('Erro ao carregar mensagens.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Previne envio duplicado
    if (sendingRef.current || !inputMessage.trim() || !selectedAgent || !user || isSending) {
      return;
    }

    const messageContent = sanitizeInput(inputMessage.trim());
    if (!messageContent) {
      setError('Mensagem inválida.');
      return;
    }

    // Marca como enviando
    sendingRef.current = true;
    setInputMessage('');
    setIsSending(true);
    setError(null);

    const currentMessageId = messageId + 1;
    setMessageId(currentMessageId);

    try {
      // Adiciona mensagem do usuário imediatamente
      const userMessage: Message = {
        id: currentMessageId,
        user_email: user.email,
        agent_id: selectedAgent.id,
        content: messageContent,
        is_from_user: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Salva mensagem do usuário no banco
      const { message: savedUserMessage, error: userError } = await messagesAPI.sendMessage(
        user.email,
        selectedAgent.id,
        messageContent,
        true
      );

      if (userError) {
        console.warn('Erro ao salvar mensagem do usuário:', userError);
      }

      // Mostra indicador de digitação
      setIsTyping(true);

      // Busca resposta do agente
      const agentResponse = await messagesAPI.getAgentResponse(
        selectedAgent.id, 
        messageContent, 
        user.email
      );
      
      setIsTyping(false);

      // Adiciona resposta do agente
      const agentMessage: Message = {
        id: currentMessageId + 1000, // ID diferente para evitar conflitos
        user_email: user.email,
        agent_id: selectedAgent.id,
        content: agentResponse,
        is_from_user: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);

      // Salva resposta do agente no banco
      const { error: agentError } = await messagesAPI.sendMessage(
        user.email,
        selectedAgent.id,
        agentResponse,
        false
      );

      if (agentError) {
        console.warn('Erro ao salvar resposta do agente:', agentError);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
      setError('Erro ao enviar mensagem. Tente novamente.');
      
      // Remove a mensagem do usuário se houve erro
      setMessages(prev => prev.filter(msg => msg.id !== currentMessageId));
      
      // Restaura a mensagem no input
      setInputMessage(messageContent);
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setError(null);
    setMessageId(0);
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex">
      {/* Sidebar */}
      <Sidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        onShowAdmin={onShowAdmin}
        isLoading={isLoadingAgents}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={dismissError}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Dispensar
              </button>
            </div>
          </div>
        )}

        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center">
                  {selectedAgent.avatar ? (
                    <img 
                      src={selectedAgent.avatar} 
                      alt={selectedAgent.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-purple-300">
                      {selectedAgent.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedAgent.description}
                  </p>
                  {selectedAgent.assistant_id && (
                    <p className="text-xs text-purple-400 mt-1">
                      🤖 Powered by OpenAI Assistant
                    </p>
                  )}
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
                    {selectedAgent.avatar ? (
                      <img 
                        src={selectedAgent.avatar} 
                        alt={selectedAgent.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-purple-300">
                        {selectedAgent.name.charAt(0).toUpperCase()}
                      </span>
                    )}
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
                    key={`${message.id || index}-${message.is_from_user}`}
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
                  disabled={isSending || isTyping}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending || isTyping}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all flex items-center justify-center"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
              
              {selectedAgent.assistant_id && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Conversas são mantidas por {selectedAgent.thread_expiry_hours || 24} horas
                </p>
              )}
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