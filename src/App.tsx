import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ChatInterface } from './components/Chat/ChatInterface';
import { AdminPanel } from './components/Admin/AdminPanel';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAuthenticated, user } = useAuth();

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