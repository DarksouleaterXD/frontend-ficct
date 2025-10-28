"use client";

import { useEffect, useState } from "react";
import { Users2, Plus, Edit2, Trash2, Search } from "lucide-react";

interface Docente {
  id: number;
  ci: string;
  nombre: string;
  correo: string;
  telefono: string;
  estado: "activo" | "inactivo";
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  data: Docente[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ci: "",
    nombre: "",
    correo: "",
    telefono: "",
    estado: "activo" as "activo" | "inactivo",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Obtener listado de docentes
  const fetchDocentes = async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/docentes`);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al cargar docentes");

      const data: PaginatedResponse = await response.json();
      setDocentes(data.data);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Crear o actualizar docente
  const handleSaveDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.ci || !formData.nombre || !formData.correo) {
        throw new Error("Campos obligatorios incompletos");
      }

      if (!formData.correo.includes("@")) {
        throw new Error("Correo inválido");
      }

      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/docentes/${editingId}` : `${API_URL}/docentes`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar docente");
      }

      setSuccess(editingId ? "Docente actualizado correctamente" : "Docente creado correctamente");
      setShowModal(false);
      setEditingId(null);
      setFormData({ ci: "", nombre: "", correo: "", telefono: "", estado: "activo" });
      setTimeout(() => {
        setSuccess(null);
        fetchDocentes(1, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar docente
  const handleDeleteDocente = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este docente?")) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/docentes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al eliminar docente");

      setSuccess("Docente eliminado correctamente");
      fetchDocentes(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de docente
  const handleToggleEstado = async (id: number, nuevoEstado: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/docentes/${id}/estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cambiar estado");
      }

      setSuccess("Estado actualizado correctamente");
      setTimeout(() => {
        setSuccess(null);
        fetchDocentes(currentPage, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Editar docente
  const handleEditDocente = (docente: Docente) => {
    setFormData({
      ci: docente.ci,
      nombre: docente.nombre,
      correo: docente.correo,
      telefono: docente.telefono,
      estado: docente.estado,
    });
    setEditingId(docente.id);
    setShowModal(true);
  };

  // Buscar docentes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchDocentes(1, term);
  };

  // Cargar docentes al montar
  useEffect(() => {
    fetchDocentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users2 size={32} color="#3b82f6" />
          <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
            Gestión de Docentes
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ ci: "", nombre: "", correo: "", telefono: "", estado: "activo" });
            setShowModal(true);
          }}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
        >
          <Plus size={20} />
          Nuevo Docente
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "1px solid #fca5a5",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#991b1b",
              fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: "#dcfce7",
          border: "1px solid #86efac",
          color: "#166534",
          padding: "1rem",
          borderRadius: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#166534",
              fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Buscador */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
      }}>
        <Search size={20} color="#6b7280" style={{ marginTop: "0.25rem" }} />
        <input
          type="text"
          placeholder="Buscar por CI, nombre, correo..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#1f2937",
          }}
        />
      </div>

      {/* Tabla de Docentes */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            Cargando docentes...
          </div>
        ) : docentes.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No hay docentes registrados
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>CI</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Nombre</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Correo</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Teléfono</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Estado</th>
                    <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {docentes.map((docente) => (
                    <tr key={docente.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem", color: "#1f2937", fontSize: "14px" }}>{docente.ci}</td>
                      <td style={{ padding: "1rem", color: "#1f2937", fontSize: "14px" }}>{docente.nombre}</td>
                      <td style={{ padding: "1rem", color: "#1f2937", fontSize: "14px" }}>{docente.correo}</td>
                      <td style={{ padding: "1rem", color: "#1f2937", fontSize: "14px" }}>{docente.telefono}</td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: docente.estado === "activo" ? "#dcfce7" : "#fee2e2",
                            color: docente.estado === "activo" ? "#166534" : "#991b1b",
                          }}
                        >
                          {docente.estado}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEditDocente(docente)}
                            title="Editar"
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "#dbeafe",
                              border: "1px solid #93c5fd",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              color: "#0c4a6e",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#93c5fd";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#dbeafe";
                              e.currentTarget.style.color = "#0c4a6e";
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleEstado(
                                docente.id,
                                docente.estado === "activo" ? "inactivo" : "activo"
                              )
                            }
                            title={docente.estado === "activo" ? "Desactivar" : "Activar"}
                            style={{
                              padding: "0.5rem",
                              backgroundColor: docente.estado === "activo" ? "#fecaca" : "#d1d5db",
                              border: "1px solid #f87171",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              color: "#7f1d1d",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fca5a5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                docente.estado === "activo" ? "#fecaca" : "#d1d5db";
                            }}
                          >
                            {docente.estado === "activo" ? "○" : "●"}
                          </button>
                          <button
                            onClick={() => handleDeleteDocente(docente.id)}
                            title="Eliminar"
                            style={{
                              padding: "0.5rem",
                              backgroundColor: "#fee2e2",
                              border: "1px solid #fca5a5",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              color: "#991b1b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fca5a5";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                              e.currentTarget.style.color = "#991b1b";
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "1rem",
                borderTop: "1px solid #e5e7eb",
              }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchDocentes(page, searchTerm)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      backgroundColor: currentPage === page ? "#3b82f6" : "#f3f4f6",
                      color: currentPage === page ? "#ffffff" : "#374151",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              border: "1px solid #e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                {editingId ? "Editar Docente" : "Nuevo Docente"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDocente} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  CI *
                </label>
                <input
                  type="text"
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  placeholder="Ej: 12345678"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Juan García López"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Correo *
                </label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="Ej: juan@universidad.edu"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: +591 76123456"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: (e.target.value as "activo" | "inactivo") })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    color: "#ffffff",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
