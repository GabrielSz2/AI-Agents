import bcrypt from 'bcryptjs';

/**
 * Utilitários de autenticação e segurança
 */

// Configurações de segurança
const SALT_ROUNDS = 12;
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas em ms
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

export interface SessionData {
  userId: number;
  email: string;
  isAdmin: boolean;
  loginTime: number;
  lastActivity: number;
  sessionToken: string;
}

/**
 * Gera hash seguro da senha
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Erro ao gerar hash da senha:', error);
    throw new Error('Erro interno de segurança');
  }
};

/**
 * Verifica senha contra hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};

/**
 * Gera token de sessão seguro
 */
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Valida se a sessão ainda é válida
 */
export const isSessionValid = (sessionData: SessionData): boolean => {
  const now = Date.now();
  const timeSinceLogin = now - sessionData.loginTime;
  const timeSinceActivity = now - sessionData.lastActivity;
  
  // Sessão expira após 24h ou 2h de inatividade
  return timeSinceLogin < SESSION_TIMEOUT && timeSinceActivity < (2 * 60 * 60 * 1000);
};

/**
 * Atualiza última atividade da sessão
 */
export const updateSessionActivity = (sessionData: SessionData): SessionData => {
  return {
    ...sessionData,
    lastActivity: Date.now()
  };
};

/**
 * Sanitiza entrada de dados
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres HTML básicos
    .substring(0, 1000); // Limita tamanho
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Valida força da senha
 */
export const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' };
  }
  
  return { valid: true };
};

/**
 * Rate limiting simples para tentativas de login
 */
class LoginAttemptTracker {
  private attempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();

  canAttemptLogin(email: string): boolean {
    const record = this.attempts.get(email);
    if (!record) return true;

    const now = Date.now();
    
    // Se está bloqueado, verifica se o tempo passou
    if (record.lockedUntil && now < record.lockedUntil) {
      return false;
    }

    // Se passou do tempo de bloqueio, reseta
    if (record.lockedUntil && now >= record.lockedUntil) {
      this.attempts.delete(email);
      return true;
    }

    return record.count < MAX_LOGIN_ATTEMPTS;
  }

  recordFailedAttempt(email: string): void {
    const now = Date.now();
    const record = this.attempts.get(email) || { count: 0, lastAttempt: now };
    
    record.count++;
    record.lastAttempt = now;
    
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_TIME;
    }
    
    this.attempts.set(email, record);
  }

  recordSuccessfulLogin(email: string): void {
    this.attempts.delete(email);
  }

  getTimeUntilUnlock(email: string): number {
    const record = this.attempts.get(email);
    if (!record?.lockedUntil) return 0;
    
    const timeLeft = record.lockedUntil - Date.now();
    return Math.max(0, timeLeft);
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();