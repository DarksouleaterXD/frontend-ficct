"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Calendar } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  vigente: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Periodo[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FormData {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  vigente: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
    vigente: false,
  });

  const fetchPeriodos = useCallback(
    async (page = 1, search = "", estado = "") => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const url = new URL(`${API_URL}/periodos`);
        url.searchParams.append("page", page.toString());
        if (search) url.searchParams.append("search", search);
        if (estado) url.searchParams.append("activo", estado);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Error al cargar periodos");

        const data: PaginatedResponse = await response.json();
        setPeriodos(data.data || []);
        setCurrentPage(data.pagination.current_page);
        setTotalPages(data.pagination.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSavePeriodo = async () => {
    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
      setError("La fecha de inicio debe ser menor a la fecha de fin");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/periodos/${editingId}` : `${API_URL}/periodos`;

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
        setError(data.message || "Error al guardar período");
        return;
      }

      setSuccess(data.message || "Período guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchPeriodos(currentPage, searchTerm, filterEstado);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar período");
    }
  };

  const handleDeletePeriodo = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este período?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/periodos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar período");
        return;
      }

      setSuccess("Período eliminado exitosamente");
      await fetchPeriodos(currentPage, searchTerm, filterEstado);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar período");
    }
  };

  const handleMarcarVigente = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/periodos/${id}/vigente`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al marcar período");
        return;
      }

      setSuccess("Período marcado como vigente");
      await fetchPeriodos(currentPage, searchTerm, filterEstado);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar período");
    }
  };

  const handleEditPeriodo = (periodo: Periodo) => {
    setEditingId(periodo.id);
    setFormData({
      nombre: periodo.nombre,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin,
      activo: periodo.activo,
      vigente: periodo.vigente,
    });
    setShowModal(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchPeriodos(1, term, filterEstado);
  };

  const handleFilterEstado = (estado: string) => {
    setFilterEstado(estado);
    setCurrentPage(1);
    fetchPeriodos(1, searchTerm, estado);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      activo: true,
      vigente: false,
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchPeriodos(currentPage, searchTerm, filterEstado);
  }, [currentPage, fetchPeriodos, searchTerm, filterEstado]);

  const canEdit = canAccess(["admin"]);
  const canView = canAccess(["admin", "coordinador", "autoridad"]);

  const getDiasRestantes = (fecha_fin: string) => {
    const today = new Date();
    const end = new Date(fecha_fin);
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Períodos Académicos
        </h1>
        {canEdit && (
          <button
            onClick={() => {
              resetForm();
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
            Nuevo Período
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            color: "#166534",
          }}
        >
          {success}
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={18} color="#6b7280" />
          <input
            type="text"
            placeholder="Buscar período (2025-1, 2025-2...)"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
            }}
          />
        </div>

        <select
          value={filterEstado}
          onChange={(e) => handleFilterEstado(e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            Cargando períodos...
          </div>
        ) : periodos.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No hay períodos para mostrar
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Período
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Fechas
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Duración
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Estado
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Vigente
                    </th>
                    {canEdit && (
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {periodos.map((periodo) => {
                    const diasRestantes = getDiasRestantes(periodo.fecha_fin);
                    const diasTotales = Math.ceil(
                      (new Date(periodo.fecha_fin).getTime() -
                        new Date(periodo.fecha_inicio).getTime()) /
                        (1000 * 3600 * 24)
                    );
                    return (
                      <tr
                        key={periodo.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: periodo.vigente ? "#f0fdf4" : "transparent",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!periodo.vigente)
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = periodo.vigente
                            ? "#f0fdf4"
                            : "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {periodo.vigente && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#22c55e",
                                }}
                              />
                            )}
                            {periodo.nombre}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar size={14} />
                            {formatFecha(periodo.fecha_inicio)} - {formatFecha(periodo.fecha_fin)}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }}
                        >
                          {diasTotales} días ({Math.ceil(diasTotales / 7)} semanas)
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: periodo.activo ? "#dcfce7" : "#f3f4f6",
                              color: periodo.activo ? "#166534" : "#6b7280",
                            }}
                          >
                            {periodo.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                          }}
                        >
                          {periodo.vigente ? (
                            <span
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                backgroundColor: "#dcfce7",
                                color: "#166534",
                              }}
                            >
                              ✓ Vigente
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#9ca3af",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td
                            style={{
                              padding: "1rem",
                              textAlign: "center",
                              display: "flex",
                              gap: "0.5rem",
                              justifyContent: "center",
                            }}
                          >
                            {!periodo.vigente && (
                              <button
                                onClick={() => handleMarcarVigente(periodo.id)}
                                title="Marcar como vigente"
                                style={{
                                  backgroundColor: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  padding: "0.5rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "background-color 0.2s",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = "#059669")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "#10b981")
                                }
                              >
                                Vigente
                              </button>
                            )}
                            <button
                              onClick={() => handleEditPeriodo(periodo)}
                              style={{
                                backgroundColor: "#60a5fa",
                                color: "white",
                                border: "none",
                                borderRadius: "0.375rem",
                                padding: "0.5rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#3b82f6")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "#60a5fa")
                              }
                            >
                              <Edit2 size={16} />
                            </button>
                            {!periodo.vigente && (
                              <button
                                onClick={() => handleDeletePeriodo(periodo.id)}
                                style={{
                                  backgroundColor: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  padding: "0.5rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = "#dc2626")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "#ef4444")
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1.5rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    backgroundColor: currentPage === 1 ? "#f3f4f6" : "#ffffff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                      backgroundColor: currentPage === i + 1 ? "#3b82f6" : "#ffffff",
                      color: currentPage === i + 1 ? "white" : "#374151",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: currentPage === i + 1 ? "600" : "normal",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    backgroundColor: currentPage === totalPages ? "#f3f4f6" : "#ffffff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
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
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "1.5rem",
                color: "#1f2937",
              }}
            >
              {editingId ? "Editar Período" : "Nuevo Período"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Nombre */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Nombre (ej: 2025-1, 2025-2) *
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value.toUpperCase() })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                  placeholder="2025-1"
                />
              </div>

              {/* Fecha Inicio */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_inicio: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Estado */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  Activo
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.vigente}
                    onChange={(e) =>
                      setFormData({ ...formData, vigente: e.target.checked })
                    }
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  Vigente
                </label>
              </div>
            </div>

            {/* Botones */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffffff")
                }
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePeriodo}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1e40af")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3b82f6")
                }
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
