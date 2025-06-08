import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authAPI } from '../utils/supabase';

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica se há usuário salvo no localStorage ao inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao recuperar usuário salvo:', error);
        localStorage.removeItem('chatUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: foundUser, error } = await authAPI.loginUser(email, password);
      
      if (error || !foundUser) {
        return false;
      }

      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('chatUser', JSON.stringify(foundUser));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      // Verifica se o usuário já existe
      const { user: existingUser } = await authAPI.checkUserExists(email);
      if (existingUser) {
        return false; // Usuário já existe
      }

      const { user: newUser, error } = await authAPI.registerUser(email, password);
      
      if (error || !newUser) {
        return false;
      }

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('chatUser', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('chatUser');
  };

  const value: AuthState = {
    user,
    isAuthenticated,
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