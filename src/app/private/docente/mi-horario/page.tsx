"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Users, 
  DoorOpen, 
  CalendarDays,
  FileDown,
  Info
} from "lucide-react";

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

  // Función para formatear hora desde timestamp
  const formatearHora = (horaString: string): string => {
    if (!horaString) return '';
    
    // Si viene como timestamp ISO (2025-11-12T07:00:00.000000Z)
    if (horaString.includes('T')) {
      const timePart = horaString.split('T')[1]; // "07:00:00.000000Z"
      const hourMin = timePart.split(':').slice(0, 2).join(':'); // "07:00"
      return hourMin;
    }
    
    // Si viene como HH:MM:SS, extraer solo HH:MM
    if (horaString.includes(':')) {
      const partes = horaString.split(':');
      return `${partes[0]}:${partes[1]}`;
    }
    
    return horaString;
  };

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
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <CalendarDays size={36} color="#3b82f6" />
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
          <FileDown size={20} />
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
            display: "flex",
            fontSize: "0.875rem",
            fontWeight: "600",
            marginBottom: "0.5rem",
            color: "#374151",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Calendar size={18} color="#3b82f6" />
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
                <tr style={{ backgroundColor: "#1f2937", borderBottom: "2px solid #374151" }}>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#ffffff",
                      minWidth: "120px",
                    }}
                  >
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "0.5rem" 
                    }}>
                      <Clock size={18} />
                      HORARIO
                    </div>
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia}
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        color: "#ffffff",
                        minWidth: "200px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grilla
                  .filter((fila) => 
                    // Solo mostrar filas que tengan al menos una clase
                    diasSemana.some((dia) => {
                      const clase = fila[dia as keyof FilaGrilla];
                      return clase && typeof clase === "object" && "materia" in clase;
                    })
                  )
                  .map((fila, idx) => {
                    // Generar un color basado en el nombre de la materia
                    const getColorForMateria = (materia: string) => {
                      const colors = [
                        { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" }, // Azul
                        { bg: "#fce7f3", border: "#ec4899", text: "#831843" }, // Rosa
                        { bg: "#d1fae5", border: "#10b981", text: "#065f46" }, // Verde
                        { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" }, // Amarillo
                        { bg: "#e0e7ff", border: "#6366f1", text: "#312e81" }, // Índigo
                        { bg: "#fce4ec", border: "#f06292", text: "#880e4f" }, // Rosa fuerte
                      ];
                      const hash = materia.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      return colors[hash % colors.length];
                    };

                    return (
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
                            padding: "1.25rem",
                            fontSize: "0.95rem",
                            fontWeight: "700",
                            color: "#1f2937",
                            backgroundColor: "#f3f4f6",
                            borderRight: "2px solid #e5e7eb",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatearHora(fila.hora_inicio)} - {formatearHora(fila.hora_fin)}
                        </td>
                        {diasSemana.map((dia) => {
                          const clase = fila[dia as keyof FilaGrilla];
                          const tieneClase = clase && typeof clase === "object" && "materia" in clase;

                          return (
                            <td
                              key={`${idx}-${dia}`}
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                fontSize: "0.75rem",
                                backgroundColor: tieneClase ? "#fafafa" : "#ffffff",
                              }}
                            >
                              {tieneClase && clase && typeof clase === "object" && "materia" in clase ? (
                                <div
                                  style={{
                                    backgroundColor: getColorForMateria(clase.materia).bg,
                                    borderLeft: `4px solid ${getColorForMateria(clase.materia).border}`,
                                    borderRadius: "0.5rem",
                                    padding: "1rem 0.75rem",
                                    color: getColorForMateria(clase.materia).text,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    transition: "all 0.2s ease",
                                    cursor: "default",
                                    minHeight: "80px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.02)";
                                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: "700", 
                                    marginBottom: "0.5rem",
                                    fontSize: "0.85rem",
                                    lineHeight: "1.2",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.4rem"
                                  }}>
                                    <BookOpen size={16} />
                                    {clase.materia}
                                  </div>
                                  <div style={{ 
                                    fontSize: "0.75rem", 
                                    marginBottom: "0.4rem",
                                    opacity: 0.9,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.35rem"
                                  }}>
                                    <Users size={14} />
                                    Grupo {clase.grupo} - {clase.paralelo}
                                  </div>
                                  <div style={{ 
                                    fontSize: "0.75rem", 
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.35rem"
                                  }}>
                                    <DoorOpen size={14} />
                                    Aula {clase.aula}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ 
                                  color: "#d1d5db", 
                                  fontSize: "1.25rem",
                                  padding: "1.5rem",
                                  minHeight: "80px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}>
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
            padding: "1.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem",
            marginBottom: "1rem"
          }}>
            <Info size={24} color="#3b82f6" />
            <p style={{ 
              fontSize: "1rem", 
              fontWeight: "700", 
              margin: 0,
              color: "#1f2937"
            }}>
              Información del Horario
            </p>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "start", 
              gap: "0.75rem",
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb"
            }}>
              <BookOpen size={24} color="#3b82f6" />
              <div>
                <p style={{ 
                  fontSize: "0.875rem", 
                  fontWeight: "600", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  Materias asignadas
                </p>
                <p style={{ 
                  fontSize: "0.75rem", 
                  color: "#6b7280", 
                  margin: "0.25rem 0 0 0" 
                }}>
                  Las tarjetas de colores indican tus clases
                </p>
              </div>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "start", 
              gap: "0.75rem",
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb"
            }}>
              <Users size={24} color="#10b981" />
              <div>
                <p style={{ 
                  fontSize: "0.875rem", 
                  fontWeight: "600", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  Grupo y Paralelo
                </p>
                <p style={{ 
                  fontSize: "0.75rem", 
                  color: "#6b7280", 
                  margin: "0.25rem 0 0 0" 
                }}>
                  Identificación del grupo de estudiantes
                </p>
              </div>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "start", 
              gap: "0.75rem",
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb"
            }}>
              <DoorOpen size={24} color="#f59e0b" />
              <div>
                <p style={{ 
                  fontSize: "0.875rem", 
                  fontWeight: "600", 
                  margin: 0,
                  color: "#1f2937"
                }}>
                  Ubicación del aula
                </p>
                <p style={{ 
                  fontSize: "0.75rem", 
                  color: "#6b7280", 
                  margin: "0.25rem 0 0 0" 
                }}>
                  Aula donde se imparte la clase
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
