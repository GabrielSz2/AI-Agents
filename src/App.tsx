import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ChatInterface } from './components/Chat/ChatInterface';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AdminRoute } from './components/Admin/AdminRoute';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const { isAuthenticated, user, isLoading } = useAuth();

  // Verifica se a URL é para admin
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname;
      setIsAdminRoute(path === '/admin' || path.startsWith('/admin/'));
    };

    checkAdminRoute();
    
    // Escuta mudanças na URL
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);

  // Proteção de rota para admin
  if (isAdminRoute) {
    return (
      <ProtectedRoute requireAdmin={true} fallback={<AdminRoute />}>
        <AdminRoute />
      </ProtectedRoute>
    );
  }

  // Proteção de rota para chat
  if (isAuthenticated) {
    if (showAdmin && user?.is_admin) {
      return (
        <ProtectedRoute requireAdmin={true}>
          <AdminPanel onBack={() => setShowAdmin(false)} />
        </ProtectedRoute>
      );
    }
    
    return (
      <ProtectedRoute>
        <ChatInterface onShowAdmin={() => setShowAdmin(true)} />
      </ProtectedRoute>
    );
  }

  // Tela de autenticação
  return (
    <>
      {authMode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default App;