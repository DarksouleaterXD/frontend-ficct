"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { canAccess } from "@/lib/auth";

interface Aula {
  id: number;
  codigo: string;
  nombre: string;
  tipo: "teorica" | "laboratorio";
  capacidad: number;
  ubicacion?: string;
  piso?: number;
  activo: "activo" | "inactivo";
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse {
  data: Aula[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AulasPage() {
  const router = useRouter();
  const [aulas, setAulas] = useState<Aula[]>([]);
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
    tipo: "teorica" as "teorica" | "laboratorio",
    capacidad: "",
    ubicacion: "",
    piso: "",
    activo: "activo" as "activo" | "inactivo",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Proteger ruta según rol
  useEffect(() => {
    if (!canAccess(["admin", "coordinador"])) {
      router.push("/");
    }
  }, [router]);

  // Obtener listado de aulas
  const fetchAulas = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/aulas`);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al cargar aulas");

      const data: PaginatedResponse = await response.json();
      
      // Normalizar estado de todas las aulas
      const aulasNormalizadas = data.data.map(a => ({
        ...a,
        activo: (typeof a.activo === "boolean" ? (a.activo ? "activo" : "inactivo") :
                 typeof a.activo === "number" ? (a.activo === 1 ? "activo" : "inactivo") :
                 typeof a.activo === "string" ? (a.activo.toLowerCase() === "activo" ? "activo" : "inactivo") :
                 "inactivo") as "activo" | "inactivo"
      }));
      
      setAulas(aulasNormalizadas);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Crear o actualizar aula
  const handleSaveAula = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.codigo || !formData.nombre || !formData.tipo || !formData.capacidad) {
        throw new Error("Campos obligatorios incompletos");
      }

      const capacidadNum = parseInt(formData.capacidad);
      if (capacidadNum <= 0 || capacidadNum > 500) {
        throw new Error("Capacidad debe estar entre 1 y 500");
      }

      const token = localStorage.getItem("token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/aulas/${editingId}` : `${API_URL}/aulas`;

      // Preparar datos a enviar
      const bodyData: Record<string, string | number | boolean> = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        tipo: formData.tipo,
        capacidad: capacidadNum,
      };

      // Agregar ubicación y piso solo si hay valor
      if (formData.ubicacion) {
        bodyData.ubicacion = formData.ubicacion;
      }
      if (formData.piso) {
        bodyData.piso = parseInt(formData.piso);
      }

      // En creación, siempre enviar activo
      if (!editingId) {
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
        throw new Error(data.message || "Error al guardar aula");
      }

      setSuccess(editingId ? "Aula actualizada correctamente" : "Aula creada correctamente");
      setShowModal(false);
      setEditingId(null);
      setFormData({ 
        codigo: "", 
        nombre: "", 
        tipo: "teorica", 
        capacidad: "", 
        ubicacion: "", 
        piso: "", 
        activo: "activo" 
      });
      
      setTimeout(() => {
        setSuccess(null);
        // Mantener en la página actual si estamos editando, ir a página 1 si creamos
        fetchAulas(editingId ? currentPage : 1, searchTerm);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar aula
  const handleDeleteAula = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta aula?")) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/aulas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Error al eliminar aula");

      setSuccess("Aula eliminada correctamente");
      fetchAulas(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Editar aula
  const handleEditAula = (aula: Aula) => {
    setFormData({
      codigo: aula.codigo,
      nombre: aula.nombre,
      tipo: aula.tipo,
      capacidad: aula.capacidad.toString(),
      ubicacion: aula.ubicacion || "",
      piso: aula.piso?.toString() || "",
      activo: aula.activo,
    });
    setEditingId(aula.id);
    setShowModal(true);
  };

  // Buscar aulas
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchAulas(1, value);
  };

  // Cargar datos inicialmente
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchAulas();
    }
  }, [fetchAulas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0, marginBottom: "0.5rem" }}>
            Gestionar Aulas
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Administra el catálogo de aulas disponibles en la institución
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ 
              codigo: "", 
              nombre: "", 
              tipo: "teorica", 
              capacidad: "", 
              ubicacion: "", 
              piso: "", 
              activo: "activo" 
            });
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
          Nueva Aula
        </button>
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
          placeholder="Buscar por código, nombre, ubicación..."
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
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Tipo</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Capacidad</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Número Aula</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Piso</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && !aulas.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    Cargando...
                  </td>
                </tr>
              ) : aulas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    No hay aulas registradas
                  </td>
                </tr>
              ) : (
                aulas.map((aula) => (
                  <tr key={aula.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontFamily: "monospace" }}>
                      {aula.codigo}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937" }}>
                      {aula.nombre}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#6b7280" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        backgroundColor: aula.tipo === "teorica" ? "#dbeafe" : "#fed7aa",
                        color: aula.tipo === "teorica" ? "#0c4a6e" : "#7c2d12",
                        borderRadius: "0.25rem",
                        fontSize: "12px",
                        fontWeight: "500",
                        textTransform: "capitalize"
                      }}>
                        {aula.tipo}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                      {aula.capacidad} personas
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontWeight: "500", fontFamily: "monospace" }}>
                      {aula.ubicacion || "-"}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
                      {aula.ubicacion ? `Piso ${parseInt(aula.ubicacion.toString().charAt(0))}` : "-"}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "14px" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEditAula(aula)}
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
                          onClick={() => handleDeleteAula(aula.id)}
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
                fetchAulas(page, searchTerm);
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
            setFormData({ 
              codigo: "", 
              nombre: "", 
              tipo: "teorica", 
              capacidad: "", 
              ubicacion: "", 
              piso: "", 
              activo: "activo" 
            });
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
              {editingId ? "Editar Aula" : "Nueva Aula"}
            </h2>

            <form onSubmit={handleSaveAula} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Código */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="ej. A101"
                  required
                  disabled={editingId !== null}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: editingId !== null ? "#f3f4f6" : "#ffffff",
                    cursor: editingId !== null ? "not-allowed" : "text",
                  }}
                />
                <small style={{ color: "#6b7280" }}>Código único (ej: A101, LAB-02)</small>
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
                  placeholder="ej. Aula de Clases A"
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

              {/* Tipo */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Tipo de Aula *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as "teorica" | "laboratorio" })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="teorica">Teórica</option>
                  <option value="laboratorio">Laboratorio</option>
                </select>
              </div>

              {/* Capacidad */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  placeholder="ej. 30"
                  min="1"
                  max="500"
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
                <small style={{ color: "#6b7280" }}>Entre 1 y 500 personas</small>
              </div>

              {/* Ubicación */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Número de Aula *
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="ej. 101, 205, 310"
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
                <small style={{ color: "#6b7280" }}>
                  Formato: 10-15 (Piso 1), 20-25 (Piso 2), 30-35 (Piso 3), 40-45 (Piso 4)
                </small>
              </div>

              {/* Piso - Calculado automáticamente */}
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Piso (automático)
                </label>
                <div
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280",
                  }}
                >
                  {formData.ubicacion ? `Piso ${parseInt(formData.ubicacion.charAt(0))}` : "Ingresa el número de aula"}
                </div>
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
                    setFormData({ 
                      codigo: "", 
                      nombre: "", 
                      tipo: "teorica", 
                      capacidad: "", 
                      ubicacion: "", 
                      piso: "", 
                      activo: "activo" 
                    });
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
