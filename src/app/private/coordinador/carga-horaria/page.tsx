"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, AlertCircle, CheckCircle } from "lucide-react";

interface Docente {
  id: number;
  id_persona: number;
  activo: boolean;
  persona?: {
    nombre: string;
  };
}

interface Grupo {
  id: number;
  id_materia: number;
  id_periodo: number;
  paralelo: string;
  turno: string;
  capacidad: number;
  materia?: {
    nombre: string;
  };
}

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  vigente: boolean;
}

interface CargaHoraria {
  id: number;
  id_docente: number;
  id_grupo: number;
  id_periodo: number;
  horas_semana: number;
  observaciones?: string;
  activo: boolean;
  docente?: Docente;
  grupo?: Grupo;
  periodo?: Periodo;
}

interface PaginatedResponse {
  success: boolean;
  data: CargaHoraria[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FormData {
  id_docente: string;
  id_grupo: string;
  id_periodo: string;
  horas_semana: string;
  observaciones: string;
  activo: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function CargaHorariaPage() {
  const [cargas, setCargas] = useState<CargaHoraria[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterPeriodo, setFilterPeriodo] = useState<string>("");
  const [filterGrupo, setFilterGrupo] = useState<string>("");
  const [filterDocente, setFilterDocente] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    id_docente: "",
    id_grupo: "",
    id_periodo: "",
    horas_semana: "4",
    observaciones: "",
    activo: true,
  });

  const fetchCargas = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const url = new URL(`${API_URL}/carga-horaria`);
        url.searchParams.append("page", page.toString());
        if (filterPeriodo) url.searchParams.append("id_periodo", filterPeriodo);
        if (filterGrupo) url.searchParams.append("id_grupo", filterGrupo);
        if (filterDocente) url.searchParams.append("id_docente", filterDocente);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Error al cargar cargas horarias");

        const data: PaginatedResponse = await response.json();
        setCargas(data.data || []);
        setCurrentPage(data.pagination.current_page);
        setTotalPages(data.pagination.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [filterPeriodo, filterGrupo, filterDocente]
  );

  const fetchRelatedData = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      const [docentesRes, gruposRes, periodosRes] = await Promise.all([
        fetch(`${API_URL}/docentes?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/grupos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/periodos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (docentesRes.ok) {
        const data = await docentesRes.json();
        setDocentes(data.data || []);
      }
      if (gruposRes.ok) {
        const data = await gruposRes.json();
        setGrupos(data.data || []);
      }
      if (periodosRes.ok) {
        const data = await periodosRes.json();
        setPeriodos(data.data || []);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  }, []);

  const handleSaveCarga = async () => {
    if (!formData.id_docente || !formData.id_grupo || !formData.id_periodo || !formData.horas_semana) {
      setError("Todos los campos requeridos son obligatorios");
      return;
    }

    const horas = parseInt(formData.horas_semana);
    if (horas < 1 || horas > 40) {
      setError("Las horas deben estar entre 1 y 40");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/carga-horaria/${editingId}` : `${API_URL}/carga-horaria`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_docente: parseInt(formData.id_docente),
          id_grupo: parseInt(formData.id_grupo),
          id_periodo: parseInt(formData.id_periodo),
          horas_semana: horas,
          observaciones: formData.observaciones,
          activo: formData.activo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al guardar");
        return;
      }

      setSuccess(data.message || "Guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchCargas(currentPage);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleDeleteCarga = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar esta asignación?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/carga-horaria/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar");
        return;
      }

      setSuccess("Eliminado exitosamente");
      await fetchCargas(currentPage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleEditCarga = (carga: CargaHoraria) => {
    setEditingId(carga.id);
    setFormData({
      id_docente: carga.id_docente.toString(),
      id_grupo: carga.id_grupo.toString(),
      id_periodo: carga.id_periodo.toString(),
      horas_semana: carga.horas_semana.toString(),
      observaciones: carga.observaciones || "",
      activo: carga.activo,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_docente: "",
      id_grupo: "",
      id_periodo: "",
      horas_semana: "4",
      observaciones: "",
      activo: true,
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchCargas(currentPage);
  }, [currentPage, filterPeriodo, filterGrupo, filterDocente, fetchCargas]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  const getDocenteName = (docente?: Docente) => {
    return docente?.persona?.nombre || `Docente ${docente?.id}`;
  };

  const getGrupoName = (grupo?: Grupo) => {
    return `Grupo ${grupo?.id}`;
  };

  const getPeriodoName = (periodo?: Periodo) => {
    return periodo?.nombre || `Periodo ${periodo?.id}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Carga Horaria
        </h1>
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
          Asignar Docente
        </button>
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
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} />
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
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "1.5rem",
        }}
      >
        <select
          value={filterPeriodo}
          onChange={(e) => {
            setFilterPeriodo(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los periodos</option>
          {periodos.map((periodo) => (
            <option key={periodo.id} value={periodo.id}>
              {periodo.nombre}
              {periodo.vigente ? " (Vigente)" : ""}
            </option>
          ))}
        </select>

        <select
          value={filterGrupo}
          onChange={(e) => {
            setFilterGrupo(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los grupos</option>
          {grupos.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              Grupo {grupo.id}
            </option>
          ))}
        </select>

        <select
          value={filterDocente}
          onChange={(e) => {
            setFilterDocente(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">Todos los docentes</option>
          {docentes.map((docente) => (
            <option key={docente.id} value={docente.id}>
              {getDocenteName(docente)}
            </option>
          ))}
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
            Cargando...
          </div>
        ) : cargas.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No hay asignaciones para mostrar
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
                      Docente
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
                      Grupo
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
                      Periodo
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
                      Horas/Semana
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
                      Observaciones
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
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargas.map((carga) => (
                    <tr
                      key={carga.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {getDocenteName(carga.docente)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {getGrupoName(carga.grupo)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {getPeriodoName(carga.periodo)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                          }}
                        >
                          {carga.horas_semana} h
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={carga.observaciones}
                      >
                        {carga.observaciones || "—"}
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
                            backgroundColor: carga.activo ? "#dcfce7" : "#f3f4f6",
                            color: carga.activo ? "#166534" : "#6b7280",
                          }}
                        >
                          {carga.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => handleEditCarga(carga)}
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
                          onClick={() => handleDeleteCarga(carga.id)}
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
                    </tr>
                  ))}
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
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
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
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Users size={24} />
              {editingId ? "Actualizar Asignación" : "Asignar Docente"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Docente */}
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
                  Docente *
                </label>
                <select
                  value={formData.id_docente}
                  onChange={(e) => setFormData({ ...formData, id_docente: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un docente</option>
                  {docentes.map((docente) => (
                    <option key={docente.id} value={docente.id}>
                      {getDocenteName(docente)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grupo */}
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
                  Grupo *
                </label>
                <select
                  value={formData.id_grupo}
                  onChange={(e) => setFormData({ ...formData, id_grupo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      Grupo {grupo.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Periodo */}
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
                  Periodo *
                </label>
                <select
                  value={formData.id_periodo}
                  onChange={(e) => setFormData({ ...formData, id_periodo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un periodo</option>
                  {periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                      {periodo.vigente ? " (Vigente)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horas/Semana */}
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
                  Horas por Semana * (1-40)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={formData.horas_semana}
                  onChange={(e) => setFormData({ ...formData, horas_semana: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                  placeholder="4"
                />
              </div>

              {/* Observaciones */}
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
                  Observaciones (opcional)
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    minHeight: "60px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Estado */}
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
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Activo
              </label>
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
                onClick={handleSaveCarga}
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
