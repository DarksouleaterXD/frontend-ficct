const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  status: number;
}

export async function apiCall<T>(
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

    return {
      ...data,
      status: response.status,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      error: "Error de conexión con el servidor",
      status: 0,
    };
  }
}

// Función específica para login
export async function login(email: string, password: string) {
  return apiCall("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Función específica para logout
export async function logout() {
  return apiCall("/logout", {
    method: "POST",
  });
}
