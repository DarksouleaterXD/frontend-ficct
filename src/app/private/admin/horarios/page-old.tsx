"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Clock, AlertCircle } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface BloqueHorario {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  numero_bloque: number;
  activo: boolean;
}

interface Grupo {
  id: number;
  id_materia: number;
  id_periodo: number;
  paralelo: string;
  turno: string;
  capacidad: number;
}

interface Aula {
  id: number;
  codigo: string;
  nombre: string;
  capacidad: number;
  tipo: string;
}

interface Docente {
  id: number;
  id_persona: number;
  activo: boolean;
  persona?: {
    nombre: string;
  };
}

interface Horario {
  id: number;
  id_grupo: number;
  id_aula: number;
  id_docente: number;
  id_bloque: number;
  dia_semana: string;
  activo: boolean;
  descripcion?: string;
  grupo?: Grupo;
  aula?: Aula;
  docente?: Docente;
  bloque?: BloqueHorario;
}

interface PaginatedResponse {
  success: boolean;
  data: Horario[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FormData {
  id_grupo: string;
  id_aula: string;
  id_docente: string;
  id_bloque: string;
  dia_semana: string;
  activo: boolean;
  descripcion: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes"];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDia, setFilterDia] = useState<string>("");
  const [filterGrupo, setFilterGrupo] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    id_grupo: "",
    id_aula: "",
    id_docente: "",
    id_bloque: "",
    dia_semana: "",
    activo: true,
    descripcion: "",
  });

  const fetchHorarios = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const url = new URL(`${API_URL}/horarios`);
        url.searchParams.append("page", page.toString());
        if (filterDia) url.searchParams.append("dia_semana", filterDia);
        if (filterGrupo) url.searchParams.append("id_grupo", filterGrupo);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Error al cargar horarios");

        const data: PaginatedResponse = await response.json();
        setHorarios(data.data || []);
        setCurrentPage(data.pagination.current_page);
        setTotalPages(data.pagination.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [filterDia, filterGrupo]
  );

  const fetchRelatedData = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      const [gruposRes, aulasRes, docentesRes, bloquesRes] = await Promise.all([
        fetch(`${API_URL}/grupos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/aulas?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/docentes?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bloques-horarios?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (gruposRes.ok) {
        const gruposData = await gruposRes.json();
        setGrupos(gruposData.data || []);
      }
      if (aulasRes.ok) {
        const aulasData = await aulasRes.json();
        setAulas(aulasData.data || []);
      }
      if (docentesRes.ok) {
        const docentesData = await docentesRes.json();
        setDocentes(docentesData.data || []);
      }
      if (bloquesRes.ok) {
        const bloquesData = await bloquesRes.json();
        setBloques(bloquesData.data || []);
      }
    } catch (err) {
      console.error("Error cargando datos relacionados:", err);
    }
  }, []);

  const handleSaveHorario = async () => {
    if (
      !formData.id_grupo ||
      !formData.id_aula ||
      !formData.id_docente ||
      !formData.id_bloque ||
      !formData.dia_semana
    ) {
      setError("Todos los campos requeridos son obligatorios");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/horarios/${editingId}` : `${API_URL}/horarios`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_grupo: parseInt(formData.id_grupo),
          id_aula: parseInt(formData.id_aula),
          id_docente: parseInt(formData.id_docente),
          id_bloque: parseInt(formData.id_bloque),
          dia_semana: formData.dia_semana,
          activo: formData.activo,
          descripcion: formData.descripcion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al guardar horario");
        return;
      }

      setSuccess(data.message || "Horario guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchHorarios(currentPage);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar horario");
    }
  };

  const handleDeleteHorario = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este horario?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/horarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar horario");
        return;
      }

      setSuccess("Horario eliminado exitosamente");
      await fetchHorarios(currentPage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar horario");
    }
  };

  const handleEditHorario = (horario: Horario) => {
    setEditingId(horario.id);
    setFormData({
      id_grupo: horario.id_grupo.toString(),
      id_aula: horario.id_aula.toString(),
      id_docente: horario.id_docente.toString(),
      id_bloque: horario.id_bloque.toString(),
      dia_semana: horario.dia_semana,
      activo: horario.activo,
      descripcion: horario.descripcion || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_grupo: "",
      id_aula: "",
      id_docente: "",
      id_bloque: "",
      dia_semana: "",
      activo: true,
      descripcion: "",
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchHorarios(currentPage);
  }, [currentPage, filterDia, filterGrupo, fetchHorarios]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  const canEdit = canAccess(["admin", "coordinador"]);
  const canView = canAccess(["admin", "coordinador", "autoridad", "docente"]);

  const getGrupoName = (grupo?: Grupo, idGrupo?: number) => {
    if (grupo) return `Grupo ${grupo.id}`;
    return `Grupo ${idGrupo}`;
  };

  const getAulaName = (aula?: Aula, idAula?: number) => {
    if (aula) return aula.nombre || aula.codigo;
    return `Aula ${idAula}`;
  };

  const getDocenteName = (docente?: Docente) => {
    if (docente?.persona?.nombre) return docente.persona.nombre;
    return "N/A";
  };

  const getBloqueName = (bloque?: BloqueHorario) => {
    if (bloque) return `${bloque.nombre} (${bloque.hora_inicio} - ${bloque.hora_fin})`;
    return "N/A";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Horarios
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
            Nuevo Horario
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
          }}
        >
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={18} color="#6b7280" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          value={filterDia}
          onChange={(e) => {
            setFilterDia(e.target.value);
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
          <option value="">Todos los días</option>
          {DIAS_SEMANA.map((dia) => (
            <option key={dia} value={dia}>
              {dia.charAt(0).toUpperCase() + dia.slice(1)}
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
            Cargando horarios...
          </div>
        ) : horarios.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No hay horarios para mostrar
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
                      Aula
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
                      Bloque
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
                      Día
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
                  {horarios.map((horario) => (
                    <tr
                      key={horario.id}
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
                        {getGrupoName(horario.grupo, horario.id_grupo)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {getAulaName(horario.aula, horario.id_aula)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {getDocenteName(horario.docente)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Clock size={14} />
                        {getBloqueName(horario.bloque)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#374151",
                          textTransform: "capitalize",
                        }}
                      >
                        {horario.dia_semana}
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
                            backgroundColor: horario.activo ? "#dcfce7" : "#f3f4f6",
                            color: horario.activo ? "#166534" : "#6b7280",
                          }}
                        >
                          {horario.activo ? "Activo" : "Inactivo"}
                        </span>
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
                          <button
                            onClick={() => handleEditHorario(horario)}
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
                            onClick={() => handleDeleteHorario(horario.id)}
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
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
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
              {editingId ? "Editar Horario" : "Nuevo Horario"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

              {/* Aula */}
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
                  Aula *
                </label>
                <select
                  value={formData.id_aula}
                  onChange={(e) => setFormData({ ...formData, id_aula: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un aula</option>
                  {aulas.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {aula.nombre} ({aula.codigo}) - Capacidad: {aula.capacidad}
                    </option>
                  ))}
                </select>
              </div>

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
                      {docente.persona?.nombre || `Docente ${docente.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bloque de Horario */}
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
                  Bloque Horario *
                </label>
                <select
                  value={formData.id_bloque}
                  onChange={(e) => setFormData({ ...formData, id_bloque: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un bloque</option>
                  {bloques.map((bloque) => (
                    <option key={bloque.id} value={bloque.id}>
                      {bloque.nombre} ({bloque.hora_inicio} - {bloque.hora_fin})
                    </option>
                  ))}
                </select>
              </div>

              {/* Día de la Semana */}
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
                  Día de la Semana *
                </label>
                <select
                  value={formData.dia_semana}
                  onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">Selecciona un día</option>
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
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
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    minHeight: "80px",
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
                onClick={handleSaveHorario}
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
