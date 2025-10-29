"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

interface Grupo {
  id: number;
  id_materia: number;
  id_periodo: number;
  paralelo: string;
  turno: "mañana" | "tarde" | "noche";
  capacidad: number;
  codigo?: string;
  materia?: Materia;
  periodo?: Periodo;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Grupo[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FormData {
  id_materia: number | "";
  id_periodo: number | "";
  paralelo: string;
  turno: "mañana" | "tarde" | "noche";
  capacidad: number | "";
  codigo: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const TURNOS = [
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
];

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id_materia: "",
    id_periodo: "",
    paralelo: "",
    turno: "mañana",
    capacidad: "",
    codigo: "",
  });
  const [filterMateria, setFilterMateria] = useState<string>("");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("");
  const [filterTurno, setFilterTurno] = useState<string>("");

  // Cargar materias y periodos al montar
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      
      try {
        // Cargar materias
        const materiasRes = await fetch(`${API_URL}/materias?per_page=100`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (materiasRes.ok) {
          const data = await materiasRes.json();
          console.log("Materias cargadas:", data.data);
          setMaterias(Array.isArray(data.data) ? data.data : []);
        } else {
          console.error("Error al cargar materias:", materiasRes.status);
        }

        // Cargar periodos
        const periodosRes = await fetch(`${API_URL}/periodos?per_page=100`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (periodosRes.ok) {
          const data = await periodosRes.json();
          console.log("Periodos cargados:", data.data);
          setPeriodos(Array.isArray(data.data) ? data.data : []);
        } else {
          console.error("Error al cargar periodos:", periodosRes.status);
        }
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchGrupos = useCallback(
    async (page = 1, search = "", idMateria = "", idPeriodo = "", turno = "") => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const url = new URL(`${API_URL}/grupos`);
        url.searchParams.append("page", page.toString());
        if (search) url.searchParams.append("search", search);
        if (idMateria) url.searchParams.append("id_materia", idMateria);
        if (idPeriodo) url.searchParams.append("id_periodo", idPeriodo);
        if (turno) url.searchParams.append("turno", turno);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Error al cargar grupos");

        const data: PaginatedResponse = await response.json();
        setGrupos(data.data || []);
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

  const handleSaveGrupo = async () => {
    if (!formData.id_materia || !formData.id_periodo || !formData.paralelo || !formData.capacidad) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (formData.capacidad < 1 || formData.capacidad > 500) {
      setError("La capacidad debe estar entre 1 y 500");
      return;
    }

    if (!/^[A-Z]{1,2}$/.test(formData.paralelo)) {
      setError("El paralelo debe ser 1 o 2 letras mayúsculas (A-Z, ej: SA, SC)");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/grupos/${editingId}` : `${API_URL}/grupos`;

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
        setError(data.message || "Error al guardar grupo");
        return;
      }

      setSuccess(data.message || "Grupo guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchGrupos(currentPage, searchTerm, filterMateria, filterPeriodo, filterTurno);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar grupo");
    }
  };

  const handleDeleteGrupo = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este grupo?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/grupos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar grupo");
        return;
      }

      setSuccess("Grupo eliminado exitosamente");
      await fetchGrupos(currentPage, searchTerm, filterMateria, filterPeriodo, filterTurno);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar grupo");
    }
  };

  const handleEditGrupo = (grupo: Grupo) => {
    setEditingId(grupo.id);
    setFormData({
      id_materia: grupo.id_materia,
      id_periodo: grupo.id_periodo,
      paralelo: grupo.paralelo,
      turno: grupo.turno,
      capacidad: grupo.capacidad,
      codigo: grupo.codigo || "",
    });
    setShowModal(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchGrupos(1, term, filterMateria, filterPeriodo, filterTurno);
  };

  const handleFilterChange = (type: string, value: string) => {
    setCurrentPage(1);
    if (type === "materia") setFilterMateria(value);
    if (type === "periodo") setFilterPeriodo(value);
    if (type === "turno") setFilterTurno(value);
    
    fetchGrupos(1, searchTerm, 
      type === "materia" ? value : filterMateria,
      type === "periodo" ? value : filterPeriodo,
      type === "turno" ? value : filterTurno
    );
  };

  const resetForm = () => {
    setFormData({
      id_materia: "",
      id_periodo: "",
      paralelo: "",
      turno: "mañana",
      capacidad: "",
      codigo: "",
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchGrupos(currentPage, searchTerm, filterMateria, filterPeriodo, filterTurno);
  }, [currentPage, fetchGrupos, searchTerm, filterMateria, filterPeriodo, filterTurno]);

  const canEdit = canAccess(["admin", "coordinador"]);

  const getTurnoColor = (turno: string) => {
    const colors: Record<string, string> = {
      mañana: "bg-blue-100 text-blue-800",
      tarde: "bg-yellow-100 text-yellow-800",
      noche: "bg-purple-100 text-purple-800",
    };
    return colors[turno] || "bg-gray-100 text-gray-800";
  };

  const getTurnoLabel = (turno: string) => {
    return TURNOS.find((t) => t.value === turno)?.label || turno;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Grupos
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
            Nuevo Grupo
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          padding: "0.75rem",
          color: "#991b1b",
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          backgroundColor: "#dcfce7",
          border: "1px solid #bbf7d0",
          borderRadius: "0.5rem",
          padding: "0.75rem",
          color: "#166534",
        }}>
          {success}
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        padding: "1.5rem",
      }}>
        {/* Búsqueda por paralelo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={18} color="#6b7280" />
          <input
            type="text"
            placeholder="Buscar paralelo (A, B, C...)"
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

        {/* Filtro por Materia */}
        <select
          value={filterMateria}
          onChange={(e) => handleFilterChange("materia", e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todas las Materias</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>

        {/* Filtro por Periodo */}
        <select
          value={filterPeriodo}
          onChange={(e) => handleFilterChange("periodo", e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los Periodos</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        {/* Filtro por Turno */}
        <select
          value={filterTurno}
          onChange={(e) => handleFilterChange("turno", e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los Turnos</option>
          {TURNOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Grupos */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No hay grupos para mostrar
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Materia
                    </th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Periodo
                    </th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Paralelo
                    </th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Código
                    </th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Turno
                    </th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      Capacidad
                    </th>
                    {canEdit && (
                      <th style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}>
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((grupo) => (
                    <tr
                      key={grupo.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f9fafb")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: "#374151",
                      }}>
                        {grupo.materia?.nombre || "N/A"}
                      </td>
                      <td style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: "#374151",
                      }}>
                        {grupo.periodo?.nombre || "N/A"}
                      </td>
                      <td style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#1f2937",
                      }}>
                        {grupo.paralelo}
                      </td>
                      <td style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                      }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: getTurnoColor(grupo.turno).split(" ")[0],
                          color: getTurnoColor(grupo.turno).split(" ")[1],
                        }}>
                          {getTurnoLabel(grupo.turno)}
                        </span>
                      </td>
                      <td style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: "#374151",
                      }}>
                        {grupo.capacidad} est.
                      </td>
                      {canEdit && (
                        <td style={{
                          padding: "1rem",
                          textAlign: "center",
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}>
                          <button
                            onClick={() => handleEditGrupo(grupo)}
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
                          <button
                            onClick={() => handleDeleteGrupo(grupo.id)}
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
                        </td>
                      )}
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
                padding: "1.5rem",
                borderTop: "1px solid #e5e7eb",
              }}>
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
                      backgroundColor:
                        currentPage === i + 1 ? "#3b82f6" : "#ffffff",
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
                    backgroundColor:
                      currentPage === totalPages ? "#f3f4f6" : "#ffffff",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
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
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: "#1f2937",
            }}>
              {editingId ? "Editar Grupo" : "Nuevo Grupo"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Materia */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}>
                  Materia *
                </label>
                <select
                  value={formData.id_materia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_materia: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="">Seleccione una materia</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Periodo */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}>
                  Periodo *
                </label>
                <select
                  value={formData.id_periodo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_periodo: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="">Seleccione un periodo</option>
                  {periodos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paralelo */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}>
                  Paralelo (A-Z) *
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.paralelo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paralelo: e.target.value.toUpperCase(),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                  placeholder="SA"
                />
              </div>

              {/* Turno */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}>
                  Turno *
                </label>
                <select
                  value={formData.turno}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      turno: e.target.value as "mañana" | "tarde" | "noche",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {TURNOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacidad */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#374151",
                }}>
                  Capacidad (1-500) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.capacidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacidad: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                  placeholder="40"
                />
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
                onClick={handleSaveGrupo}
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
