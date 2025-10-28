"use client";

export default function BitacoraPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
        Bitácora del Sistema
      </h1>

      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        padding: "2rem",
        textAlign: "center"
      }}>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Módulo de Bitácora - En desarrollo
        </p>
      </div>
    </div>
  );
}
