import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowRight, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput, isValidEmail, isStrongPassword } from '../../utils/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; message?: string }>({ valid: false });
  
  const { register } = useAuth();

  // Verifica se o email já existe quando o usuário para de digitar
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !isValidEmail(emailToCheck)) {
      setEmailExists(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?email=eq.${emailToCheck}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      const users = await response.json();
      setEmailExists(users && users.length > 0);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounce para verificação de email
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        checkEmailExists(sanitizeInput(email));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Verifica força da senha
  React.useEffect(() => {
    if (password) {
      setPasswordStrength(isStrongPassword(password));
    } else {
      setPasswordStrength({ valid: false });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitiza entradas
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedAccessKey = sanitizeInput(accessKey);
    
    // Validações básicas
    if (!sanitizedEmail || !password.trim() || !confirmPassword.trim() || !sanitizedAccessKey) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      setError('Por favor, digite um email válido.');
      return;
    }

    if (emailExists) {
      setError('Este email já está em uso. Tente fazer login.');
      return;
    }

    if (!passwordStrength.valid) {
      setError(passwordStrength.message || 'Senha não atende aos critérios de segurança.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await register(sanitizedEmail, password, sanitizedAccessKey);
      if (!result.success) {
        setError(result.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-2xl mb-4">
            <UserPlus className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Criar conta</h1>
          <p className="text-gray-400">
            Preencha os dados para começar a usar o chat
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-300 mb-2">
              Chave de Acesso
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="accessKey"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Digite sua chave de acesso"
                required
                maxLength={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Você precisa de uma chave válida para criar uma conta
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  emailExists === true 
                    ? 'border-red-500 focus:ring-red-500' 
                    : emailExists === false 
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-600 focus:ring-purple-500'
                }`}
                placeholder="seu@email.com"
                required
                maxLength={254}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {checkingEmail ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : emailExists === true ? (
                  <div className="w-5 h-5 text-red-400">❌</div>
                ) : emailExists === false ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : null}
              </div>
            </div>
            {emailExists === true && (
              <p className="text-xs text-red-400 mt-1">
                Este email já está em uso
              </p>
            )}
            {emailExists === false && (
              <p className="text-xs text-green-400 mt-1">
                Email disponível
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  password && passwordStrength.valid 
                    ? 'border-green-500 focus:ring-green-500'
                    : password && !passwordStrength.valid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-purple-500'
                }`}
                placeholder="Mínimo 8 caracteres"
                required
                maxLength={128}
              />
            </div>
            {password && !passwordStrength.valid && (
              <p className="text-xs text-red-400 mt-1">
                {passwordStrength.message}
              </p>
            )}
            {password && passwordStrength.valid && (
              <p className="text-xs text-green-400 mt-1">
                Senha forte ✓
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  confirmPassword && password === confirmPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-purple-500'
                }`}
                placeholder="Digite a senha novamente"
                required
                maxLength={128}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">
                As senhas não coincidem
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || emailExists === true || checkingEmail || !passwordStrength.valid}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Criar conta</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Já tem uma conta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Faça login
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            📧 Você receberá um email de boas-vindas após o cadastro
          </p>
        </div>
      </div>
    </div>
  );
};