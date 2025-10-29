"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Carrera {
  id?: number;
  nombre: string;
  codigo: string;
  plan: string;
  version: string;
}

interface ModalCarreraProps {
  isOpen: boolean;
  isEdit: boolean;
  carrera?: Carrera;
  onClose: () => void;
  onSave: (carrera: Carrera) => void;
  isLoading: boolean;
}

export default function ModalCarrera({
  isOpen,
  isEdit,
  carrera,
  onClose,
  onSave,
  isLoading,
}: ModalCarreraProps) {
  const [formData, setFormData] = useState<Carrera>({
    nombre: "",
    codigo: "",
    plan: "",
    version: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data based on modal state
  useEffect(() => {
    const initializeForm = () => {
      if (isEdit && carrera) {
        setFormData({
          id: carrera.id,
          nombre: carrera.nombre,
          codigo: carrera.codigo,
          plan: carrera.plan,
          version: carrera.version,
        });
      } else {
        setFormData({ nombre: "", codigo: "", plan: "", version: "" });
      }
      setErrors({});
    };

    initializeForm();
  }, [isOpen, isEdit, carrera]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código es requerido";
    }
    if (!formData.plan.trim()) {
      newErrors.plan = "El plan es requerido";
    }
    if (!formData.version.trim()) {
      newErrors.version = "La versión es requerida";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
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
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            padding: "2rem",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
              {isEdit ? "Editar Carrera" : "Nueva Carrera"}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={24} color="#6b7280" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Nombre */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Ingeniería en Sistemas"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.nombre ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
              {errors.nombre && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.nombre}</p>}
            </div>

            {/* Código */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej: ISI"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.codigo ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
              {errors.codigo && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.codigo}</p>}
            </div>

            {/* Plan */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
                Plan *
              </label>
              <input
                type="text"
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                placeholder="Ej: Plan 2024"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.plan ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
              {errors.plan && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.plan}</p>}
            </div>

            {/* Versión */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
                Versión *
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="Ej: 1.0"
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.version ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
              {errors.version && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.version}</p>}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = "#1e40af";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = "#3b82f6";
                }}
              >
                {isLoading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
