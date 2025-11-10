"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Users, Shield, Key, Mail, User as UserIcon } from "lucide-react";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedRolesRBAC, setSelectedRolesRBAC] = useState<number[]>([]);
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
    </div>
  );
}
