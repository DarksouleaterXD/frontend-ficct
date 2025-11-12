"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface BloqueHorario {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  numero_bloque: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: BloqueHorario[] | BloqueHorario;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  errors?: Record<string, string[]>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function BloquesHorariosPage() {
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    hora_inicio: "",
    hora_fin: "",
    numero_bloque: 1,
    activo: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchBloques = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bloques-horarios?per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al obtener bloques");

      const data: ApiResponse = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const sortedBloques = (data.data as BloqueHorario[]).sort((a, b) => a.numero_bloque - b.numero_bloque);
        setBloques(sortedBloques);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener bloques");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveBloque = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.hora_inicio) {
      newErrors.hora_inicio = "La hora de inicio es requerida";
    }
    if (!formData.hora_fin) {
      newErrors.hora_fin = "La hora de fin es requerida";
    }
    if (formData.numero_bloque < 1) {
      newErrors.numero_bloque = "El número de bloque debe ser mayor a 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/bloques-horarios/${editingId}` : `${API_URL}/bloques-horarios`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          numero_bloque: formData.numero_bloque,
          activo: formData.activo,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al guardar bloque");
        return;
      }

      setSuccess(data.message || "Bloque horario guardado exitosamente");
      setShowModal(false);
      resetForm();
      await fetchBloques();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar bloque");
    }
  };

  const handleDeleteBloque = async (id: number) => {
    if (!confirm("¿Confirma que desea eliminar este bloque horario?")) return;

    setDeleteLoading(id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bloques-horarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar bloque");
        return;
      }

      setSuccess("Bloque horario eliminado exitosamente");
      await fetchBloques();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar bloque");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditBloque = (bloque: BloqueHorario) => {
    setEditingId(bloque.id);
    setFormData({
      nombre: bloque.nombre,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      numero_bloque: bloque.numero_bloque,
      activo: bloque.activo,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      hora_inicio: "",
      hora_fin: "",
      numero_bloque: bloques.length + 1,
      activo: true,
    });
    setEditingId(null);
    setFormErrors({});
  };

  useEffect(() => {
    fetchBloques();
  }, [fetchBloques]);

  const canEdit = canAccess(["admin"]);

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
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151", width: "80px" }}>
                  Bloque #
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                  Nombre
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Hora Inicio
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Hora Fin
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Duración
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Estado
                </th>
                {canEdit && (
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151", width: "180px" }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {bloques.map((bloque, index) => {
                const [hI, mI] = bloque.hora_inicio.split(":").map(Number);
                const [hF, mF] = bloque.hora_fin.split(":").map(Number);
                const duracionMinutos = (hF * 60 + mF) - (hI * 60 + mI);
                const horas = Math.floor(duracionMinutos / 60);
                const minutos = duracionMinutos % 60;
                const duracion = `${horas}h ${minutos > 0 ? minutos + 'm' : ''}`.trim();

                return (
                  <tr
                    key={bloque.id}
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
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#e0e7ff",
                          color: "#3730a3",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                          fontWeight: "700",
                        }}
                      >
                        {bloque.numero_bloque}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "600" }}>
                      {bloque.nombre}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "#6b7280",
                        fontFamily: "monospace",
                        fontWeight: "500",
                        fontSize: "0.95rem",
                      }}
                    >
                      {bloque.hora_inicio}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "#6b7280",
                        fontFamily: "monospace",
                        fontWeight: "500",
                        fontSize: "0.95rem",
                      }}
                    >
                      {bloque.hora_fin}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "#3b82f6",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      {duracion}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: bloque.activo ? "#dcfce7" : "#fee2e2",
                          color: bloque.activo ? "#166534" : "#991b1b",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                        }}
                      >
                        {bloque.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {canEdit && (
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEditBloque(bloque)}
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
                              fontWeight: "600",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                          >
                            <Edit2 size={14} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteBloque(bloque.id)}
                            disabled={deleteLoading === bloque.id}
                            style={{
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "0.375rem",
                              padding: "0.5rem 0.75rem",
                              cursor: deleteLoading === bloque.id ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              transition: "background-color 0.2s ease",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              opacity: deleteLoading === bloque.id ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (deleteLoading !== bloque.id) {
                                e.currentTarget.style.backgroundColor = "#dc2626";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (deleteLoading !== bloque.id) {
                                e.currentTarget.style.backgroundColor = "#ef4444";
                              }
                            }}
                          >
                            <Trash2 size={14} />
                            {deleteLoading === bloque.id ? "..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
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
            Bloques Horarios
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
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
              Nuevo Bloque
            </button>
          )}
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
          Cargando bloques horarios...
        </div>
      ) : bloques.length === 0 ? (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          No hay bloques horarios registrados
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
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 1.5rem 0", color: "#1f2937" }}>
              {editingId ? "Editar Bloque" : "Nuevo Bloque Horario"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
              {/* Nombre */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: "" });
                  }}
                  placeholder="Ej: Bloque 1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.nombre ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.nombre && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{formErrors.nombre}</p>}
              </div>

              {/* Hora Inicio */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Hora Inicio (HH:mm) *
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
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.hora_inicio && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{formErrors.hora_inicio}</p>}
              </div>

              {/* Hora Fin */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Hora Fin (HH:mm) *
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
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.hora_fin && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{formErrors.hora_fin}</p>}
              </div>

              {/* Número Bloque */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  Número de Bloque *
                </label>
                <input
                  type="number"
                  value={formData.numero_bloque}
                  onChange={(e) => {
                    setFormData({ ...formData, numero_bloque: parseInt(e.target.value) || 1 });
                    if (formErrors.numero_bloque) setFormErrors({ ...formErrors, numero_bloque: "" });
                  }}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${formErrors.numero_bloque ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.numero_bloque && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{formErrors.numero_bloque}</p>}
              </div>

              {/* Activo */}
              <div>
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
    </div>
  );
}
