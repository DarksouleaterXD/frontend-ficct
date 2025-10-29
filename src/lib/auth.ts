// Obtiene el rol del usuario desde localStorage
export function getRol(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("rol") || "";
  }
  return "";
}

// Verifica si el usuario es admin
export function isAdmin(): boolean {
  return getRol() === "admin";
}

// Verifica si el usuario es coordinador
export function isCoordinador(): boolean {
  return getRol() === "coordinador";
}

// Verifica si el usuario es autoridad
export function isAutoridad(): boolean {
  return getRol() === "autoridad";
}

// Verifica si el usuario es docente
export function isDocente(): boolean {
  return getRol() === "docente";
}

// Verifica si el usuario puede acceder según su rol
export function canAccess(requiredRole: string | string[]): boolean {
  const userRole = getRol();
  
  // Admin puede acceder a todo
  if (userRole === "admin") return true;
  
  // Si es un array, verificar si el rol está en la lista
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}
