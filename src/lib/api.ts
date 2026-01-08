import type { Embarcadora, Transportadora, User, CreateUserForm } from "@/types";

const BASE_URL = "https://n8n.srv1251718.hstgr.cloud/webhook";

export const API_ENDPOINTS = {
  login: `${BASE_URL}/login`,
  verify2FA: `${BASE_URL}/v2f`,
  signup: `${BASE_URL}/singup`,
  embarcadoras: `${BASE_URL}/embarcadoras`,
  usuarios: `${BASE_URL}/usuarios`,
  transportadoras: `${BASE_URL}/transportadoras`,
} as const;

// Decodifica JWT para extrair dados do usuário
function decodeJWT(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    
    return {
      id: payload.id,
      email: payload.email,
      nome: payload.nome,
      tipo: payload.role,
      imagemUrl: payload.imagemUrl,
    };
  } catch {
    return null;
  }
}

// Helper para fazer requests autenticadas
const authFetch = async <T>(
  url: string,
  token: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.output || error.message || "Erro na requisição");
  }

  return response.json();
};

// Login - Passo 1
export const loginCredentials = async (
  email: string,
  senha: string
): Promise<{ success: boolean; output?: string }> => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
  });

  const data = await response.json();
  return { success: response.ok, output: data.output };
};

// Verificar 2FA - Passo 2
export const verify2FA = async (
  email: string,
  code: number
): Promise<{ success: boolean; token?: string; user?: User; output?: string }> => {
  const response = await fetch(API_ENDPOINTS.verify2FA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), code }),
  });

  const data = await response.json();
  
  if (response.ok && data.jwttoken) {
    const user = decodeJWT(data.jwttoken);
    return {
      success: true,
      token: data.jwttoken,
      user: user || undefined,
      output: data.output,
    };
  }
  
  return { success: false, output: data.output };
};

// Criar usuário (Admin only)
export const createUser = async (
  userData: CreateUserForm
): Promise<{ success: boolean; output?: string }> => {
  const response = await fetch(API_ENDPOINTS.signup, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  return { success: response.ok, output: data.output };
};

// GET APIs (protegidas por JWT)
export const getEmbarcadoras = async (
  token: string,
  id?: number
): Promise<Embarcadora[]> => {
  const url = id
    ? `${API_ENDPOINTS.embarcadoras}?id=${id}`
    : API_ENDPOINTS.embarcadoras;
  return authFetch<Embarcadora[]>(url, token);
};

export const getUsuarios = async (
  token: string,
  id?: number
): Promise<User[]> => {
  const url = id
    ? `${API_ENDPOINTS.usuarios}?id=${id}`
    : API_ENDPOINTS.usuarios;
  return authFetch<User[]>(url, token);
};

export const getTransportadoras = async (
  token: string,
  id?: number
): Promise<Transportadora[]> => {
  const url = id
    ? `${API_ENDPOINTS.transportadoras}?id=${id}`
    : API_ENDPOINTS.transportadoras;
  return authFetch<Transportadora[]>(url, token);
};
