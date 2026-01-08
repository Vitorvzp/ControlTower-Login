// User types
export interface User {
  id: number;
  nome?: string;
  email: string;
  tipo: number; // 1 = admin, 2 = user, etc.
  empresaId?: number;
  transportadoraId?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

// API Response types
export interface Embarcadora {
  id: number;
  nome: string;
  email?: string;
  cnpj?: string;
  [key: string]: unknown;
}

export interface Transportadora {
  id: number;
  nome: string;
  email?: string;
  cnpj?: string;
  [key: string]: unknown;
}

// Form types
export interface CreateUserForm {
  email: string;
  senha: string;
  cargo: number;
}

// API Error
export interface ApiError {
  output?: string;
  message?: string;
}
