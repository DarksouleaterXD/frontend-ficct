"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Shield } from "lucide-react";

interface Permiso {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos?: Permiso[];
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  data: Rol[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
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

      if (!response.ok) throw new Error("Error al cargar roles");

      const data: PaginatedResponse = await response.json();
      setRoles(data.data);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Obtener permisos disponibles
  const fetchPermisos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/permisos?all=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermisos(data.data || []);
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
          permiso_ids: selectedPermisos,
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
  const handleDeleteRol = async (id: number) => {
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

      if (!response.ok) throw new Error("Error al eliminar rol");

      setSuccess("Rol eliminado correctamente");
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
                    {rol.nombre}
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
                            {p.nombre}
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
                        onClick={() => handleDeleteRol(rol.id)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#ef4444",
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
                  Permisos
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                  {permisos.map((permiso) => (
                    <label key={permiso.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
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
                      <span style={{ fontSize: "14px", color: "#374151" }}>
                        {permiso.nombre}
                      </span>
                    </label>
                  ))}
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
