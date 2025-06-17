import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authAPI } from '../utils/supabase';
import { 
  generateSessionToken, 
  isSessionValid, 
  updateSessionActivity, 
  SessionData,
  loginAttemptTracker 
} from '../utils/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se há usuário salvo no localStorage ao inicializar
  useEffect(() => {
    const validateStoredSession = async () => {
      setIsLoading(true);
      
      try {
        const savedSession = localStorage.getItem('chatUser');
        if (savedSession) {
          const sessionData: SessionData = JSON.parse(savedSession);
          
          // Verifica se a sessão ainda é válida
          if (isSessionValid(sessionData)) {
            // Atualiza última atividade
            const updatedSession = updateSessionActivity(sessionData);
            localStorage.setItem('chatUser', JSON.stringify(updatedSession));
            
            // Reconstrói o objeto user
            const userData: User = {
              id: sessionData.userId,
              email: sessionData.email,
              password: '', // Não armazenamos senha na sessão
              is_admin: sessionData.isAdmin
            };
            
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Sessão expirada
            localStorage.removeItem('chatUser');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Erro ao validar sessão armazenada:', error);
        localStorage.removeItem('chatUser');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateStoredSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verifica rate limiting
      if (!loginAttemptTracker.canAttemptLogin(email)) {
        const timeLeft = loginAttemptTracker.getTimeUntilUnlock(email);
        const minutes = Math.ceil(timeLeft / (60 * 1000));
        return { 
          success: false, 
          error: `Muitas tentativas de login. Tente novamente em ${minutes} minutos.` 
        };
      }

      const { user: foundUser, error } = await authAPI.loginUser(email, password);
      
      if (error || !foundUser) {
        loginAttemptTracker.recordFailedAttempt(email);
        return { success: false, error: 'Email ou senha incorretos.' };
      }

      // Login bem-sucedido
      loginAttemptTracker.recordSuccessfulLogin(email);

      // Cria sessão segura
      const sessionData: SessionData = {
        userId: foundUser.id!,
        email: foundUser.email,
        isAdmin: foundUser.is_admin || false,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        sessionToken: generateSessionToken()
      };

      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('chatUser', JSON.stringify(sessionData));
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  const register = async (email: string, password: string, accessKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verifica se o usuário já existe
      const { user: existingUser } = await authAPI.checkUserExists(email);
      if (existingUser) {
        return { success: false, error: 'Este email já está em uso.' };
      }

      // Valida a chave de acesso
      const { accessKey: validKey, error: keyError } = await authAPI.validateAccessKey(accessKey);
      if (keyError || !validKey) {
        return { success: false, error: 'Chave de acesso inválida ou já utilizada.' };
      }

      // Registra o usuário (a senha será hasheada no backend)
      const { user: newUser, error } = await authAPI.registerUser(email, password, accessKey);
      
      if (error || !newUser) {
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
      }

      // Marca a chave como usada
      await authAPI.markAccessKeyAsUsed(accessKey, email);

      // Cria sessão para o novo usuário
      const sessionData: SessionData = {
        userId: newUser.id!,
        email: newUser.email,
        isAdmin: newUser.is_admin || false,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        sessionToken: generateSessionToken()
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('chatUser', JSON.stringify(sessionData));
      
      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('chatUser');
    
    // Limpa outros dados sensíveis se houver
    sessionStorage.clear();
  };

  const value: AuthState = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};