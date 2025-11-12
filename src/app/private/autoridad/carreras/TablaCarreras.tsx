"use client";

import { Trash2, Edit2 } from "lucide-react";
import { hasPermission } from "@/lib/auth";

interface Carrera {
  id?: number;
  nombre: string;
  codigo: string;
  plan: string;
  version: string;
  created_at?: string;
  updated_at?: string;
}

interface TablaCarrerasProps {
  carreras: Carrera[];
  isLoading: boolean;
  onEdit: (carrera: Carrera) => void;
  onDelete: (id: number) => void;
  deletingId?: number | null;
}

export default function TablaCarreras({
  carreras,
  isLoading,
  onEdit,
  onDelete,
  deletingId,
}: TablaCarrerasProps) {
  if (isLoading && carreras.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6b7280" }}>Cargando carreras...</p>
      </div>
    );
  }

  if (carreras.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6b7280" }}>No se encontraron carreras</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
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
                Nombre
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Código
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Plan
              </th>
              <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                Versión
              </th>
              {(hasPermission("carreras.editar") || hasPermission("carreras.eliminar")) && (
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {carreras.map((carrera, index) => (
              <tr
                key={carrera.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f9fafb";
                }}
              >
                <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "500" }}>
                  {carrera.nombre}
                </td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#dbeafe",
                      color: "#0c4a6e",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {carrera.codigo}
                  </span>
                </td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#fef08a",
                      color: "#713f12",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {carrera.plan}
                  </span>
                </td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {carrera.version}
                  </span>
                </td>
                {(hasPermission("carreras.editar") || hasPermission("carreras.eliminar")) && (
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      {hasPermission("carreras.editar") && (
                        <button
                          onClick={() => onEdit(carrera)}
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
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                      )}
                      {hasPermission("carreras.eliminar") && (
                        <button
                          onClick={() => carrera.id && onDelete(carrera.id)}
                          disabled={deletingId === carrera.id || !carrera.id}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            cursor: deletingId === carrera.id || !carrera.id ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "background-color 0.2s ease",
                            opacity: deletingId === carrera.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (deletingId !== carrera.id && carrera.id) {
                              e.currentTarget.style.backgroundColor = "#dc2626";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deletingId !== carrera.id && carrera.id) {
                              e.currentTarget.style.backgroundColor = "#ef4444";
                            }
                          }}
                        >
                          <Trash2 size={16} />
                          {deletingId === carrera.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      )}
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
}
