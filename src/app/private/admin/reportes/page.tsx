"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Filter, Calendar, BookOpen, Users, DoorOpen } from "lucide-react";

interface Periodo {
  id: number;
  nombre: string;
  vigente: boolean;
}

interface Carrera {
  id: number;
  nombre: string;
  sigla: string;
}

interface Docente {
  id: number;
  persona: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
  };
}

interface HorarioReporte {
  id: number;
  dias_semana: string[];
  bloque: {
    nombre: string;
    hora_inicio: string;
    hora_fin: string;
  };
  grupo: {
    codigo: string;
    materia: {
      nombre: string;
    };
  };
  aula: {
    numero_aula: string;
  };
  docente: {
    persona: {
      nombre: string;
      apellido_paterno: string;
    };
  };
}

interface AulaDisponible {
  id: number;
  numero_aula: string;
  capacidad: number;
  bloques_disponibles: Array<{
    bloque: string;
    hora_inicio: string;
    hora_fin: string;
    disponible: boolean;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState<"horarios" | "aulas">("horarios");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  
  // Filtros
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [selectedDocente, setSelectedDocente] = useState("");
  const [selectedDia, setSelectedDia] = useState("");
  
  // Datos
  const [horarios, setHorarios] = useState<HorarioReporte[]>([]);
  const [aulas, setAulas] = useState<AulaDisponible[]>([]);
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previsualizando, setPrevisualizando] = useState(false);

  const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Cargar catálogos
  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    const token = localStorage.getItem("token");
    try {
      const [periodosRes, carrerasRes, docentesRes] = await Promise.all([
        fetch(`${API_URL}/periodos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/carreras?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/docentes?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (periodosRes.ok) {
        const data = await periodosRes.json();
        setPeriodos(data.data || []);
        const vigente = data.data?.find((p: Periodo) => p.vigente);
        if (vigente) setSelectedPeriodo(vigente.id.toString());
      }

      if (carrerasRes.ok) {
        const data = await carrerasRes.json();
        setCarreras(data.data || []);
      }

      if (docentesRes.ok) {
        const data = await docentesRes.json();
        setDocentes(data.data || []);
      }
    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }
  };

  // Previsualizar reporte
  const handlePrevisualizar = async () => {
    if (!selectedPeriodo) {
      setError("Selecciona un periodo");
      return;
    }

    setError("");
    setLoading(true);
    setPrevisualizando(true);

    const token = localStorage.getItem("token");

    try {
      if (tipoReporte === "horarios") {
        const params = new URLSearchParams({
          periodo_id: selectedPeriodo,
          ...(selectedCarrera && { carrera_id: selectedCarrera }),
          ...(selectedDocente && { docente_id: selectedDocente }),
        });

        const res = await fetch(`${API_URL}/reportes/horarios-semanales?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHorarios(data.data || []);
        } else {
          setError("Error al cargar horarios");
        }
      } else {
        const params = new URLSearchParams({
          ...(selectedDia && { dia: selectedDia }),
        });

        const res = await fetch(`${API_URL}/reportes/aulas-disponibles?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAulas(data.data || []);
        } else {
          setError("Error al cargar aulas");
        }
      }
    } catch (err) {
      setError("Error de conexión");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (!previsualizando) {
      setError("Primero previsualiza el reporte");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const params = new URLSearchParams({
        periodo_id: selectedPeriodo,
        ...(selectedCarrera && { carrera_id: selectedCarrera }),
        ...(selectedDocente && { docente_id: selectedDocente }),
        ...(selectedDia && { dia: selectedDia }),
      });

      const endpoint = tipoReporte === "horarios" 
        ? `${API_URL}/reportes/horarios-semanales/pdf?${params}`
        : `${API_URL}/reportes/aulas-disponibles/pdf?${params}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_${tipoReporte}_${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError("Error al exportar PDF");
      }
    } catch (err) {
      setError("Error al exportar");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (!previsualizando) {
      setError("Primero previsualiza el reporte");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const params = new URLSearchParams({
        periodo_id: selectedPeriodo,
        ...(selectedCarrera && { carrera_id: selectedCarrera }),
        ...(selectedDocente && { docente_id: selectedDocente }),
        ...(selectedDia && { dia: selectedDia }),
      });

      const endpoint = tipoReporte === "horarios"
        ? `${API_URL}/reportes/horarios-semanales/excel?${params}`
        : `${API_URL}/reportes/aulas-disponibles/excel?${params}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_${tipoReporte}_${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError("Error al exportar Excel");
      }
    } catch (err) {
      setError("Error al exportar");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <FileText size={32} color="#3b82f6" />
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#1f2937" }}>
            Reportes Administrativos
          </h1>
        </div>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Genera y exporta reportes operativos del sistema
        </p>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>
          Tipo de Reporte
        </h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => {
              setTipoReporte("horarios");
              setPrevisualizando(false);
              setHorarios([]);
            }}
            style={{
              flex: 1,
              padding: "1rem",
              border: tipoReporte === "horarios" ? "2px solid #3b82f6" : "2px solid #e5e7eb",
              borderRadius: "0.5rem",
              backgroundColor: tipoReporte === "horarios" ? "#eff6ff" : "white",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <Calendar size={24} color={tipoReporte === "horarios" ? "#3b82f6" : "#6b7280"} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "600", color: tipoReporte === "horarios" ? "#3b82f6" : "#1f2937" }}>
                Horarios Semanales
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Horarios consolidados por periodo
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setTipoReporte("aulas");
              setPrevisualizando(false);
              setAulas([]);
            }}
            style={{
              flex: 1,
              padding: "1rem",
              border: tipoReporte === "aulas" ? "2px solid #10b981" : "2px solid #e5e7eb",
              borderRadius: "0.5rem",
              backgroundColor: tipoReporte === "aulas" ? "#f0fdf4" : "white",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <DoorOpen size={24} color={tipoReporte === "aulas" ? "#10b981" : "#6b7280"} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "600", color: tipoReporte === "aulas" ? "#10b981" : "#1f2937" }}>
                Aulas Disponibles
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Disponibilidad por bloque horario
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Filter size={20} color="#3b82f6" />
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", margin: 0 }}>
            Filtros
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {/* Periodo - Solo para Horarios */}
          {tipoReporte === "horarios" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Periodo Académico *
              </label>
              <select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Seleccionar periodo</option>
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.vigente ? "(Vigente)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Carrera - Solo para Horarios */}
          {tipoReporte === "horarios" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Carrera (Opcional)
              </label>
              <select
                value={selectedCarrera}
                onChange={(e) => setSelectedCarrera(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Todas las carreras</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Docente - Solo para Horarios */}
          {tipoReporte === "horarios" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Docente (Opcional)
              </label>
              <select
                value={selectedDocente}
                onChange={(e) => setSelectedDocente(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Todos los docentes</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.persona.nombre} {d.persona.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Día - Solo para Aulas */}
          {tipoReporte === "aulas" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Día de la Semana (Opcional)
              </label>
              <select
                value={selectedDia}
                onChange={(e) => setSelectedDia(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Todos los días</option>
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={handlePrevisualizar}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e40af")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            {loading ? "Cargando..." : "Previsualizar Reporte"}
          </button>

          {previsualizando && (
            <>
              <button
                onClick={handleExportarPDF}
                disabled={loading}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Download size={20} />
                Exportar PDF
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={loading}
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Download size={20} />
                Exportar Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Previsualización - Horarios */}
      {previsualizando && tipoReporte === "horarios" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>
            Vista Previa: Horarios Semanales
          </h3>

          {horarios.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              No se encontraron horarios con los filtros seleccionados
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Días</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Materia</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Horario</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Grupo</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Aula</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Docente</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((h, idx) => (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        {h.dias_semana.map((d) => d.substring(0, 3).toUpperCase()).join(", ")}
                      </td>
                      <td style={{ padding: "0.75rem", fontWeight: "500" }}>{h.grupo.materia.nombre}</td>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>
                        {h.bloque.hora_inicio} - {h.bloque.hora_fin}
                      </td>
                      <td style={{ padding: "0.75rem" }}>{h.grupo.codigo}</td>
                      <td style={{ padding: "0.75rem" }}>{h.aula.numero_aula}</td>
                      <td style={{ padding: "0.75rem" }}>
                        {h.docente.persona.nombre} {h.docente.persona.apellido_paterno}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Previsualización - Aulas */}
      {previsualizando && tipoReporte === "aulas" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>
            Vista Previa: Aulas Disponibles
          </h3>

          {aulas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              No se encontraron aulas
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {aulas.map((aula) => (
                <div
                  key={aula.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: "600", fontSize: "1.125rem", color: "#1f2937" }}>
                      Aula {aula.numero_aula}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Capacidad: {aula.capacidad} estudiantes
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {aula.bloques_disponibles.map((bloque, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.5rem",
                          backgroundColor: bloque.disponible ? "#f0fdf4" : "#fee2e2",
                          borderRadius: "0.25rem",
                        }}
                      >
                        <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                          {bloque.hora_inicio} - {bloque.hora_fin}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            color: bloque.disponible ? "#10b981" : "#ef4444",
                          }}
                        >
                          {bloque.disponible ? "✓ Libre" : "✗ Ocupada"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
