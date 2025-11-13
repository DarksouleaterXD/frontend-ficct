"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Users, Shield, Mail, User as UserIcon, Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  ci: string;
  correo: string;
  telefono?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  persona?: Persona;
  roles?: Rol[];
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

interface ResultadoValidacion {
  fila: number;
  datos: {
    ci: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    telefono: string;
    rol: string;
    fecha_nacimiento: string;
    password?: string;
  };
  valido: boolean;
  errores: string[];
}

interface EstadisticasImportacion {
  total: number;
  validos: number;
  errores: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedRolesRBAC, setSelectedRolesRBAC] = useState<number[]>([]);
  
  // Estados para importación
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validacionResultados, setValidacionResultados] = useState<ResultadoValidacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasImportacion | null>(null);
  const [filtroValidacion, setFiltroValidacion] = useState<"todos" | "validos" | "errores">("todos");
  const [importando, setImportando] = useState(false);
  const [pasoImportacion, setPasoImportacion] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Confirmación
  const [usuariosCreados, setUsuariosCreados] = useState<Array<{fila: number; usuario_id: number; email: string; password: string}>>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "docente",
    ci: "",
    apellido: "",
    telefono: "",
    activo: true,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Obtener listado de usuarios
  const fetchUsuarios = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/usuarios`);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al cargar usuarios");
      }

      const result: ApiResponse<Usuario[]> = await response.json();

      if (result.success) {
        setUsuarios(result.data);
        if (result.pagination) {
          setCurrentPage(result.pagination.current_page);
          setTotalPages(result.pagination.last_page);
        }
      } else {
        throw new Error(result.message || "Error al cargar usuarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Obtener roles disponibles
  const fetchRoles = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result: ApiResponse<Rol[]> = await response.json();
        if (result.success && result.data) {
          setRolesDisponibles(result.data);
        }
      }
    } catch (err) {
      console.error("Error cargando roles:", err);
    }
  }, [API_URL]);

  // Crear o actualizar usuario
  const handleSaveUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/usuarios/${editingId}` : `${API_URL}/usuarios`;

      const payload: any = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        activo: formData.activo,
      };

      // Solo incluir password si se proporciona
      if (formData.password) {
        payload.password = formData.password;
      }

      // Incluir datos de persona si se proporcionan
      if (formData.ci) {
        payload.ci = formData.ci;
        payload.apellido = formData.apellido;
        payload.telefono = formData.telefono;
      }

      // Incluir roles RBAC seleccionados
      if (selectedRolesRBAC.length > 0) {
        payload.roles_rbac = selectedRolesRBAC;
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar usuario");
      }

      setSuccess(editingId ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      setShowModal(false);
      setEditingId(null);
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "docente",
        ci: "",
        apellido: "",
        telefono: "",
        activo: true,
      });
      setSelectedRolesRBAC([]);

      setTimeout(() => {
        setSuccess(null);
        fetchUsuarios(editingId ? currentPage : 1, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUsuario = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este usuario?")) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar usuario");
      }

      setSuccess("Usuario eliminado correctamente");
      setTimeout(() => setSuccess(null), 3000);
      fetchUsuarios(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Editar usuario
  const handleEditUsuario = (usuario: Usuario) => {
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
      ci: usuario.persona?.ci || "",
      apellido: usuario.persona?.apellido || "",
      telefono: usuario.persona?.telefono || "",
      activo: usuario.activo,
    });
    setSelectedRolesRBAC(usuario.roles?.map(r => r.id) || []);
    setEditingId(usuario.id);
    setShowModal(true);
  };

  // Gestionar roles RBAC
  const handleManageRoles = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setSelectedRolesRBAC(usuario.roles?.map(r => r.id) || []);
    setShowRolesModal(true);
  };

  // Guardar roles RBAC
  const handleSaveRoles = async () => {
    if (!selectedUsuario) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/usuarios/${selectedUsuario.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles_rbac: selectedRolesRBAC,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar roles");
      }

      setSuccess("Roles actualizados correctamente");
      setShowRolesModal(false);
      setSelectedUsuario(null);
      
      setTimeout(() => {
        setSuccess(null);
        fetchUsuarios(currentPage, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // ============ FUNCIONES DE IMPORTACIÓN ============
  
  // Descargar plantilla
  const handleDescargarPlantilla = async (formato: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/usuarios/importar/plantilla?formato=${formato}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al descargar plantilla");
      }

      const blob = await response.blob();
      
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error("El archivo descargado está vacío");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_usuarios.${formato}`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setSuccess(`Plantilla ${formato.toUpperCase()} descargada exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar plantilla");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['xlsx', 'xls', 'csv'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        setError('Formato de archivo inválido. Use Excel (.xlsx, .xls) o CSV (.csv)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('El archivo es muy grande. Máximo 5MB');
        return;
      }
      
      setImportFile(file);
      setError(null);
    }
  };

  // Validar archivo
  const handleValidarArchivo = async () => {
    if (!importFile) {
      setError('Seleccione un archivo primero');
      return;
    }

    setImportando(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('archivo', importFile);

      const response = await fetch(`${API_URL}/usuarios/importar/validar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al validar archivo');
      }

      setValidacionResultados(data.data.resultados);
      setEstadisticas(data.data.estadisticas);
      setPasoImportacion(2);
      setSuccess('Archivo validado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar archivo');
    } finally {
      setImportando(false);
    }
  };

  // Confirmar importación
  const handleConfirmarImportacion = async () => {
    if (!importFile) return;

    console.log('🚀 Iniciando confirmación de importación...');
    setImportando(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('archivo', importFile);
      formData.append('generar_passwords', '1');
      formData.append('enviar_emails', '0');

      console.log('📤 Enviando archivo al backend...');
      const response = await fetch(`${API_URL}/usuarios/importar/confirmar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error al importar usuarios');
      }

      console.log('✅ Usuarios creados:', data.data.usuarios_creados);
      setUsuariosCreados(data.data.usuarios_creados || []);
      setSuccess(`${data.data.estadisticas.usuarios_creados} usuario(s) importado(s) exitosamente`);
      setPasoImportacion(3);
      
      // Recargar lista de usuarios INMEDIATAMENTE
      console.log('🔄 Recargando lista de usuarios...');
      await fetchUsuarios(1, '');
      console.log('✅ Lista recargada');
      
      // Cerrar modal después de 5 segundos
      setTimeout(() => {
        handleCerrarModalImportacion();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar usuarios');
    } finally {
      setImportando(false);
    }
  };

  // Cerrar modal de importación
  const handleCerrarModalImportacion = () => {
    setShowImportModal(false);
    setImportFile(null);
    setValidacionResultados([]);
    setEstadisticas(null);
    setPasoImportacion(1);
    setFiltroValidacion('todos');
    setUsuariosCreados([]);
    setError(null);
    setSuccess(null);
  };

  // Filtrar resultados de validación
  const resultadosFiltrados = validacionResultados.filter(r => {
    if (filtroValidacion === 'validos') return r.valido;
    if (filtroValidacion === 'errores') return !r.valido;
    return true;
  });

  // ============ FIN FUNCIONES DE IMPORTACIÓN ============

  // Búsqueda en tiempo real
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchUsuarios(1, value);
  };

  // Cargar datos inicialmente
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchUsuarios();
      fetchRoles();
    }
  }, [fetchUsuarios, fetchRoles]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0, marginBottom: "0.5rem" }}>
            Gestionar Usuarios
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Administra usuarios del sistema y asigna roles
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
          >
            <Upload size={18} />
            Importar Usuarios
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                nombre: "",
                email: "",
                password: "",
                rol: "docente",
                ci: "",
                apellido: "",
                telefono: "",
                activo: true,
              });
              setSelectedRolesRBAC([]);
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", borderLeft: "4px solid #ef4444", borderRadius: "0.375rem" }}>
          <p style={{ color: "#991b1b", margin: 0, fontSize: "14px" }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{ padding: "1rem", backgroundColor: "#d1fae5", borderLeft: "4px solid #10b981", borderRadius: "0.375rem" }}>
          <p style={{ color: "#065f46", margin: 0, fontSize: "14px" }}>{success}</p>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div style={{ position: "relative" }}>
        <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o CI..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 3rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tabla de usuarios */}
      <div style={{ backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <tr>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Usuario
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Email
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Rol Sistema
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Roles RBAC
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Estado
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                  Cargando...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UserIcon size={20} style={{ color: "#4f46e5" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "500", color: "#1f2937", fontSize: "14px" }}>{usuario.nombre}</div>
                        {usuario.persona && (
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            CI: {usuario.persona.ci}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Mail size={16} style={{ color: "#6b7280" }} />
                      <span style={{ fontSize: "14px", color: "#374151" }}>{usuario.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: usuario.rol === "admin" ? "#dbeafe" : usuario.rol === "coordinador" ? "#fef3c7" : usuario.rol === "autoridad" ? "#e0e7ff" : "#fce7f3",
                      color: usuario.rol === "admin" ? "#1e40af" : usuario.rol === "coordinador" ? "#92400e" : usuario.rol === "autoridad" ? "#4338ca" : "#9f1239",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {usuario.roles && usuario.roles.length > 0 ? (
                        usuario.roles.map(rol => (
                          <span key={rol.id} style={{
                            padding: "0.125rem 0.5rem",
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            borderRadius: "0.25rem",
                            fontSize: "11px",
                            border: "1px solid #d1d5db",
                          }}>
                            {rol.nombre}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: usuario.activo ? "#d1fae5" : "#fee2e2",
                      color: usuario.activo ? "#065f46" : "#991b1b",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button
                        onClick={() => handleManageRoles(usuario)}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Gestionar roles"
                      >
                        <Shield size={16} style={{ color: "#4b5563" }} />
                      </button>
                      <button
                        onClick={() => handleEditUsuario(usuario)}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#dbeafe",
                          border: "1px solid #93c5fd",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Editar"
                      >
                        <Edit2 size={16} style={{ color: "#1e40af" }} />
                      </button>
                      <button
                        onClick={() => handleDeleteUsuario(usuario.id)}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#fee2e2",
                          border: "1px solid #fca5a5",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} style={{ color: "#991b1b" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ padding: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchUsuarios(page, searchTerm)}
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: currentPage === page ? "#3b82f6" : "#f3f4f6",
                  color: currentPage === page ? "white" : "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar usuario */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "2rem",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <Users size={24} style={{ color: "#3b82f6" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                {editingId ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h2>
            </div>

            <form onSubmit={handleSaveUsuario} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Nombre */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del usuario"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Contraseña {!editingId && "*"}
                  {editingId && <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "normal" }}> (dejar en blanco para mantener)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required={!editingId}
                  minLength={8}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Rol del sistema */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Rol del Sistema *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="admin">Administrador</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="autoridad">Autoridad</option>
                  <option value="docente">Docente</option>
                </select>
              </div>

              {/* Datos de Persona (opcional) */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "1rem" }}>
                  Datos Adicionales (Opcional)
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                      CI
                    </label>
                    <input
                      type="text"
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                      placeholder="Carnet de identidad"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.375rem",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      placeholder="Apellido"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.375rem",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Número de teléfono"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Roles RBAC */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Roles RBAC ({selectedRolesRBAC.length} seleccionados)
                </label>
                <div style={{ 
                  border: "1px solid #d1d5db", 
                  borderRadius: "0.375rem", 
                  maxHeight: "150px", 
                  overflowY: "auto",
                  padding: "0.75rem"
                }}>
                  {rolesDisponibles.map((rol) => (
                    <label 
                      key={rol.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem", 
                        cursor: "pointer",
                        padding: "0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: selectedRolesRBAC.includes(rol.id) ? "#eff6ff" : "transparent"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRolesRBAC.includes(rol.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRolesRBAC([...selectedRolesRBAC, rol.id]);
                          } else {
                            setSelectedRolesRBAC(selectedRolesRBAC.filter(id => id !== rol.id));
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}>{rol.nombre}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{rol.descripcion}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Usuario activo</span>
                </label>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({
                      nombre: "",
                      email: "",
                      password: "",
                      rol: "docente",
                      ci: "",
                      apellido: "",
                      telefono: "",
                      activo: true,
                    });
                    setSelectedRolesRBAC([]);
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gestionar roles RBAC */}
      {showRolesModal && selectedUsuario && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRolesModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "70vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <Shield size={24} style={{ color: "#3b82f6" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                Gestionar Roles
              </h2>
            </div>

            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1.5rem" }}>
              Usuario: <strong>{selectedUsuario.nombre}</strong> ({selectedUsuario.email})
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Roles RBAC ({selectedRolesRBAC.length} seleccionados)
              </label>
              <div style={{ 
                border: "1px solid #d1d5db", 
                borderRadius: "0.375rem", 
                maxHeight: "300px", 
                overflowY: "auto",
                padding: "0.75rem"
              }}>
                {rolesDisponibles.map((rol) => (
                  <label 
                    key={rol.id} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem", 
                      cursor: "pointer",
                      padding: "0.75rem",
                      borderRadius: "0.375rem",
                      marginBottom: "0.5rem",
                      backgroundColor: selectedRolesRBAC.includes(rol.id) ? "#eff6ff" : "#f9fafb",
                      border: selectedRolesRBAC.includes(rol.id) ? "1px solid #3b82f6" : "1px solid #e5e7eb"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRolesRBAC.includes(rol.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolesRBAC([...selectedRolesRBAC, rol.id]);
                        } else {
                          setSelectedRolesRBAC(selectedRolesRBAC.filter(id => id !== rol.id));
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{rol.nombre}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{rol.descripcion}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowRolesModal(false);
                  setSelectedUsuario(null);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación de Usuarios */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={handleCerrarModalImportacion}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: pasoImportacion === 2 ? "1000px" : "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Upload size={24} style={{ color: "#10b981" }} />
                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                  Importar Usuarios en Lote
                </h2>
              </div>
              <button
                onClick={handleCerrarModalImportacion}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0",
                }}
              >
                ×
              </button>
            </div>

            {/* Paso 1: Descarga y Upload */}
            {pasoImportacion === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem", padding: "1rem" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e40af", margin: "0 0 0.5rem 0" }}>
                    📋 Instrucciones
                  </h3>
                  <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "#1e40af", fontSize: "13px", lineHeight: "1.6" }}>
                    <li>Descarga la plantilla en formato Excel o CSV</li>
                    <li>Completa los datos de los usuarios (CI, nombre, email, rol, etc.)</li>
                    <li>Sube el archivo completado para validar</li>
                    <li>Revisa los resultados y confirma la importación</li>
                  </ol>
                </div>

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "1rem" }}>
                    Paso 1: Descargar Plantilla
                  </h3>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleDescargarPlantilla('xlsx')}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        backgroundColor: loading ? "#9ca3af" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        flex: 1,
                        justifyContent: "center",
                      }}
                    >
                      <FileSpreadsheet size={18} />
                      {loading ? "Descargando..." : "Descargar Excel (.xlsx)"}
                    </button>
                    <button
                      onClick={() => handleDescargarPlantilla('csv')}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        backgroundColor: loading ? "#9ca3af" : "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        flex: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Download size={18} />
                      {loading ? "Descargando..." : "Descargar CSV (.csv)"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "1rem" }}>
                    Paso 2: Subir Archivo Completado
                  </h3>
                  <div
                    style={{
                      border: "2px dashed #d1d5db",
                      borderRadius: "0.5rem",
                      padding: "2rem",
                      textAlign: "center",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      style={{
                        display: "inline-block",
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Seleccionar Archivo
                    </label>
                    {importFile && (
                      <div style={{ marginTop: "1rem", color: "#374151", fontSize: "14px" }}>
                        ✓ Archivo seleccionado: <strong>{importFile.name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleCerrarModalImportacion}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#e5e7eb",
                      color: "#374151",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleValidarArchivo}
                    disabled={!importFile || importando}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: !importFile || importando ? "#9ca3af" : "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: !importFile || importando ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {importando ? "Validando..." : "Validar Archivo"}
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Preview de Validación */}
            {pasoImportacion === 2 && estadisticas && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1, backgroundColor: "#dbeafe", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #3b82f6" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e40af" }}>{estadisticas.total}</div>
                    <div style={{ fontSize: "12px", color: "#1e40af" }}>Total Filas</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#d1fae5", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #10b981" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#065f46" }}>{estadisticas.validos}</div>
                    <div style={{ fontSize: "12px", color: "#065f46" }}>Válidas</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#fee2e2", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #ef4444" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#991b1b" }}>{estadisticas.errores}</div>
                    <div style={{ fontSize: "12px", color: "#991b1b" }}>Con Errores</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e5e7eb" }}>
                  <button
                    onClick={() => setFiltroValidacion('todos')}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: filtroValidacion === 'todos' ? "#3b82f6" : "transparent",
                      color: filtroValidacion === 'todos' ? "white" : "#6b7280",
                      border: "none",
                      borderBottom: filtroValidacion === 'todos' ? "2px solid #3b82f6" : "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Todos ({estadisticas.total})
                  </button>
                  <button
                    onClick={() => setFiltroValidacion('validos')}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: filtroValidacion === 'validos' ? "#10b981" : "transparent",
                      color: filtroValidacion === 'validos' ? "white" : "#6b7280",
                      border: "none",
                      borderBottom: filtroValidacion === 'validos' ? "2px solid #10b981" : "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    ✓ Válidos ({estadisticas.validos})
                  </button>
                  <button
                    onClick={() => setFiltroValidacion('errores')}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: filtroValidacion === 'errores' ? "#ef4444" : "transparent",
                      color: filtroValidacion === 'errores' ? "white" : "#6b7280",
                      border: "none",
                      borderBottom: filtroValidacion === 'errores' ? "2px solid #ef4444" : "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    ✗ Errores ({estadisticas.errores})
                  </button>
                </div>

                <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead style={{ backgroundColor: "#f9fafb", position: "sticky", top: 0 }}>
                      <tr>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Fila</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>CI</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Nombre</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Email</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Rol</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Password</th>
                        <th style={{ padding: "0.75rem", textAlign: "center", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosFiltrados.map((resultado) => (
                        <tr key={resultado.fila} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.75rem" }}>{resultado.fila}</td>
                          <td style={{ padding: "0.75rem" }}>{resultado.datos.ci}</td>
                          <td style={{ padding: "0.75rem" }}>{resultado.datos.nombre} {resultado.datos.apellido_paterno}</td>
                          <td style={{ padding: "0.75rem", fontSize: "12px" }}>{resultado.datos.email}</td>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "11px",
                              backgroundColor: resultado.datos.rol === 'admin' ? '#dbeafe' : resultado.datos.rol === 'coordinador' ? '#fef3c7' : '#ddd6fe',
                              color: resultado.datos.rol === 'admin' ? '#1e40af' : resultado.datos.rol === 'coordinador' ? '#92400e' : '#5b21b6',
                            }}>
                              {resultado.datos.rol}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                            {resultado.datos.password || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Se generará</span>}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            {resultado.valido ? (
                              <CheckCircle size={20} style={{ color: "#10b981" }} />
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                                <XCircle size={20} style={{ color: "#ef4444" }} />
                                <div style={{ fontSize: "11px", color: "#ef4444", maxWidth: "200px" }}>
                                  {resultado.errores.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      setPasoImportacion(1);
                      setValidacionResultados([]);
                      setEstadisticas(null);
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#e5e7eb",
                      color: "#374151",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    ← Volver
                  </button>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      onClick={handleCerrarModalImportacion}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarImportacion}
                      disabled={estadisticas.validos === 0 || importando}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: estadisticas.validos === 0 || importando ? "#9ca3af" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: estadisticas.validos === 0 || importando ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {importando ? "Importando..." : `Confirmar Importación (${estadisticas.validos} usuarios)`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Confirmación */}
            {pasoImportacion === 3 && (
              <div style={{ padding: "1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <CheckCircle size={64} style={{ color: "#10b981", margin: "0 auto 1rem" }} />
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                    ¡Importación Exitosa!
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "15px" }}>
                    {usuariosCreados.length} usuario(s) creado(s) correctamente en el sistema
                  </p>
                </div>

                {/* Resumen de la importación */}
                {estadisticas && (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "1rem", 
                    marginBottom: "1.5rem" 
                  }}>
                    <div style={{ 
                      backgroundColor: "#dbeafe", 
                      padding: "1rem", 
                      borderRadius: "0.5rem", 
                      textAlign: "center" 
                    }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e40af" }}>
                        {estadisticas.total}
                      </div>
                      <div style={{ fontSize: "12px", color: "#1e40af", marginTop: "0.25rem" }}>
                        Total Procesados
                      </div>
                    </div>
                    <div style={{ 
                      backgroundColor: "#d1fae5", 
                      padding: "1rem", 
                      borderRadius: "0.5rem", 
                      textAlign: "center" 
                    }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#059669" }}>
                        {usuariosCreados.length}
                      </div>
                      <div style={{ fontSize: "12px", color: "#059669", marginTop: "0.25rem" }}>
                        Usuarios Creados
                      </div>
                    </div>
                    <div style={{ 
                      backgroundColor: estadisticas.errores > 0 ? "#fee2e2" : "#f3f4f6", 
                      padding: "1rem", 
                      borderRadius: "0.5rem", 
                      textAlign: "center" 
                    }}>
                      <div style={{ 
                        fontSize: "24px", 
                        fontWeight: "bold", 
                        color: estadisticas.errores > 0 ? "#dc2626" : "#6b7280" 
                      }}>
                        {estadisticas.errores}
                      </div>
                      <div style={{ 
                        fontSize: "12px", 
                        color: estadisticas.errores > 0 ? "#dc2626" : "#6b7280", 
                        marginTop: "0.25rem" 
                      }}>
                        Con Errores
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabla detallada de usuarios creados */}
                {usuariosCreados.length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "1rem" 
                    }}>
                      <h4 style={{ 
                        fontSize: "16px", 
                        fontWeight: "600", 
                        color: "#374151", 
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <Users size={20} style={{ color: "#10b981" }} />
                        Usuarios Creados Exitosamente
                      </h4>
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#059669",
                        backgroundColor: "#d1fae5",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontWeight: "600"
                      }}>
                        {usuariosCreados.length} usuarios
                      </div>
                    </div>
                    
                    <div style={{ 
                      maxHeight: "350px", 
                      overflowY: "auto", 
                      border: "2px solid #10b981", 
                      borderRadius: "0.75rem", 
                      backgroundColor: "white",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ 
                          backgroundColor: "#059669", 
                          color: "white", 
                          position: "sticky", 
                          top: 0,
                          zIndex: 10
                        }}>
                          <tr>
                            <th style={{ padding: "1rem 0.75rem", textAlign: "left", fontWeight: "600" }}>#</th>
                            <th style={{ padding: "1rem 0.75rem", textAlign: "left", fontWeight: "600" }}>Usuario</th>
                            <th style={{ padding: "1rem 0.75rem", textAlign: "left", fontWeight: "600" }}>Email</th>
                            <th style={{ padding: "1rem 0.75rem", textAlign: "left", fontWeight: "600" }}>Contraseña</th>
                            <th style={{ padding: "1rem 0.75rem", textAlign: "center", fontWeight: "600" }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuariosCreados.map((usuario, index) => {
                            // Buscar datos adicionales del resultado de validación
                            const datosCompletos = validacionResultados.find(r => r.fila === usuario.fila);
                            
                            return (
                              <tr 
                                key={usuario.fila} 
                                style={{ 
                                  borderBottom: "1px solid #e5e7eb",
                                  backgroundColor: index % 2 === 0 ? "#f9fafb" : "white",
                                  transition: "background-color 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9fafb" : "white"}
                              >
                                <td style={{ padding: "0.75rem", fontWeight: "600", color: "#6b7280" }}>
                                  {usuario.fila}
                                </td>
                                <td style={{ padding: "0.75rem" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                                    <div style={{ fontWeight: "600", color: "#111827" }}>
                                      {datosCompletos?.datos.nombre} {datosCompletos?.datos.apellido_paterno}
                                    </div>
                                    {datosCompletos?.datos.ci && (
                                      <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                        CI: {datosCompletos.datos.ci}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem" }}>
                                  <div style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "0.5rem",
                                    color: "#374151"
                                  }}>
                                    <Mail size={14} style={{ color: "#6b7280" }} />
                                    <span style={{ fontSize: "12px" }}>{usuario.email}</span>
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem" }}>
                                  <div style={{ 
                                    fontFamily: "monospace", 
                                    fontSize: "13px", 
                                    fontWeight: "700", 
                                    color: "#059669",
                                    backgroundColor: "#d1fae5",
                                    padding: "0.375rem 0.625rem",
                                    borderRadius: "0.375rem",
                                    display: "inline-block",
                                    letterSpacing: "0.025em"
                                  }}>
                                    {usuario.password}
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                  <div style={{ 
                                    display: "inline-flex", 
                                    alignItems: "center", 
                                    gap: "0.375rem",
                                    backgroundColor: "#d1fae5",
                                    color: "#059669",
                                    padding: "0.375rem 0.75rem",
                                    borderRadius: "9999px",
                                    fontSize: "11px",
                                    fontWeight: "600"
                                  }}>
                                    <CheckCircle size={14} />
                                    Creado
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: "#fef2f2", 
                      border: "1px solid #fecaca",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      marginTop: "1rem",
                      display: "flex",
                      alignItems: "start",
                      gap: "0.75rem"
                    }}>
                      <div style={{ 
                        color: "#dc2626",
                        fontSize: "20px",
                        flexShrink: 0
                      }}>
                        ⚠️
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: "13px", 
                          color: "#991b1b", 
                          fontWeight: "600",
                          marginBottom: "0.25rem"
                        }}>
                          Importante: Guarde estas credenciales
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#dc2626",
                          lineHeight: "1.5"
                        }}>
                          Las contraseñas generadas no se podrán recuperar. Asegúrese de copiarlas y enviarlas a los usuarios correspondientes antes de cerrar esta ventana.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div style={{ 
                  display: "flex", 
                  gap: "1rem", 
                  justifyContent: "center",
                  paddingTop: "0.5rem"
                }}>
                  <button
                    onClick={() => {
                      // Copiar todas las credenciales al portapapeles
                      const credenciales = usuariosCreados.map(u => 
                        `${u.email} | ${u.password}`
                      ).join('\n');
                      navigator.clipboard.writeText(credenciales);
                      setSuccess('Credenciales copiadas al portapapeles');
                      setTimeout(() => setSuccess(null), 3000);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#047857"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#059669"}
                  >
                    📋 Copiar Credenciales
                  </button>
                  <button
                    onClick={handleCerrarModalImportacion}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 2rem",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
                  >
                    ✓ Cerrar y Finalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
