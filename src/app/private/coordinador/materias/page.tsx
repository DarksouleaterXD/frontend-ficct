"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { canAccess, hasPermission } from "@/lib/auth";

interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  carrera_id?: number;
  carrera?: {
    id: number;
    nombre: string;
  };
  horas_semana: number;
  activo: "activo" | "inactivo";
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  data: Materia[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Carrera {
  id: number;
  nombre: string;
}

export default function MateriasPage() {
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    carrera_id: "",
    horas_semana: "",
    activo: "activo" as "activo" | "inactivo",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Proteger ruta según rol
  useEffect(() => {
    if (!canAccess(["admin", "coordinador"])) {
      router.push("/");
    }
  }, [router]);

  // Cargar carreras (para el dropdown)
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/carreras?all=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCarreras(data.data || []);
        }
      } catch (err) {
        console.error("Error cargando carreras:", err);
      }
    };

    if (typeof window !== "undefined") {
      fetchCarreras();
    }
  }, [API_URL]);

  // Obtener listado de materias
  const fetchMaterias = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/materias`);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al cargar materias");

      const data: PaginatedResponse = await response.json();
      // Normalizar estado de todas las materias
      const materiasNormalizadas = data.data.map(m => ({
        ...m,
        activo: (typeof m.activo === "boolean" ? (m.activo ? "activo" : "inactivo") :
                 typeof m.activo === "number" ? (m.activo === 1 ? "activo" : "inactivo") :
                 typeof m.activo === "string" ? (m.activo.toLowerCase() === "activo" ? "activo" : "inactivo") :
                 "inactivo") as "activo" | "inactivo"
      }));
      setMaterias(materiasNormalizadas);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Crear o actualizar materia
  const handleSaveMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.codigo || !formData.nombre || !formData.horas_semana) {
        throw new Error("Campos obligatorios incompletos");
      }

      if (parseInt(formData.horas_semana) <= 0 || parseInt(formData.horas_semana) > 40) {
        throw new Error("Horas por semana debe estar entre 1 y 40");
      }

      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/materias/${editingId}` : `${API_URL}/materias`;

      // Preparar datos a enviar
      const bodyData: Record<string, string | number> = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        horas_semana: parseInt(formData.horas_semana),
      };

      // Agregar carrera_id solo si hay valor
      if (formData.carrera_id) {
        bodyData.carrera_id = parseInt(formData.carrera_id);
      }

      // En edición, solo enviar activo si cambió
      if (editingId) {
        // Buscar la materia original para comparar
        const materiaOriginal = materias.find(m => m.id === editingId);
        if (materiaOriginal && materiaOriginal.activo !== formData.activo) {
          bodyData.activo = formData.activo;
        }
      } else {
        // En creación, siempre enviar activo
        bodyData.activo = formData.activo;
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar materia");
      }

      setSuccess(editingId ? "Materia actualizada correctamente" : "Materia creada correctamente");
      setShowModal(false);
      setEditingId(null);
      setFormData({ codigo: "", nombre: "", carrera_id: "", horas_semana: "", activo: "activo" });
      
      setTimeout(() => {
        setSuccess(null);
        // Mantener en la página actual si estamos editando, ir a página 1 si creamos
        fetchMaterias(editingId ? currentPage : 1, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar materia
  const handleDeleteMateria = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta materia?")) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/materias/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al eliminar materia");

      setSuccess("Materia eliminada correctamente");
      fetchMaterias(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Editar materia
  const handleEditMateria = (materia: Materia) => {
    setFormData({
      codigo: materia.codigo,
      nombre: materia.nombre,
      carrera_id: materia.carrera_id?.toString() || "",
      horas_semana: materia.horas_semana.toString(),
      activo: materia.activo,
    });
    setEditingId(materia.id);
    setShowModal(true);
  };

  // Buscar materias
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchMaterias(1, value);
  };

  // Cargar datos inicialmente
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchMaterias();
    }
  }, [fetchMaterias]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0, marginBottom: "0.5rem" }}>
            Gestionar Materias
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Administra el catálogo de materias disponibles en la institución
          </p>
        </div>
        {hasPermission("materias.crear") && (
          <button
            onClick={() => {
              setFormData({ codigo: "", nombre: "", carrera_id: "", horas_semana: "", activo: "activo" });
              setEditingId(null);
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            <Plus size={20} />
            Nueva Materia
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "0.5rem", color: "#dc2626" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "1rem", backgroundColor: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", color: "#16a34a" }}>
          {success}
        </div>
      )}

      {/* Búsqueda */}
      <div style={{ display: "flex", gap: "1rem", backgroundColor: "white", padding: "1rem", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
        <Search size={20} style={{ color: "#6b7280", marginTop: "0.5rem" }} />
        <input
          type="text"
          placeholder="Buscar por código, nombre..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            flex: 1,
            padding: "0.75rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: "white", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Código</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Nombre</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Carrera</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Horas/Semana</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && !materias.length ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    Cargando...
                  </td>
                </tr>
              ) : materias.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    No hay materias registradas
                  </td>
                </tr>
              ) : (
                materias.map((materia) => (
                  <tr key={materia.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontFamily: "monospace" }}>
                      {materia.codigo}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937" }}>
                      {materia.nombre}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280" }}>
                      {materia.carrera?.nombre || "-"}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                      {materia.horas_semana}h
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {hasPermission("materias.editar") && (
                          <button
                            onClick={() => handleEditMateria(materia)}
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
                        )}
                        {hasPermission("materias.eliminar") && (
                          <button
                            onClick={() => handleDeleteMateria(materia.id)}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page);
                fetchMaterias(page, searchTerm);
              }}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: currentPage === page ? "#3b82f6" : "#e5e7eb",
                color: currentPage === page ? "white" : "#374151",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: currentPage === page ? "600" : "400",
              }}
            >
              {page}
            </button>
          ))}
        </div>
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
            zIndex: 1000,
          }}
          onClick={() => {
            setShowModal(false);
            setEditingId(null);
            setFormData({ codigo: "", nombre: "", carrera_id: "", horas_semana: "", activo: "activo" });
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "1.5rem", color: "#1f2937", margin: 0 }}>
              {editingId ? "Editar Materia" : "Nueva Materia"}
            </h2>

            <form onSubmit={handleSaveMateria} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Código */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="ej. MAT101"
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
                <small style={{ color: "#6b7280" }}>Código único (ej: MAT101, FIS201)</small>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Matemática Aplicada"
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

              {/* Carrera */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Carrera
                </label>
                <select
                  value={formData.carrera_id}
                  onChange={(e) => setFormData({ ...formData, carrera_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Seleccionar carrera (opcional)</option>
                  {carreras.map((carrera) => (
                    <option key={carrera.id} value={carrera.id}>
                      {carrera.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horas por Semana */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Horas por Semana *
                </label>
                <input
                  type="number"
                  value={formData.horas_semana}
                  onChange={(e) => setFormData({ ...formData, horas_semana: e.target.value })}
                  placeholder="ej. 4"
                  min="1"
                  max="40"
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
                <small style={{ color: "#6b7280" }}>Entre 1 y 40 horas</small>
              </div>

              {/* Estado - OCULTO */}
              <div style={{ display: "none" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Estado *
                </label>
                <select
                  value={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.value as "activo" | "inactivo" })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({ codigo: "", nombre: "", carrera_id: "", horas_semana: "", activo: "activo" });
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
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
                    fontWeight: "500",
                    fontSize: "14px",
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
