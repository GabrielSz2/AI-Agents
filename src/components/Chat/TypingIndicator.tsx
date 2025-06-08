import React from 'react';

interface TypingIndicatorProps {
  agentName: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agentName }) => {
  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-end space-x-3 max-w-xs lg:max-w-md xl:max-w-lg">
        {/* Avatar */}
        <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-purple-300">
            {agentName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Typing bubble */}
        <div className="relative px-4 py-3 bg-gray-700/50 rounded-2xl rounded-bl-lg">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400 mr-2">{agentName} está digitando</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Message tail */}
          <div className="absolute bottom-0 left-0 w-3 h-3 bg-gray-700/50" style={{
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
          }} />
        </div>
      </div>
    </div>
  );
};