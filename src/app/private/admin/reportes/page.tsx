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
    paralelo: string;
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

interface Aula {
  id: number;
  numero_aula: string;
  capacidad: number;
}

interface BloqueHorario {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  numero_bloque: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState<"horarios" | "aulas" | "asistencias">("horarios");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [aulasLista, setAulasLista] = useState<Aula[]>([]);
  const [bloquesHorarios, setBloquesHorarios] = useState<BloqueHorario[]>([]);
  
  // Filtros
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [selectedDocente, setSelectedDocente] = useState("");
  const [selectedDia, setSelectedDia] = useState("");
  const [selectedAula, setSelectedAula] = useState("");
  const [selectedBloque, setSelectedBloque] = useState("");
  const [fechaDesde, setFechaDesde] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1); // Primer día del mes
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Datos
  const [horarios, setHorarios] = useState<HorarioReporte[]>([]);
  const [aulas, setAulas] = useState<AulaDisponible[]>([]);
  const [estadisticasAsistencias, setEstadisticasAsistencias] = useState<any[]>([]);
  
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
      const [periodosRes, carrerasRes, docentesRes, aulasRes, bloquesRes] = await Promise.all([
        fetch(`${API_URL}/periodos?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/carreras?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/docentes?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/aulas?per_page=999`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bloques-horarios?per_page=999`, {
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

      if (aulasRes.ok) {
        const data = await aulasRes.json();
        setAulasLista(data.data || []);
      }

      if (bloquesRes.ok) {
        const data = await bloquesRes.json();
        setBloquesHorarios(data.data || []);
      }
    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }
  };

  // Previsualizar reporte
  const handlePrevisualizar = async () => {
    // Validaciones
    if (tipoReporte === "horarios" && !selectedPeriodo) {
      setError("Selecciona un periodo");
      return;
    }
    
    if (tipoReporte === "asistencias") {
      if (!fechaDesde || !fechaHasta) {
        setError("Selecciona rango de fechas");
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No estás autenticado. Por favor inicia sesión.");
      return;
    }

    setError("");
    setLoading(true);
    setPrevisualizando(true);

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
          const errorData = await res.json().catch(() => ({ message: "Error al cargar horarios" }));
          setError(errorData.message || `Error ${res.status}: ${res.statusText}`);
          if (res.status === 401) {
            setError("Sesión expirada. Por favor inicia sesión nuevamente.");
          }
        }
      } else if (tipoReporte === "aulas") {
        const params = new URLSearchParams({
          ...(selectedDia && { dia: selectedDia }),
          ...(selectedAula && { aula_id: selectedAula }),
          ...(selectedBloque && { bloque_id: selectedBloque }),
        });

        const res = await fetch(`${API_URL}/reportes/aulas-disponibles?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAulas(data.data || []);
        } else {
          const errorData = await res.json().catch(() => ({ message: "Error al cargar aulas disponibles" }));
          setError(errorData.message || `Error ${res.status}: ${res.statusText}`);
          if (res.status === 401) {
            setError("Sesión expirada. Por favor inicia sesión nuevamente.");
          }
        }
      } else if (tipoReporte === "asistencias") {
        const params = new URLSearchParams({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          ...(selectedDocente && { docente_id: selectedDocente }),
        });

        const res = await fetch(`${API_URL}/reportes/asistencias/estadisticas-docente?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setEstadisticasAsistencias(data.data || []);
        } else {
          const errorData = await res.json().catch(() => ({ message: "Error al cargar estadísticas de asistencias" }));
          setError(errorData.message || `Error ${res.status}: ${res.statusText}`);
          if (res.status === 401) {
            setError("Sesión expirada. Por favor inicia sesión nuevamente.");
          }
        }
      }
    } catch (err) {
      setError("Error de conexión con el servidor. Verifica que el backend esté corriendo.");
      console.error("Error en handlePrevisualizar:", err);
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
      let endpoint = "";

      if (tipoReporte === "horarios") {
        const params = new URLSearchParams({
          periodo_id: selectedPeriodo,
          ...(selectedCarrera && { carrera_id: selectedCarrera }),
          ...(selectedDocente && { docente_id: selectedDocente }),
        });
        endpoint = `${API_URL}/reportes/horarios-semanales/pdf?${params}`;
      } else if (tipoReporte === "aulas") {
        const params = new URLSearchParams({
          ...(selectedDia && { dia: selectedDia }),
          ...(selectedAula && { aula_id: selectedAula }),
          ...(selectedBloque && { bloque_id: selectedBloque }),
        });
        endpoint = `${API_URL}/reportes/aulas-disponibles/pdf?${params}`;
      } else if (tipoReporte === "asistencias") {
        const params = new URLSearchParams({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          ...(selectedDocente && { docente_id: selectedDocente }),
        });
        endpoint = `${API_URL}/reportes/asistencias/pdf?${params}`;
      }

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
      let endpoint = "";

      if (tipoReporte === "horarios") {
        const params = new URLSearchParams({
          periodo_id: selectedPeriodo,
          ...(selectedCarrera && { carrera_id: selectedCarrera }),
          ...(selectedDocente && { docente_id: selectedDocente }),
        });
        endpoint = `${API_URL}/reportes/horarios-semanales/excel?${params}`;
      } else if (tipoReporte === "aulas") {
        const params = new URLSearchParams({
          ...(selectedDia && { dia: selectedDia }),
          ...(selectedAula && { aula_id: selectedAula }),
          ...(selectedBloque && { bloque_id: selectedBloque }),
        });
        endpoint = `${API_URL}/reportes/aulas-disponibles/excel?${params}`;
      } else if (tipoReporte === "asistencias") {
        const params = new URLSearchParams({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          ...(selectedDocente && { docente_id: selectedDocente }),
        });
        endpoint = `${API_URL}/reportes/asistencias/excel?${params}`;
      }

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
              setSelectedDia("");
              setSelectedAula("");
              setSelectedBloque("");
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
              setSelectedCarrera("");
              setSelectedDocente("");
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

          <button
            onClick={() => {
              setTipoReporte("asistencias");
              setPrevisualizando(false);
              setHorarios([]);
              setAulas([]);
            }}
            style={{
              flex: 1,
              padding: "1rem",
              border: tipoReporte === "asistencias" ? "2px solid #8b5cf6" : "2px solid #e5e7eb",
              borderRadius: "0.5rem",
              backgroundColor: tipoReporte === "asistencias" ? "#f5f3ff" : "white",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <Users size={24} color={tipoReporte === "asistencias" ? "#8b5cf6" : "#6b7280"} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "600", color: tipoReporte === "asistencias" ? "#8b5cf6" : "#1f2937" }}>
                Asistencias Docentes
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Estadísticas y reportes de asistencia
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

          {/* Aula - Solo para Aulas */}
          {tipoReporte === "aulas" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Aula (Opcional)
              </label>
              <select
                value={selectedAula}
                onChange={(e) => setSelectedAula(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Todas las aulas</option>
                {aulasLista.map((a) => (
                  <option key={a.id} value={a.id}>
                    Aula {a.numero_aula} ({a.capacidad} estudiantes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bloque Horario - Solo para Aulas */}
          {tipoReporte === "aulas" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Bloque Horario (Opcional)
              </label>
              <select
                value={selectedBloque}
                onChange={(e) => setSelectedBloque(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <option value="">Todos los bloques</option>
                {bloquesHorarios.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.hora_inicio} - {b.hora_fin})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha Desde - Solo para Asistencias */}
          {tipoReporte === "asistencias" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Fecha Desde *
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>
          )}

          {/* Fecha Hasta - Solo para Asistencias */}
          {tipoReporte === "asistencias" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                Fecha Hasta *
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>
          )}

          {/* Docente - Para Asistencias también */}
          {tipoReporte === "asistencias" && (
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
                      <td style={{ padding: "0.75rem" }}>{h.grupo.codigo}-{h.grupo.paralelo}</td>
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
              No se encontraron aulas con los filtros seleccionados
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Aula</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Capacidad</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Bloque Horario</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Horario</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {aulas.map((aula) =>
                    aula.bloques_disponibles.map((bloque, idx) => (
                      <tr
                        key={`${aula.id}-${idx}`}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: bloque.disponible ? "#f0fdf4" : "#fef2f2",
                        }}
                      >
                        {idx === 0 && (
                          <>
                            <td
                              rowSpan={aula.bloques_disponibles.length}
                              style={{
                                padding: "0.75rem",
                                fontWeight: "600",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              Aula {aula.numero_aula}
                            </td>
                            <td
                              rowSpan={aula.bloques_disponibles.length}
                              style={{
                                padding: "0.75rem",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {aula.capacidad} estudiantes
                            </td>
                          </>
                        )}
                        <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                          {bloque.bloque}
                        </td>
                        <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>
                          {bloque.hora_inicio} - {bloque.hora_fin}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              backgroundColor: bloque.disponible ? "#dcfce7" : "#fee2e2",
                              color: bloque.disponible ? "#166534" : "#991b1b",
                            }}
                          >
                            {bloque.disponible ? "✓ Disponible" : "✗ Ocupada"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Previsualización - Asistencias */}
      {previsualizando && tipoReporte === "asistencias" && (
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
            Vista Previa: Estadísticas de Asistencias
          </h3>

          {estadisticasAsistencias.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              No se encontraron datos de asistencias en el período seleccionado
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Docente</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Total</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Presente</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Retardo</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Ausente</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Justificado</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Pendientes</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>% Presente</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticasAsistencias.map((docente) => (
                    <tr
                      key={docente.docente_id}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "0.75rem", fontWeight: "500" }}>
                        {docente.nombre_completo}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>
                        {docente.total_asistencias}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {docente.presente}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {docente.retardo}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {docente.ausente}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {docente.justificado}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#fed7aa",
                            color: "#9a3412",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {docente.pendientes_validacion}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: "60px",
                              height: "8px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "9999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${docente.porcentaje_presente}%`,
                                height: "100%",
                                backgroundColor: "#10b981",
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                            {docente.porcentaje_presente}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
