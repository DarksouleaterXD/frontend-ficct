"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Clock, AlertCircle, CheckCircle, Grid3X3, List } from "lucide-react";
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
  codigo: string;
  paralelo: string;
  turno: string;
  capacidad: number;
}

interface Aula {
  id: number;
  codigo: string;
  nombre: string;
  capacidad: number;
  numero_aula: string;
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
  id_bloque: number | null;
  hora_inicio?: string;
  hora_fin?: string;
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
  hora_inicio: string;
  hora_fin: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterGrupo, setFilterGrupo] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    id_grupo: "",
    id_aula: "",
    id_docente: "",
    hora_inicio: "",
    hora_fin: "",
    dia_semana: "",
    activo: true,
    descripcion: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchHorarios = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/horarios`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("per_page", "200");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [filterGrupo]);

  const fetchRelatedData = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      const [gruposRes, aulasRes, docentesRes] = await Promise.all([
        fetch(`${API_URL}/grupos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/aulas?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/docentes?per_page=999`, {
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
    } catch (err) {
      console.error("Error cargando datos relacionados:", err);
    }
  }, []);

  const handleSaveHorario = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_grupo) newErrors.id_grupo = "El grupo es requerido";
    if (!formData.id_aula) newErrors.id_aula = "El aula es requerida";
    if (!formData.id_docente) newErrors.id_docente = "El docente es requerido";
    if (!formData.hora_inicio) newErrors.hora_inicio = "La hora de inicio es requerida";
    if (!formData.hora_fin) newErrors.hora_fin = "La hora de fin es requerida";
    
    if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
      newErrors.hora_fin = "La hora de fin debe ser posterior a la hora de inicio";
    }
    
    if (!formData.dia_semana) newErrors.dia_semana = "El día es requerido";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
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
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
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
      await fetchHorarios();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar horario");
    }
  };

  const handleDeleteHorario = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este horario?")) return;

    setDeleteLoading(id);
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
      await fetchHorarios();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar horario");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditHorario = (horario: Horario) => {
    setEditingId(horario.id);
    
    setFormData({
      id_grupo: horario.id_grupo.toString(),
      id_aula: horario.id_aula.toString(),
      id_docente: horario.id_docente.toString(),
      hora_inicio: horario.hora_inicio || "",
      hora_fin: horario.hora_fin || "",
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
      hora_inicio: "",
      hora_fin: "",
      dia_semana: "",
      activo: true,
      descripcion: "",
    });
    setEditingId(null);
    setFormErrors({});
  };

  useEffect(() => {
    fetchHorarios();
  }, [filterGrupo, fetchHorarios]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  const canEdit = canAccess(["admin", "coordinador"]);

  // Group horarios by day
  const horariosPorDia = DIAS_SEMANA.reduce((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.dia_semana === dia).sort((a, b) => {
      const aBloqueNum = a.bloque?.numero_bloque || 0;
      const bBloqueNum = b.bloque?.numero_bloque || 0;
      return aBloqueNum - bBloqueNum;
    });
    return acc;
  }, {} as Record<string, Horario[]>);

  const renderGridView = () => {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            {/* Dia Header */}
            <div
              style={{
                backgroundColor: "#f3f4f6",
                padding: "1rem",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "bold", color: "#1f2937", textTransform: "capitalize" }}>
                {dia.charAt(0).toUpperCase() + dia.slice(1)}
              </h3>
              <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                {horariosPorDia[dia]?.length || 0} clase{horariosPorDia[dia]?.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Bloques */}
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {horariosPorDia[dia]?.length > 0 ? (
                horariosPorDia[dia].map((horario) => (
                  <div
                    key={horario.id}
                    style={{
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#eff6ff";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <Clock size={16} color="#3b82f6" />
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#1f2937",
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                          }}
                        >
                          {horario.hora_inicio} - {horario.hora_fin}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#e0e7ff",
                        color: "#3730a3",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        display: "inline-block",
                      }}
                    >
                      {horario.grupo?.codigo || `Grupo ${horario.id_grupo}`}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                      <strong>Aula:</strong> {horario.aula?.numero_aula || horario.aula?.codigo}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                      <strong>Docente:</strong> {horario.docente?.persona?.nombre || "N/A"}
                    </div>

                    {canEdit && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
                        <button
                          onClick={() => handleEditHorario(horario)}
                          style={{
                            flex: 1,
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            padding: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                        >
                          <Edit2 size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteHorario(horario.id)}
                          disabled={deleteLoading === horario.id}
                          style={{
                            flex: 1,
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            padding: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: deleteLoading === horario.id ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                            transition: "background-color 0.2s ease",
                            opacity: deleteLoading === horario.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (deleteLoading !== horario.id) {
                              e.currentTarget.style.backgroundColor = "#dc2626";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deleteLoading !== horario.id) {
                              e.currentTarget.style.backgroundColor = "#ef4444";
                            }
                          }}
                        >
                          <Trash2 size={12} />
                          {deleteLoading === horario.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.875rem", padding: "1rem 0" }}>
                  Sin clases
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          marginTop: "1rem",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Día
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Bloque
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Horario
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Grupo
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Aula
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Docente
                </th>
                {canEdit && (
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {horarios.map((horario, index) => (
                <tr
                  key={horario.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f9fafb")
                  }
                >
                  <td style={{ padding: "1rem", fontWeight: "600", color: "#1f2937", textTransform: "capitalize" }}>
                    {horario.dia_semana}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#6b7280",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                    }}
                  >
                    {horario.bloque?.nombre}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#6b7280",
                      fontFamily: "monospace",
                      fontWeight: "500",
                    }}
                  >
                    {horario.bloque?.hora_inicio} - {horario.bloque?.hora_fin}
                  </td>
                  <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "500" }}>
                    {horario.grupo?.codigo || `Grupo ${horario.id_grupo}`}
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280" }}>
                    {horario.aula?.numero_aula || horario.aula?.codigo}
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280" }}>
                    {horario.docente?.persona?.nombre || "N/A"}
                  </td>
                  {canEdit && (
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          onClick={() => handleEditHorario(horario)}
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "background-color 0.2s ease",
                            fontSize: "0.75rem",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                        >
                          <Edit2 size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteHorario(horario.id)}
                          disabled={deleteLoading === horario.id}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            cursor: deleteLoading === horario.id ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "background-color 0.2s ease",
                            fontSize: "0.75rem",
                            opacity: deleteLoading === horario.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (deleteLoading !== horario.id) {
                              e.currentTarget.style.backgroundColor = "#dc2626";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deleteLoading !== horario.id) {
                              e.currentTarget.style.backgroundColor = "#ef4444";
                            }
                          }}
                        >
                          <Trash2 size={14} />
                          {deleteLoading === horario.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Alerts */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#991b1b",
          }}
        >
          <AlertCircle size={20} />
          <p style={{ margin: 0, fontSize: "0.875rem" }}>{error}</p>
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#166534",
          }}
        >
          <CheckCircle size={20} />
          <p style={{ margin: 0, fontSize: "0.875rem" }}>{success}</p>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Clock size={28} color="#3b82f6" />
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", margin: 0, color: "#1f2937" }}>
            Horarios
          </h1>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            <Plus size={20} />
            Nuevo Horario
          </button>
        )}
      </div>

      {/* Filter and View Mode */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select
          value={filterGrupo}
          onChange={(e) => {
            setFilterGrupo(e.target.value);
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
              {grupo.codigo || `Grupo ${grupo.id}`}
            </option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: viewMode === "grid" ? "#3b82f6" : "#e5e7eb",
              color: viewMode === "grid" ? "white" : "#374151",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              fontSize: "0.875rem",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (viewMode !== "grid") {
                e.currentTarget.style.backgroundColor = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== "grid") {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }
            }}
          >
            <Grid3X3 size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: viewMode === "list" ? "#3b82f6" : "#e5e7eb",
              color: viewMode === "list" ? "white" : "#374151",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              fontSize: "0.875rem",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (viewMode !== "list") {
                e.currentTarget.style.backgroundColor = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== "list") {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }
            }}
          >
            <List size={16} />
            Lista
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Cargando horarios...
        </div>
      ) : horarios.length === 0 ? (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          No hay horarios para mostrar
        </div>
      ) : viewMode === "grid" ? (
        renderGridView()
      ) : (
        renderListView()
      )}

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
              backgroundColor: "white",
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
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 1.5rem 0", color: "#1f2937" }}>
              {editingId ? "Editar Horario" : "Nuevo Horario"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {/* Grupo */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Grupo *
                </label>
                <select
                  value={formData.id_grupo}
                  onChange={(e) => {
                    setFormData({ ...formData, id_grupo: e.target.value });
                    if (formErrors.id_grupo) setFormErrors({ ...formErrors, id_grupo: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.id_grupo ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.codigo || `Grupo ${grupo.id}`}
                    </option>
                  ))}
                </select>
                {formErrors.id_grupo && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.id_grupo}</p>}
              </div>

              {/* Aula */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Aula *
                </label>
                <select
                  value={formData.id_aula}
                  onChange={(e) => {
                    setFormData({ ...formData, id_aula: e.target.value });
                    if (formErrors.id_aula) setFormErrors({ ...formErrors, id_aula: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.id_aula ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar aula</option>
                  {aulas.map((aula) => (
                    <option key={aula.id} value={aula.id}>
                      {aula.numero_aula} ({aula.tipo})
                    </option>
                  ))}
                </select>
                {formErrors.id_aula && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.id_aula}</p>}
              </div>

              {/* Docente */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Docente *
                </label>
                <select
                  value={formData.id_docente}
                  onChange={(e) => {
                    setFormData({ ...formData, id_docente: e.target.value });
                    if (formErrors.id_docente) setFormErrors({ ...formErrors, id_docente: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.id_docente ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar docente</option>
                  {docentes.map((docente) => (
                    <option key={docente.id} value={docente.id}>
                      {docente.persona?.nombre || `Docente ${docente.id}`}
                    </option>
                  ))}
                </select>
                {formErrors.id_docente && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.id_docente}</p>}
              </div>

              {/* Horario */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => {
                      setFormData({ ...formData, hora_inicio: e.target.value });
                      if (formErrors.hora_inicio) setFormErrors({ ...formErrors, hora_inicio: "" });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: `1px solid ${formErrors.hora_inicio ? "#ef4444" : "#d1d5db"}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                  {formErrors.hora_inicio && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.hora_inicio}</p>}
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => {
                      setFormData({ ...formData, hora_fin: e.target.value });
                      if (formErrors.hora_fin) setFormErrors({ ...formErrors, hora_fin: "" });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: `1px solid ${formErrors.hora_fin ? "#ef4444" : "#d1d5db"}`,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                  {formErrors.hora_fin && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.hora_fin}</p>}
                </div>
              </div>

              {/* Día */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Día *
                </label>
                <select
                  value={formData.dia_semana}
                  onChange={(e) => {
                    setFormData({ ...formData, dia_semana: e.target.value });
                    if (formErrors.dia_semana) setFormErrors({ ...formErrors, dia_semana: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.dia_semana ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar día</option>
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </option>
                  ))}
                </select>
                {formErrors.dia_semana && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.dia_semana}</p>}
              </div>

              {/* Activo */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>Activo</span>
                </label>
              </div>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                Descripción (opcional)
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  minHeight: "80px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHorario}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
              >
                {editingId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
