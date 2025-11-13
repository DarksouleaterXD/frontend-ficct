"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface BloqueHorario {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  numero_bloque: number;
  activo: boolean;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

interface Grupo {
  id: number;
  id_materia: number;
  id_periodo: number;
  id_docente?: number;
  codigo: string;
  paralelo: string;
  turno: string;
  capacidad: number;
  materia?: {
    id: number;
    nombre: string;
    codigo: string;
  };
  docente?: {
    id: number;
    id_persona: number;
    activo: boolean;
    persona?: {
      nombre: string;
      apellido_paterno: string;
      apellido_materno: string;
    };
  };
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
  dias_semana: string[]; // Array de días: ['lunes', 'miercoles', 'viernes']
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
  id_bloque: string;
  dias_semana: string[]; // Array de días seleccionados
  activo: boolean;
  descripcion: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// Días en minúsculas sin tildes (backend los normalizará)
const DIAS_SEMANA = [
  "lunes",
  "martes", 
  "miercoles",
  "jueves",
  "viernes",
  "sabado"
] as const;

// Función para mostrar día con formato bonito
const formatearDiaParaMostrar = (dia: string): string => {
  const formatos: Record<string, string> = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
  };
  return formatos[dia.toLowerCase()] || dia;
};

// Función para normalizar día entrante a minúsculas sin tildes
const normalizarDia = (dia: string): string => {
  const normalizaciones: Record<string, string> = {
    'Lunes': 'lunes',
    'Martes': 'martes',
    'Miércoles': 'miercoles',
    'Miercoles': 'miercoles',
    'miércoles': 'miercoles',
    'Jueves': 'jueves',
    'Viernes': 'viernes',
    'Sábado': 'sabado',
    'Sabado': 'sabado',
    'sábado': 'sabado',
    'lunes': 'lunes',
    'martes': 'martes',
    'miercoles': 'miercoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'sabado': 'sabado',
  };
  
  return normalizaciones[dia] || dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalBloques, setShowModalBloques] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingBloqueId, setEditingBloqueId] = useState<number | null>(null);
  const [filterGrupo, setFilterGrupo] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    id_grupo: "",
    id_aula: "",
    id_bloque: "",
    dias_semana: [],
    activo: true,
    descripcion: "",
  });

  const [formDataBloque, setFormDataBloque] = useState({
    nombre: "",
    hora_inicio: "",
    hora_fin: "",
    numero_bloque: "",
    activo: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formErrorsBloque, setFormErrorsBloque] = useState<Record<string, string>>({});

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
      const [gruposRes, aulasRes, materiasRes, bloquesRes] = await Promise.all([
        fetch(`${API_URL}/grupos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/aulas?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/materias?per_page=999`, {
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
      if (materiasRes.ok) {
        const materiasData = await materiasRes.json();
        setMaterias(materiasData.data || []);
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
    console.log("FormData actual:", formData);
    
    const newErrors: Record<string, string> = {};

    if (!formData.id_grupo) newErrors.id_grupo = "El grupo es requerido";
    if (!formData.id_aula) newErrors.id_aula = "El aula es requerida";
    if (!formData.id_bloque) newErrors.id_bloque = "El bloque horario es requerido";
    if (formData.dias_semana.length === 0) newErrors.dias_semana = "Debe seleccionar al menos un día";

    if (Object.keys(newErrors).length > 0) {
      console.error("Errores de validación frontend:", newErrors);
      setFormErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/horarios/${editingId}` : `${API_URL}/horarios`;

      const payload = {
        id_grupo: parseInt(formData.id_grupo),
        id_aula: parseInt(formData.id_aula),
        id_bloque: parseInt(formData.id_bloque),
        dias_semana: formData.dias_semana.map(normalizarDia),
        activo: formData.activo,
        descripcion: formData.descripcion || "",
      };

      console.log("Enviando payload:", payload);
      console.log("dias_semana específicamente:", payload.dias_semana);
      console.log("Cada día:", payload.dias_semana.map((d, i) => `[${i}]: "${d}" (${d.length} chars, códigos: ${[...d].map(c => c.charCodeAt(0)).join(',')})`));

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (!response.ok) {
        // Mostrar errores específicos de validación si existen
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(`Errores de validación:\n${errorMessages}`);
          console.error("Errores de validación:", data.errors);
        } else {
          setError(data.message || "Error al guardar horario");
        }
        return;
      }

      setSuccess(data.message || "Horario guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchHorarios();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error completo:", err);
      setError(err instanceof Error ? err.message : "Error al guardar horario");
    } finally {
      setLoading(false);
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

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Error al eliminar horario";
        
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } else {
          const text = await response.text();
          console.error("Error response:", text);
        }
        
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setSuccess(data.message || "Horario eliminado exitosamente");
      await fetchHorarios();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar horario");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditHorario = (horario: Horario) => {
    setEditingId(horario.id);
    
    // Buscar el grupo para mostrar el docente
    const grupoSeleccionado = grupos.find(g => g.id === horario.id_grupo);
    setSelectedGrupo(grupoSeleccionado || null);
    
    setFormData({
      id_grupo: horario.id_grupo.toString(),
      id_aula: horario.id_aula.toString(),
      id_bloque: horario.id_bloque?.toString() || "",
      dias_semana: (horario.dias_semana || []).map(normalizarDia), // Normalizar días al cargar
      activo: horario.activo,
      descripcion: horario.descripcion || "",
    });
    setShowModal(true);
  };

  const handleGrupoChange = (idGrupo: string) => {
    setFormData({ ...formData, id_grupo: idGrupo });
    
    if (idGrupo) {
      const grupoSeleccionado = grupos.find(g => g.id === Number(idGrupo));
      setSelectedGrupo(grupoSeleccionado || null);
    } else {
      setSelectedGrupo(null);
    }
  };

  const resetForm = () => {
    setFormData({
      id_grupo: "",
      id_aula: "",
      id_bloque: "",
      dias_semana: [],
      activo: true,
      descripcion: "",
    });
    setSelectedGrupo(null);
    setEditingId(null);
    setFormErrors({});
  };

  const resetFormBloque = () => {
    setFormDataBloque({
      nombre: "",
      hora_inicio: "",
      hora_fin: "",
      numero_bloque: "",
      activo: true,
    });
    setEditingBloqueId(null);
    setFormErrorsBloque({});
  };

  const handleSaveBloque = async () => {
    const newErrors: Record<string, string> = {};

    if (!formDataBloque.nombre) newErrors.nombre = "El nombre es requerido";
    if (!formDataBloque.hora_inicio) newErrors.hora_inicio = "La hora de inicio es requerida";
    if (!formDataBloque.hora_fin) newErrors.hora_fin = "La hora de fin es requerida";
    if (!formDataBloque.numero_bloque) newErrors.numero_bloque = "El número de bloque es requerido";

    if (formDataBloque.hora_inicio && formDataBloque.hora_fin && formDataBloque.hora_inicio >= formDataBloque.hora_fin) {
      newErrors.hora_fin = "La hora de fin debe ser posterior a la hora de inicio";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrorsBloque(newErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const isEditing = editingBloqueId !== null && editingBloqueId > 0;
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `${API_URL}/bloques-horarios/${editingBloqueId}` 
        : `${API_URL}/bloques-horarios`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formDataBloque.nombre,
          hora_inicio: formDataBloque.hora_inicio,
          hora_fin: formDataBloque.hora_fin,
          numero_bloque: parseInt(formDataBloque.numero_bloque),
          activo: formDataBloque.activo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al guardar bloque horario");
        return;
      }

      setSuccess(data.message || "Bloque horario guardado exitosamente");
      setShowModalBloques(false);
      resetFormBloque();
      await fetchRelatedData(); // Recargar bloques

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar bloque horario");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBloque = (bloque: BloqueHorario) => {
    setEditingBloqueId(bloque.id);
    setFormDataBloque({
      nombre: bloque.nombre,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      numero_bloque: bloque.numero_bloque.toString(),
      activo: bloque.activo,
    });
    setShowModalBloques(true);
  };

  const handleDeleteBloque = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este bloque horario?\n\nNOTA: Solo se puede eliminar si no tiene horarios asignados.")) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bloques-horarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar mensaje específico si hay horarios asociados
        if (response.status === 400) {
          setError(data.message || "No se puede eliminar el bloque. Tiene horarios asignados.");
        } else {
          setError(data.message || "Error al eliminar bloque horario");
        }
        return;
      }

      setSuccess(data.message || "Bloque horario eliminado exitosamente");
      await fetchRelatedData(); // Recargar bloques

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión al eliminar bloque horario");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBloqueEstado = async (bloque: BloqueHorario) => {
    const nuevoEstado = !bloque.activo;
    const accion = nuevoEstado ? "activar" : "desactivar";
    
    if (!confirm(`¿Confirma que desea ${accion} este bloque horario?`)) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bloques-horarios/${bloque.id}/estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activo: nuevoEstado,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || `Error al ${accion} bloque horario`);
        return;
      }

      setSuccess(data.message || `Bloque horario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
      await fetchRelatedData(); // Recargar bloques

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al ${accion} bloque horario`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, [filterGrupo, fetchHorarios]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  const canEdit = canAccess(["admin", "coordinador"]);

  // Group horarios by day - ahora dias_semana es un array
  const horariosPorDia = DIAS_SEMANA.reduce((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.dias_semana && h.dias_semana.includes(dia)).sort((a, b) => {
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
                          {horario.bloque?.hora_inicio} - {horario.bloque?.hora_fin}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.5rem" }}>
                      {horario.grupo?.materia?.nombre || "N/A"}
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
                      {horario.grupo?.paralelo || horario.grupo?.codigo || `Grupo ${horario.id_grupo}`}
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
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Materia
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
                  <td style={{ padding: "1rem", fontWeight: "600", color: "#1f2937" }}>
                    {horario.dias_semana && horario.dias_semana.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {horario.dias_semana.map((dia, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            {dia.substring(0, 3).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "500" }}>
                    {horario.grupo?.materia?.nombre || "N/A"}
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
                    {horario.grupo?.paralelo || horario.grupo?.codigo || `Grupo ${horario.id_grupo}`}
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

      {/* Filter */}
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
              {grupo.paralelo || grupo.codigo || `Grupo ${grupo.id}`}
            </option>
          ))}
        </select>
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
              {/* Grupo (con materia y paralelo) */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Grupo (Materia + Paralelo) *
                </label>
                <select
                  value={formData.id_grupo}
                  onChange={(e) => {
                    handleGrupoChange(e.target.value);
                    if (formErrors.id_grupo) setFormErrors({ ...formErrors, id_grupo: "" });
                  }}
                  disabled={editingId ? true : false}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.id_grupo ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                    backgroundColor: editingId ? "#f3f4f6" : "white",
                    cursor: editingId ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Seleccionar grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.materia?.codigo || 'SIN-COD'} - {grupo.materia?.nombre || 'Sin nombre'} ({grupo.paralelo || 'N/A'})
                    </option>
                  ))}
                </select>
                {formErrors.id_grupo && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.id_grupo}</p>}
                {editingId && <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.25rem 0 0 0", fontStyle: "italic" }}>No se puede cambiar el grupo al editar un horario</p>}
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

              {/* Docente (readonly - heredado del Grupo) */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Docente Asignado
                </label>
                <div
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    backgroundColor: "#f9fafb",
                    color: selectedGrupo?.docente ? "#111827" : "#9ca3af",
                  }}
                >
                  {selectedGrupo?.docente?.persona 
                    ? `${selectedGrupo.docente.persona.nombre} ${selectedGrupo.docente.persona.apellido_paterno} ${selectedGrupo.docente.persona.apellido_materno}`
                    : "Sin docente asignado (seleccione un grupo primero)"
                  }
                </div>
                <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.25rem 0 0 0", fontStyle: "italic" }}>
                  El docente se asigna al grupo, no al horario
                </p>
              </div>

              {/* Bloque Horario */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Bloque Horario *
                </label>
                <select
                  value={formData.id_bloque}
                  onChange={(e) => {
                    setFormData({ ...formData, id_bloque: e.target.value });
                    if (formErrors.id_bloque) setFormErrors({ ...formErrors, id_bloque: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.id_bloque ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar bloque</option>
                  {bloques
                    .filter(b => b.activo)
                    .sort((a, b) => a.numero_bloque - b.numero_bloque)
                    .map((bloque) => (
                      <option key={bloque.id} value={bloque.id}>
                        {bloque.numero_bloque} - {bloque.nombre} ({bloque.hora_inicio} - {bloque.hora_fin})
                      </option>
                    ))}
                </select>
                {formErrors.id_bloque && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.id_bloque}</p>}
              </div>

              {/* Días de la semana (múltiple selección) */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Días de la Semana *
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(3, 1fr)", 
                  gap: "0.5rem",
                  border: `1px solid ${formErrors.dias_semana ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                }}>
                  {DIAS_SEMANA.map((dia) => (
                    <label key={dia} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.dias_semana.includes(dia)}
                        onChange={(e) => {
                          const newDias = e.target.checked
                            ? [...formData.dias_semana, dia]
                            : formData.dias_semana.filter(d => d !== dia);
                          setFormData({ ...formData, dias_semana: newDias });
                          if (formErrors.dias_semana) setFormErrors({ ...formErrors, dias_semana: "" });
                        }}
                        style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                        {formatearDiaParaMostrar(dia)}
                      </span>
                    </label>
                  ))}
                </div>
                {formErrors.dias_semana && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrors.dias_semana}</p>}
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
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#1e40af";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#3b82f6";
                }}
              >
                {loading ? "Guardando..." : (editingId ? "Actualizar" : "Crear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Bloques */}
      {showModalBloques && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
          onClick={() => setShowModalBloques(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "1.5rem" }}>
              {/* Header */}
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#1f2937" }}>
                {editingBloqueId ? "Editar Bloque Horario" : "Gestionar Bloques Horarios"}
              </h2>

              {/* Lista de bloques existentes */}
              {!editingBloqueId && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#374151" }}>
                      Bloques Existentes
                    </h3>
                    <button
                      onClick={() => setEditingBloqueId(0)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={16} style={{ display: "inline", marginRight: "0.25rem" }} />
                      Nuevo Bloque
                    </button>
                  </div>
                  
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {bloques.length === 0 ? (
                      <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                        No hay bloques horarios registrados
                      </p>
                    ) : (
                      bloques
                        .sort((a, b) => a.numero_bloque - b.numero_bloque)
                        .map((bloque) => (
                          <div
                            key={bloque.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.5rem",
                              backgroundColor: bloque.activo ? "#f9fafb" : "#fee2e2",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                <span style={{ 
                                  fontWeight: "bold", 
                                  color: "#1f2937",
                                  fontSize: "1rem",
                                }}>
                                  Bloque {bloque.numero_bloque}: {bloque.nombre}
                                </span>
                                {!bloque.activo && (
                                  <span style={{
                                    padding: "0.125rem 0.5rem",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    borderRadius: "0.25rem",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                  }}>
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <div style={{ color: "#6b7280", fontSize: "0.875rem", fontFamily: "monospace" }}>
                                {bloque.hora_inicio} - {bloque.hora_fin}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleEditBloque(bloque)}
                                style={{
                                  padding: "0.5rem",
                                  backgroundColor: "#60a5fa",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                }}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleBloqueEstado(bloque)}
                                style={{
                                  padding: "0.5rem",
                                  backgroundColor: bloque.activo ? "#f59e0b" : "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                }}
                                title={bloque.activo ? "Desactivar" : "Activar"}
                              >
                                {bloque.activo ? (
                                  <XCircle size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteBloque(bloque.id)}
                                style={{
                                  padding: "0.5rem",
                                  backgroundColor: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                }}
                                title="Eliminar (solo si no tiene horarios)"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Formulario de nuevo/editar bloque */}
              {editingBloqueId !== null && (
                <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                    {editingBloqueId === 0 ? "Crear Nuevo Bloque" : "Editar Bloque"}
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                        Nombre del Bloque *
                      </label>
                      <input
                        type="text"
                        value={formDataBloque.nombre}
                        onChange={(e) => {
                          setFormDataBloque({ ...formDataBloque, nombre: e.target.value });
                          if (formErrorsBloque.nombre) setFormErrorsBloque({ ...formErrorsBloque, nombre: "" });
                        }}
                        placeholder="Ej: Primer Bloque, Segundo Bloque"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${formErrorsBloque.nombre ? "#ef4444" : "#d1d5db"}`,
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          boxSizing: "border-box",
                        }}
                      />
                      {formErrorsBloque.nombre && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrorsBloque.nombre}</p>}
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                        Número *
                      </label>
                      <input
                        type="number"
                        value={formDataBloque.numero_bloque}
                        onChange={(e) => {
                          setFormDataBloque({ ...formDataBloque, numero_bloque: e.target.value });
                          if (formErrorsBloque.numero_bloque) setFormErrorsBloque({ ...formErrorsBloque, numero_bloque: "" });
                        }}
                        placeholder="1"
                        min="1"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${formErrorsBloque.numero_bloque ? "#ef4444" : "#d1d5db"}`,
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          boxSizing: "border-box",
                        }}
                      />
                      {formErrorsBloque.numero_bloque && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrorsBloque.numero_bloque}</p>}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                        Hora Inicio *
                      </label>
                      <input
                        type="time"
                        value={formDataBloque.hora_inicio}
                        onChange={(e) => {
                          setFormDataBloque({ ...formDataBloque, hora_inicio: e.target.value });
                          if (formErrorsBloque.hora_inicio) setFormErrorsBloque({ ...formErrorsBloque, hora_inicio: "" });
                        }}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${formErrorsBloque.hora_inicio ? "#ef4444" : "#d1d5db"}`,
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          boxSizing: "border-box",
                        }}
                      />
                      {formErrorsBloque.hora_inicio && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrorsBloque.hora_inicio}</p>}
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                        Hora Fin *
                      </label>
                      <input
                        type="time"
                        value={formDataBloque.hora_fin}
                        onChange={(e) => {
                          setFormDataBloque({ ...formDataBloque, hora_fin: e.target.value });
                          if (formErrorsBloque.hora_fin) setFormErrorsBloque({ ...formErrorsBloque, hora_fin: "" });
                        }}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${formErrorsBloque.hora_fin ? "#ef4444" : "#d1d5db"}`,
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          boxSizing: "border-box",
                        }}
                      />
                      {formErrorsBloque.hora_fin && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>{formErrorsBloque.hora_fin}</p>}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formDataBloque.activo}
                        onChange={(e) => setFormDataBloque({ ...formDataBloque, activo: e.target.checked })}
                        style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                      />
                      <span style={{ fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>Activo</span>
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => {
                        resetFormBloque();
                        if (bloques.length === 0) setShowModalBloques(false);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        backgroundColor: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      {bloques.length === 0 ? "Cerrar" : "Cancelar"}
                    </button>
                    <button
                      onClick={handleSaveBloque}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontWeight: "600",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Guardando..." : (editingBloqueId === 0 ? "Crear" : "Actualizar")}
                    </button>
                  </div>
                </div>
              )}

              {/* Botón cerrar cuando no está editando */}
              {editingBloqueId === null && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowModalBloques(false)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#e5e7eb",
                      color: "#374151",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
