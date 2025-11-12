export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiResponse<T = Record<string, unknown>> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function apiCall<T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  // Agregar token si existe
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Error de conexión con el servidor",
      message: "No se pudo conectar al servidor",
    };
  }
}

interface UserData {
  user: Record<string, unknown>;
  token: string;
  rol: string;
  is_admin: boolean;
  permisos: string[];
}

// Función específica para login
export async function login(email: string, password: string) {
  const response = await apiCall<UserData>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Si el login es exitoso, guardar el token y permisos
  if (response.success && response.data?.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    localStorage.setItem("rol", response.data.rol);
    localStorage.setItem("permisos", JSON.stringify(response.data.permisos || []));
  }

  return response;
}

// Función específica para logout
export async function logout() {
  const response = await apiCall("/logout", {
    method: "POST",
  });

  if (response.success) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    localStorage.removeItem("permisos");
  }

  return response;
}
