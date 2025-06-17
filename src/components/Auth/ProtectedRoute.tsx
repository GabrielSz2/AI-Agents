import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  fallback 
}) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  useEffect(() => {
    // Verifica se a sessão ainda é válida a cada 5 minutos
    const interval = setInterval(() => {
      const sessionData = localStorage.getItem('chatUser');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          const timeSinceLogin = now - (session.loginTime || 0);
          const timeSinceActivity = now - (session.lastActivity || 0);
          
          // Se passou de 24h ou 2h de inatividade, faz logout
          if (timeSinceLogin > 24 * 60 * 60 * 1000 || timeSinceActivity > 2 * 60 * 60 * 1000) {
            logout();
          } else {
            // Atualiza última atividade
            session.lastActivity = now;
            localStorage.setItem('chatUser', JSON.stringify(session));
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          logout();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [logout]);

  // Atualiza atividade do usuário em interações
  useEffect(() => {
    const updateActivity = () => {
      const sessionData = localStorage.getItem('chatUser');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          session.lastActivity = Date.now();
          localStorage.setItem('chatUser', JSON.stringify(session));
        } catch (error) {
          console.error('Erro ao atualizar atividade:', error);
        }
      }
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-white">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  if (requireAdmin && !user.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Acesso Negado</h2>
          <p className="text-red-400">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};