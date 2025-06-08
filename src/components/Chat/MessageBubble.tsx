import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  agentName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agentName }) => {
  const isUser = message.is_from_user;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md xl:max-w-lg ${
        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      }`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-purple-300">
              {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
            </span>
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`relative px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-purple-600 text-white rounded-br-lg' 
            : 'bg-gray-700/50 text-gray-100 rounded-bl-lg'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* Timestamp */}
          <div className={`mt-2 text-xs ${
            isUser ? 'text-purple-200' : 'text-gray-400'
          }`}>
            {formatTime(message.created_at || message.timestamp || new Date().toISOString())}
          </div>
          
          {/* Message tail */}
          <div className={`absolute bottom-0 w-3 h-3 ${
            isUser 
              ? 'right-0 bg-purple-600' 
              : 'left-0 bg-gray-700/50'
          }`} style={{
            clipPath: isUser 
              ? 'polygon(0 0, 100% 0, 0 100%)' 
              : 'polygon(100% 0, 0 0, 100% 100%)'
          }} />
        </div>
      </div>
    </div>
  );
};