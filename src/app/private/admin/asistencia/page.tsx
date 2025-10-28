"use client";

export default function AsistenciaPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Gestión de Asistencia
        </h1>
        <button style={{
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          transition: "background-color 0.3s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1e40af"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
        >
          Registrar Asistencia
        </button>
      </div>

      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        padding: "2rem",
        textAlign: "center"
      }}>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Módulo de Asistencia - En desarrollo
        </p>
      </div>
    </div>
  );
}
