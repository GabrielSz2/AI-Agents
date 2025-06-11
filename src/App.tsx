import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ChatInterface } from './components/Chat/ChatInterface';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AdminRoute } from './components/Admin/AdminRoute';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const { isAuthenticated, user } = useAuth();

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

  // Se for rota admin, mostra o painel admin independente
  if (isAdminRoute) {
    return <AdminRoute />;
  }

  if (isAuthenticated) {
    if (showAdmin && user?.is_admin) {
      return <AdminPanel onBack={() => setShowAdmin(false)} />;
    }
    return <ChatInterface onShowAdmin={() => setShowAdmin(true)} />;
  }

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