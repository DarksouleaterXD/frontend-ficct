"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle } from "lucide-react";

interface BloqueHorario {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  numero_bloque: number;
  activo: boolean;
}

interface BloqueHorarioSelectorProps {
  value: string;
  onChange: (bloqueId: string) => void;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function BloqueHorarioSelector({
  value,
  onChange,
  error,
}: BloqueHorarioSelectorProps) {
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBloques = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/bloques-horarios?per_page=100&activo=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const sorted = (data.data || []).sort(
            (a: BloqueHorario, b: BloqueHorario) => a.numero_bloque - b.numero_bloque
          );
          setBloques(sorted);
        }
      } catch (err) {
        console.error("Error cargando bloques:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBloques();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
        Cargando bloques horarios...
      </div>
    );
  }

  if (bloques.length === 0) {
    return (
      <div
        style={{
          padding: "1rem",
          textAlign: "center",
          backgroundColor: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: "0.5rem",
          color: "#92400e",
          fontSize: "0.875rem",
        }}
      >
        No hay bloques horarios activos. Por favor, crea bloques horarios primero.
      </div>
    );
  }

  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "0.75rem",
          fontWeight: "600",
          color: "#374151",
          fontSize: "0.875rem",
        }}
      >
        Bloque Horario *
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {bloques.map((bloque) => {
          const isSelected = value === bloque.id.toString();
          const [hI, mI] = bloque.hora_inicio.split(":").map(Number);
          const [hF, mF] = bloque.hora_fin.split(":").map(Number);
          const duracionMinutos = hF * 60 + mF - (hI * 60 + mI);
          const horas = Math.floor(duracionMinutos / 60);
          const minutos = duracionMinutos % 60;
          const duracion = `${horas}h ${minutos > 0 ? minutos + "m" : ""}`.trim();

          return (
            <div
              key={bloque.id}
              onClick={() => onChange(bloque.id.toString())}
              style={{
                backgroundColor: isSelected ? "#dbeafe" : "white",
                border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#9ca3af";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                  }}
                >
                  <CheckCircle size={18} color="#3b82f6" fill="#3b82f6" />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: isSelected ? "#3b82f6" : "#e0e7ff",
                    color: isSelected ? "white" : "#3730a3",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                  }}
                >
                  Bloque {bloque.numero_bloque}
                </span>
              </div>

              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "0.375rem",
                }}
              >
                {bloque.nombre}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontFamily: "monospace",
                  marginBottom: "0.25rem",
                }}
              >
                <Clock size={12} />
                <span>
                  {bloque.hora_inicio} - {bloque.hora_fin}
                </span>
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                Duración: {duracion}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>
      )}
    </div>
  );
}
