import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ChatInterface } from './components/Chat/ChatInterface';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <ChatInterface />;
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