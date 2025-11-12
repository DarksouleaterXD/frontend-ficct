"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, Search } from "lucide-react";
import ModalCarrera from "./ModalCarrera";
import TablaCarreras from "./TablaCarreras";
import { hasPermission } from "@/lib/auth";

interface Carrera {
  id?: number;
  nombre: string;
  codigo: string;
  plan: string;
  version: string;
  created_at?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Carrera[] | Carrera;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  errors?: Record<string, string[]>;
}

export default function CarrerasPage() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | undefined>();

  // Fetch carreras
  const fetchCarreras = useCallback(async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/carreras?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener carreras");
      }

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setCarreras(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.last_page);
        }
      } else {
        setError("No se pudieron cargar las carreras");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener carreras"
      );
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  // Create or Update carrera
  const handleSaveCarrera = async (carrera: Carrera) => {
    const token = localStorage.getItem("token");

    try {
      const url = isEditMode && carrera.id ? `/carreras/${carrera.id}` : "/carreras";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${url}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(carrera),
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          `Error al ${isEditMode ? "actualizar" : "crear"} carrera`
        );
        return;
      }

      setSuccess(
        data.message ||
        `Carrera ${isEditMode ? "actualizada" : "creada"} exitosamente`
      );

      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedCarrera(undefined);

      // Reload carreras
      fetchCarreras(currentPage, search);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar carrera"
      );
    }
  };

  // Delete carrera
  const handleDeleteCarrera = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta carrera?")) return;

    setDeleteLoading(id);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/carreras/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al eliminar carrera");
        return;
      }

      setSuccess(data.message || "Carrera eliminada exitosamente");
      fetchCarreras(currentPage, search);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar carrera"
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearch(term);
    setCurrentPage(1);
  };

  // Handle edit
  const handleEdit = (carrera: Carrera) => {
    setSelectedCarrera(carrera);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle new
  const handleNew = () => {
    setSelectedCarrera(undefined);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Initial load and when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCarreras(currentPage, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentPage, fetchCarreras]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Carreras
        </h1>
        {hasPermission("carreras.crear") && (
          <button
            onClick={handleNew}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            + Nueva Carrera
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle color="#dc2626" size={20} style={{ marginTop: "0.125rem" }} />
          <p style={{ color: "#991b1b", margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <CheckCircle color="#16a34a" size={20} style={{ marginTop: "0.125rem" }} />
          <p style={{ color: "#15803d", margin: 0 }}>{success}</p>
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Search color="#6b7280" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o sigla..."
            value={search}
            onChange={handleSearch}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "1rem",
              backgroundColor: "transparent",
            }}
          />
        </div>
      </div>

      {/* Tabla */}
      <TablaCarreras
        carreras={carreras}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteCarrera}
        deletingId={deleteLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
              color: currentPage === 1 ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: currentPage === page ? "#3b82f6" : "#e5e7eb",
                color: currentPage === page ? "white" : "#374151",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
              color: currentPage === totalPages ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      <ModalCarrera
        isOpen={isModalOpen}
        isEdit={isEditMode}
        carrera={selectedCarrera}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedCarrera(undefined);
        }}
        onSave={handleSaveCarrera}
        isLoading={loading}
      />
    </div>
  );
}
