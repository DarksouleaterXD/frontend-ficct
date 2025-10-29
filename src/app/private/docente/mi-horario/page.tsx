"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Calendar, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Bloque {
  id: number;
  numero: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

interface ClaseHorario {
  id: number;
  grupo: number;
  materia: string;
  aula: string;
  paralelo: string;
}

interface FilaGrilla {
  bloque_id: number;
  bloque_numero: number;
  bloque_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  Lunes: ClaseHorario | null;
  Martes: ClaseHorario | null;
  Miércoles: ClaseHorario | null;
  Jueves: ClaseHorario | null;
  Viernes: ClaseHorario | null;
}

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Docente {
  id: number;
  nombre: string;
}

interface HorarioResponse {
  success: boolean;
  data: FilaGrilla[];
  periodo: Periodo;
  docente: Docente;
  bloques: Bloque[];
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function MiHorarioPage() {
  const [grilla, setGrilla] = useState<FilaGrilla[]>([]);
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [docente, setDocente] = useState<Docente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const fetchMiHorario = useCallback(async (periodoId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/mi-horario`);
      if (periodoId) url.searchParams.append("id_periodo", periodoId);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar horario");
      }

      const data: HorarioResponse = await response.json();

      if (!data.success) {
        setError(data.message || "Error al cargar horario");
        return;
      }

      setGrilla(data.data || []);
      setPeriodo(data.periodo);
      setDocente(data.docente);

      if (data.data.length === 0) {
        setSuccess(data.message || "Sin carga asignada para este periodo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPeriodos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/periodos?per_page=999`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPeriodos(data.data || []);
        
        // Seleccionar el periodo vigente por defecto
        const vigente = (data.data || []).find((p: Periodo) => p.id > 0);
        if (vigente) {
          setSelectedPeriodo(vigente.id.toString());
        }
      }
    } catch (err) {
      console.error("Error cargando periodos:", err);
    }
  }, []);

  const handleExportarPDF = () => {
    if (!grilla || grilla.length === 0) {
      setError("No hay horario para exportar");
      return;
    }

    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mi Horario - ${docente?.nombre}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #3b82f6;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            border: 1px solid #ddd;
            padding: 10px;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .bloque-header {
            background-color: #e5e7eb;
            font-weight: 600;
          }
          .clase {
            text-align: center;
            font-size: 12px;
          }
          .clase-content {
            background-color: #dbeafe;
            padding: 8px;
            border-radius: 4px;
          }
          .materia {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .aula {
            font-size: 11px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Horario Semanal</h1>
          <p><strong>Docente:</strong> ${docente?.nombre}</p>
          <p><strong>Periodo:</strong> ${periodo?.nombre}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES")}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Bloque</th>
              <th>Hora Inicio</th>
              <th>Hora Fin</th>
              ${diasSemana.map((dia) => `<th>${dia}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${grilla
              .map(
                (fila) => `
              <tr class="bloque-header">
                <td colspan="${5 + diasSemana.length}">
                  ${fila.bloque_nombre} (Bloque ${fila.bloque_numero})
                </td>
              </tr>
              <tr>
                <td><strong>${fila.bloque_numero}</strong></td>
                <td>${fila.hora_inicio}</td>
                <td>${fila.hora_fin}</td>
                ${diasSemana
                  .map((dia) => {
                    const clase = fila[dia as keyof FilaGrilla];
                    if (clase && typeof clase === "object" && "materia" in clase) {
                      return `
                        <td class="clase">
                          <div class="clase-content">
                            <div class="materia">${clase.materia}</div>
                            <div class="aula">Grupo: ${clase.grupo}</div>
                            <div class="aula">Aula: ${clase.aula}</div>
                          </div>
                        </td>
                      `;
                    }
                    return "<td></td>";
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Abre en nueva ventana para imprimir/guardar como PDF
    const ventana = window.open("", "pdf_window");
    if (ventana) {
      ventana.document.write(htmlContent);
      ventana.document.close();
      setTimeout(() => ventana.print(), 250);
    }

    setSuccess("Horario abierto para descargar/imprimir");
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    fetchPeriodos();
  }, [fetchPeriodos]);

  useEffect(() => {
    fetchMiHorario(selectedPeriodo);
  }, [selectedPeriodo, fetchMiHorario]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Mi Horario Semanal
          </h1>
          {docente && (
            <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
              {docente.nombre}
            </p>
          )}
        </div>
        <button
          onClick={handleExportarPDF}
          disabled={!grilla || grilla.length === 0}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: grilla && grilla.length > 0 ? "pointer" : "not-allowed",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity: grilla && grilla.length > 0 ? 1 : 0.5,
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (grilla && grilla.length > 0) {
              e.currentTarget.style.backgroundColor = "#059669";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#10b981";
          }}
        >
          <Download size={20} />
          Exportar a PDF
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Selector de Periodo */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "1.5rem",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "600",
            marginBottom: "0.5rem",
            color: "#374151",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Calendar size={18} />
          Selecciona Periodo
        </label>
        <select
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "300px",
            padding: "0.75rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">-- Selecciona un periodo --</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {p.id.toString() === selectedPeriodo ? " (Actual)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Información del Periodo */}
      {periodo && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Periodo
            </p>
            <p style={{ fontSize: "1.125rem", fontWeight: "600", margin: "0.5rem 0 0 0" }}>
              {periodo.nombre}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Inicio
            </p>
            <p style={{ fontSize: "1rem", margin: "0.5rem 0 0 0" }}>
              {new Date(periodo.fecha_inicio).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Fin
            </p>
            <p style={{ fontSize: "1rem", margin: "0.5rem 0 0 0" }}>
              {new Date(periodo.fecha_fin).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
      )}

      {/* Grilla de Horarios */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            <Clock style={{ animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
            Cargando horario...
          </div>
        ) : grilla.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#6b7280",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <AlertCircle size={48} color="#f59e0b" />
            <div>
              <p style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>
                Sin carga asignada
              </p>
              <p style={{ fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                No hay horarios para este periodo
              </p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "100px",
                    }}
                  >
                    Bloque
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "80px",
                    }}
                  >
                    Inicio
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "80px",
                    }}
                  >
                    Fin
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia}
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                        minWidth: "150px",
                      }}
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grilla.map((fila, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#1f2937",
                        backgroundColor: "#f3f4f6",
                      }}
                    >
                      <div>{fila.bloque_nombre}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        #{fila.bloque_numero}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                    }}
                    >
                      {fila.hora_inicio}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}
                    >
                      {fila.hora_fin}
                    </td>
                    {diasSemana.map((dia) => {
                      const clase = fila[dia as keyof FilaGrilla];
                      const tieneClase = clase && typeof clase === "object" && "materia" in clase;

                      return (
                        <td
                          key={`${idx}-${dia}`}
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                          }}
                        >
                          {tieneClase && clase && typeof clase === "object" && "materia" in clase ? (
                            <div
                              style={{
                                backgroundColor: "#dbeafe",
                                border: "1px solid #bfdbfe",
                                borderRadius: "0.375rem",
                                padding: "0.75rem",
                                color: "#1e40af",
                              }}
                            >
                              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                                {clase.materia}
                              </div>
                              <div style={{ fontSize: "0.65rem", marginBottom: "0.25rem" }}>
                                Grupo {clase.grupo} - {clase.paralelo}
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "#1e3a8a" }}>
                                Aula {clase.aula}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "#d1d5db", fontSize: "0.75rem" }}>—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leyenda */}
      {grilla.length > 0 && (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            📌 Leyenda:
          </p>
          <ul style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, paddingLeft: "1.5rem" }}>
            <li>Las celdas azules muestran tus clases asignadas</li>
            <li>Cada clase muestra la materia, grupo, paralelo y aula</li>
            <li>Las celdas vacías indican que no tienes clase en esa franja</li>
          </ul>
        </div>
      )}
    </div>
  );
}
