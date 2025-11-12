// Obtiene el rol del usuario desde localStorage
export function getRol(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("rol") || "";
  }
  return "";
}

// Obtiene los permisos del usuario desde localStorage
export function getPermisos(): string[] {
  if (typeof window !== "undefined") {
    const permisos = localStorage.getItem("permisos");
    return permisos ? JSON.parse(permisos) : [];
  }
  return [];
}

// Verifica si el usuario tiene un permiso específico
export function hasPermission(permission: string): boolean {
  const userRole = getRol();
  
  // Admin tiene todos los permisos
  if (userRole === "admin") return true;
  
  const permisos = getPermisos();
  return permisos.includes(permission);
}

// Verifica si el usuario tiene al menos uno de los permisos especificados
export function hasAnyPermission(permissions: string[]): boolean {
  const userRole = getRol();
  
  // Admin tiene todos los permisos
  if (userRole === "admin") return true;
  
  const permisos = getPermisos();
  return permissions.some(permission => permisos.includes(permission));
}

// Verifica si el usuario tiene todos los permisos especificados
export function hasAllPermissions(permissions: string[]): boolean {
  const userRole = getRol();
  
  // Admin tiene todos los permisos
  if (userRole === "admin") return true;
  
  const permisos = getPermisos();
  return permissions.every(permission => permisos.includes(permission));
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
