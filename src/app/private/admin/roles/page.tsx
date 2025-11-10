"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Shield } from "lucide-react";

interface Modulo {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Accion {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Permiso {
  id: number;
  accion?: string;
  descripcion?: string;
  modulo?: Modulo;
  accion_obj?: Accion;
  id_modulo?: number;
  id_accion?: number;
}

interface PermisoAgrupado {
  modulo: string;
  permisos: Array<{
    id: number;
    accion: string;
    descripcion: string;
  }>;
}

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  es_sistema: boolean;
  activo: boolean;
  permisos?: Array<{
    id: number;
    modulo: Modulo;
    accion: Accion;
  }>;
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

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisosAgrupados, setPermisosAgrupados] = useState<PermisoAgrupado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Obtener listado de roles
  const fetchRoles = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/roles`);
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
        console.error("Error HTTP al cargar roles:", response.status, errorData);
        throw new Error(errorData?.message || "Error al cargar roles");
      }

      const result: ApiResponse<Rol[]> = await response.json();
      console.log("Roles recibidos del backend:", result);
      
      if (result.success) {
        setRoles(result.data);
        console.log("Roles configurados:", result.data);
        if (result.pagination) {
          setCurrentPage(result.pagination.current_page);
          setTotalPages(result.pagination.last_page);
        }
      } else {
        throw new Error(result.message || "Error al cargar roles");
      }
    } catch (err) {
      console.error("Error completo:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Obtener permisos disponibles
  const fetchPermisos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/permisos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result: ApiResponse<PermisoAgrupado[]> = await response.json();
        console.log("Permisos recibidos del backend:", result);
        
        if (result.success && result.data) {
          setPermisosAgrupados(result.data);
          console.log("Permisos agrupados configurados:", result.data);
        } else {
          console.error("Error en respuesta de permisos:", result.message);
        }
      } else {
        console.error("Error HTTP al cargar permisos:", response.status, response.statusText);
        const errorData = await response.json().catch(() => null);
        console.error("Detalle del error:", errorData);
      }
    } catch (err) {
      console.error("Error cargando permisos:", err);
    }
  }, [API_URL]);

  // Crear o actualizar rol
  const handleSaveRol = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.nombre || !formData.descripcion) {
        throw new Error("Campos obligatorios incompletos");
      }

      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/roles/${editingId}` : `${API_URL}/roles`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          permisos: selectedPermisos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar rol");
      }

      setSuccess(editingId ? "Rol actualizado correctamente" : "Rol creado correctamente");
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: "", descripcion: "" });
      setSelectedPermisos([]);
      
      setTimeout(() => {
        setSuccess(null);
        fetchRoles(editingId ? currentPage : 1, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar rol
  const handleDeleteRol = async (id: number, esRolSistema: boolean) => {
    if (esRolSistema) {
      setError("No se puede eliminar un rol del sistema");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm("¿Está seguro de que desea eliminar este rol?")) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar rol");
      }

      setSuccess("Rol eliminado correctamente");
      setTimeout(() => setSuccess(null), 3000);
      fetchRoles(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Editar rol
  const handleEditRol = (rol: Rol) => {
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
    });
    setSelectedPermisos(rol.permisos?.map(p => p.id) || []);
    setEditingId(rol.id);
    setShowModal(true);
  };

  // Búsqueda en tiempo real
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchRoles(1, value);
  };

  // Cargar datos inicialmente
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchRoles();
      fetchPermisos();
    }
  }, [fetchRoles, fetchPermisos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0, marginBottom: "0.5rem" }}>
            Gestionar Roles
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Define roles y sus permisos en el sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: "", descripcion: "" });
            setSelectedPermisos([]);
            setShowModal(true);
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={18} />
          Nuevo Rol
        </button>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "0.375rem", fontSize: "14px" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "0.375rem", fontSize: "14px" }}>
          {success}
        </div>
      )}

      {/* Búsqueda */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "white", padding: "1rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Search size={20} style={{ color: "#9ca3af" }} />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Buscar por nombre..."
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            fontSize: "14px",
          }}
        />
      </div>

      {/* Tabla de Roles */}
      <div style={{ backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Nombre</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Descripción</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Permisos</th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !roles.length ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  Cargando...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  No hay roles registrados
                </td>
              </tr>
            ) : (
              roles.map((rol) => (
                <tr key={rol.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {rol.nombre}
                      {rol.es_sistema && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            borderRadius: "0.375rem",
                            fontSize: "10px",
                            fontWeight: "600",
                          }}
                        >
                          SISTEMA
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280" }}>
                    {rol.descripcion}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280" }}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {rol.permisos && rol.permisos.length > 0 ? (
                        rol.permisos.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              backgroundColor: "#dbeafe",
                              color: "#0c4a6e",
                              borderRadius: "0.375rem",
                              fontSize: "12px",
                            }}
                          >
                            {p.modulo.nombre} - {p.accion.nombre}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Sin permisos</span>
                      )}
                      {rol.permisos && rol.permisos.length > 3 && (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                          +{rol.permisos.length - 3} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "14px" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditRol(rol)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRol(rol.id, rol.es_sistema)}
                        disabled={rol.es_sistema}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: rol.es_sistema ? "#9ca3af" : "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: rol.es_sistema ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          opacity: rol.es_sistema ? 0.5 : 1,
                        }}
                        title={rol.es_sistema ? "No se puede eliminar un rol del sistema" : ""}
                      >
                        <Trash2 size={14} />
                        Eliminar
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
                onClick={() => fetchRoles(page, searchTerm)}
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

      {/* Modal crear/editar rol */}
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
              <Shield size={24} style={{ color: "#3b82f6" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                {editingId ? "Editar Rol" : "Crear Nuevo Rol"}
              </h2>
            </div>

            <form onSubmit={handleSaveRol} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Nombre */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Coordinador"
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

              {/* Descripción */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="ej. Responsable de coordinar materias y horarios"
                  required
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Permisos */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Permisos ({selectedPermisos.length} seleccionados)
                </label>
                <div style={{ 
                  border: "1px solid #d1d5db", 
                  borderRadius: "0.375rem", 
                  maxHeight: "300px", 
                  overflowY: "auto",
                  padding: "0.75rem"
                }}>
                  {permisosAgrupados.map((grupo) => (
                    <div key={grupo.modulo} style={{ marginBottom: "1rem" }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid #e5e7eb"
                      }}>
                        <Shield size={16} style={{ color: "#3b82f6" }} />
                        <span style={{ 
                          fontSize: "13px", 
                          fontWeight: "600", 
                          color: "#1f2937",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          {grupo.modulo}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const permisosIds = grupo.permisos.map(p => p.id);
                            const todosMarcados = permisosIds.every(id => selectedPermisos.includes(id));
                            if (todosMarcados) {
                              setSelectedPermisos(selectedPermisos.filter(id => !permisosIds.includes(id)));
                            } else {
                              setSelectedPermisos([...new Set([...selectedPermisos, ...permisosIds])]);
                            }
                          }}
                          style={{
                            marginLeft: "auto",
                            padding: "0.25rem 0.5rem",
                            fontSize: "11px",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            color: "#374151"
                          }}
                        >
                          {grupo.permisos.every(p => selectedPermisos.includes(p.id)) ? "Desmarcar todo" : "Marcar todo"}
                        </button>
                      </div>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(2, 1fr)", 
                        gap: "0.5rem",
                        paddingLeft: "1.5rem"
                      }}>
                        {grupo.permisos.map((permiso) => (
                          <label 
                            key={permiso.id} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.5rem", 
                              cursor: "pointer",
                              padding: "0.25rem",
                              borderRadius: "0.25rem",
                              backgroundColor: selectedPermisos.includes(permiso.id) ? "#eff6ff" : "transparent"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermisos.includes(permiso.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermisos([...selectedPermisos, permiso.id]);
                                } else {
                                  setSelectedPermisos(selectedPermisos.filter(id => id !== permiso.id));
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "13px", color: "#374151" }}>
                              {permiso.accion}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {permisosAgrupados.length === 0 && (
                    <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px", padding: "1rem" }}>
                      No hay permisos disponibles
                    </p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({ nombre: "", descripcion: "" });
                    setSelectedPermisos([]);
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#e5e7eb",
                    color: "#1f2937",
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
                  {editingId ? "Actualizar" : "Crear"} Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
