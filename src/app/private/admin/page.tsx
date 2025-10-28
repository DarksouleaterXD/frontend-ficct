"use client";

import { useState } from "react";
import { Clock, Building2, Book, Users2 } from "lucide-react";

interface UserData {
  name?: string;
  email?: string;
  rol?: string;
}

export default function DashboardPage() {
  const [user] = useState<UserData | null>(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [rol] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rol");
    }
    return null;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: "#ffffff", 
        borderRadius: "0.75rem", 
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", 
        border: "1px solid #e5e7eb",
        padding: "1.5rem", 
        borderLeft: "4px solid #3b82f6"
      }}>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem", margin: 0 }}>
          Bienvenido al Dashboard
        </h1>
        {user && (
          <div>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Hola, <span style={{ fontWeight: "600", color: "#3b82f6" }}>{user.name}</span>
            </p>
            <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "0.5rem", margin: 0 }}>
              Rol: <span style={{ fontWeight: "600", color: "#374151" }}>{rol}</span>
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                Horarios
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginTop: "0.5rem", margin: 0 }}>
                0
              </p>
            </div>
            <div style={{ color: "#3b82f6", opacity: 0.3 }}>
              <Clock size={36} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                Aulas
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginTop: "0.5rem", margin: 0 }}>
                0
              </p>
            </div>
            <div style={{ color: "#3b82f6", opacity: 0.3 }}>
              <Building2 size={36} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                Materias
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginTop: "0.5rem", margin: 0 }}>
                0
              </p>
            </div>
            <div style={{ color: "#3b82f6", opacity: 0.3 }}>
              <Book size={36} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                Docentes
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginTop: "0.5rem", margin: 0 }}>
                0
              </p>
            </div>
            <div style={{ color: "#3b82f6", opacity: 0.3 }}>
              <Users2 size={36} />
            </div>
          </div>
        </div>
      </div>

      {/* Bienvenida */}
      <div style={{ 
        background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)", 
        borderRadius: "0.75rem", 
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", 
        padding: "2rem", 
        color: "#ffffff"
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "0.5rem", margin: 0 }}>
          Sistema de Gestión Académica
        </h2>
        <p style={{ color: "#dbeafe", margin: "0.5rem 0 0 0" }}>
          Utiliza el menú lateral para acceder a los diferentes módulos del sistema. 
          Gestiona horarios, aulas, materias, grupos, carreras, docentes, asistencia y más.
        </p>
      </div>
    </div>
  );
}
