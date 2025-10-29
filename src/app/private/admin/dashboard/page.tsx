"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

interface KPI {
  ocupacion_aulas: {
    total_aulas: number;
    aulas_ocupadas: number;
    tasa_ocupacion: number;
    total_horarios: number;
  };
  carga_horaria: {
    total_horas_semana: number;
    promedio_horas_docente: number;
    total_asignaciones: number;
  };
  asistencia_promedio: {
    total_registros: number;
    asistentes: number;
    tasa_asistencia: number;
  };
  aulas_por_tipo: Array<{ tipo: string; cantidad: number; capacidad_total: number }>;
  grupos_activos: { grupos_activos: number; estudiantes_total: number };
  horas_promedio_docente: { promedio: number; maximo: number; minimo: number };
}

interface Grafico {
  ocupacion_por_dia?: Array<{ dia: string; cantidad: number }>;
  ocupacion_por_bloque?: Array<{ bloque: string; cantidad: number }>;
  asistencia_por_grupo?: Array<{ grupo: string; tasa_asistencia: number }>;
  asistencia_por_semana?: Array<{ semana: string; tasa_asistencia: number }>;
  carga_por_docente?: Array<{ docente: string; horas: number }>;
  carga_por_carrera?: Array<{ carrera: string; horas: number }>;
}

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

interface CargaPorCarrera {
  carrera: string;
  horas: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [graficos, setGraficos] = useState<Grafico | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/catalogos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setPeriodos(data.data?.periodos || []);
          setCarreras(data.data?.carreras || []);

          // Seleccionar período vigente por defecto
          const vigente = data.data?.periodos?.find((p: Periodo) => p.vigente);
          if (vigente) setSelectedPeriodo(String(vigente.id));
        }
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    };
    fetchCatalogos();
  }, []);

  // Cargar datos del dashboard
  const fetchDashboardData = useCallback(async () => {
    if (!selectedPeriodo) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        periodo_id: selectedPeriodo,
      });

      if (selectedCarrera) params.append("carrera_id", selectedCarrera);

      // Obtener KPIs
      const kpisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/kpis?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData.data);
      }

      // Obtener Gráficos
      const graficosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/graficos?${params}&tipo=todos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (graficosResponse.ok) {
        const graficosData = await graficosResponse.json();
        setGraficos(graficosData.data);
      }

      setSuccess("Datos cargados exitosamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodo, selectedCarrera]);

  // Cargar datos cuando cambien filtros
  useEffect(() => {
    if (selectedPeriodo) {
      fetchDashboardData();
    }
  }, [selectedPeriodo, selectedCarrera, fetchDashboardData]);

  const handleExportPDF = () => {
    const html = `
      <html>
        <head>
          <title>Reporte Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; }
            .kpi-section { margin: 20px 0; border-bottom: 2px solid #e5e7eb; padding: 15px 0; }
            .kpi-item { display: inline-block; width: 48%; margin: 10px 1%; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f3f4f6; font-weight: bold; }
            .timestamp { color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Reporte de Dashboard Administrativo</h1>
          
          <div class="kpi-section">
            <h2>Indicadores Principales</h2>
            
            <div class="kpi-item">
              <h3>Ocupación de Aulas</h3>
              <p style="font-size: 24px; color: #3b82f6; font-weight: bold;">
                ${kpis?.ocupacion_aulas.tasa_ocupacion.toFixed(1)}%
              </p>
              <p>Aulas ocupadas: ${kpis?.ocupacion_aulas.aulas_ocupadas} / ${kpis?.ocupacion_aulas.total_aulas}</p>
            </div>

            <div class="kpi-item">
              <h3>Asistencia Promedio</h3>
              <p style="font-size: 24px; color: #10b981; font-weight: bold;">
                ${kpis?.asistencia_promedio.tasa_asistencia.toFixed(1)}%
              </p>
              <p>Asistentes: ${kpis?.asistencia_promedio.asistentes} / ${kpis?.asistencia_promedio.total_registros}</p>
            </div>

            <div class="kpi-item">
              <h3>Carga Horaria Promedio</h3>
              <p style="font-size: 24px; color: #f59e0b; font-weight: bold;">
                ${kpis?.carga_horaria.promedio_horas_docente} hrs
              </p>
              <p>Total: ${kpis?.carga_horaria.total_horas_semana} horas/semana</p>
            </div>

            <div class="kpi-item">
              <h3>Grupos Activos</h3>
              <p style="font-size: 24px; color: #ef4444; font-weight: bold;">
                ${kpis?.grupos_activos.grupos_activos}
              </p>
              <p>Estudiantes: ${kpis?.grupos_activos.estudiantes_total}</p>
            </div>
          </div>

          <div class="kpi-section">
            <h2>Aulas por Tipo</h2>
            <table>
              <tr>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Capacidad Total</th>
              </tr>
              ${kpis?.aulas_por_tipo.map((a: { tipo: string; cantidad: number; capacidad_total: number }) => `
                <tr>
                  <td>${a.tipo}</td>
                  <td>${a.cantidad}</td>
                  <td>${a.capacidad_total}</td>
                </tr>
              `).join("")}
            </table>
          </div>

          <p class="timestamp">Generado: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    const ventana = window.open("", "", "width=1000,height=800");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      setTimeout(() => ventana.print(), 250);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
          Tablero Administrativo
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Indicadores clave de desempeño y operación
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <AlertCircle color="#dc2626" size={20} />
          <p style={{ color: "#991b1b", margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <CheckCircle color="#16a34a" size={20} />
          <p style={{ color: "#15803d", margin: 0 }}>{success}</p>
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
            Período *
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
            <option value="">Selecciona un período...</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.vigente ? "(Vigente)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
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

        <button
          onClick={handleExportPDF}
          disabled={loading || !kpis}
          style={{
            backgroundColor: loading || !kpis ? "#9ca3af" : "#10b981",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: "600",
            cursor: loading || !kpis ? "not-allowed" : "pointer",
            alignSelf: "flex-end",
          }}
        >
          <Download size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
          Cargando indicadores...
        </div>
      ) : kpis ? (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {/* Card Ocupación */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>
                    Ocupación de Aulas
                  </p>
                  <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                    {kpis.ocupacion_aulas.tasa_ocupacion.toFixed(1)}%
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                    {kpis.ocupacion_aulas.aulas_ocupadas} / {kpis.ocupacion_aulas.total_aulas} aulas
                  </p>
                </div>
                <TrendingUp color="#3b82f6" size={32} />
              </div>
            </div>

            {/* Card Asistencia */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>
                    Asistencia Promedio
                  </p>
                  <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981", margin: 0 }}>
                    {kpis.asistencia_promedio.tasa_asistencia.toFixed(1)}%
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                    {kpis.asistencia_promedio.asistentes} / {kpis.asistencia_promedio.total_registros} registros
                  </p>
                </div>
                <Users color="#10b981" size={32} />
              </div>
            </div>

            {/* Card Carga Horaria */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>
                    Carga Horaria Promedio
                  </p>
                  <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b", margin: 0 }}>
                    {kpis.carga_horaria.promedio_horas_docente} hrs
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                    {kpis.carga_horaria.total_horas_semana} horas/semana
                  </p>
                </div>
                <DollarSign color="#f59e0b" size={32} />
              </div>
            </div>

            {/* Card Grupos */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>
                    Grupos Activos
                  </p>
                  <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444", margin: 0 }}>
                    {kpis.grupos_activos.grupos_activos}
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                    {kpis.grupos_activos.estudiantes_total} estudiantes
                  </p>
                </div>
                <Users color="#ef4444" size={32} />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          {graficos && (
            <>
              {/* Ocupación por Día */}
              {graficos.ocupacion_por_dia && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Ocupación por Día de Semana
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={graficos.ocupacion_por_dia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Ocupación por Bloque */}
              {graficos.ocupacion_por_bloque && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Ocupación por Bloque Horario
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={graficos.ocupacion_por_bloque}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bloque" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Asistencia por Grupo */}
              {graficos.asistencia_por_grupo && graficos.asistencia_por_grupo.length > 0 && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Tasa de Asistencia por Grupo
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={graficos.asistencia_por_grupo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="tasa_asistencia" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Asistencia por Semana */}
              {graficos.asistencia_por_semana && graficos.asistencia_por_semana.length > 0 && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Tendencia de Asistencia por Semana
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={graficos.asistencia_por_semana}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semana" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Line type="monotone" dataKey="tasa_asistencia" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Carga por Docente */}
              {graficos.carga_por_docente && graficos.carga_por_docente.length > 0 && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Top 10: Carga Horaria por Docente
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={graficos.carga_por_docente} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="docente" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="horas" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Carga por Carrera */}
              {graficos.carga_por_carrera && graficos.carga_por_carrera.length > 0 && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e5e7eb",
                    padding: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                    Carga Horaria por Carrera
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={graficos.carga_por_carrera}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="horas"
                      >
                        {graficos.carga_por_carrera.map((_: CargaPorCarrera, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabla Aulas por Tipo */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "0.75rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginTop: 0 }}>
                  Aulas por Tipo
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                          Tipo
                        </th>
                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                          Cantidad
                        </th>
                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                          Capacidad Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.aulas_por_tipo.map((aula, idx) => (
                        <tr
                          key={aula.tipo}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                          }}
                        >
                          <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "500" }}>
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                textTransform: "capitalize",
                              }}
                            >
                              {aula.tipo}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", color: "#1f2937" }}>{aula.cantidad}</td>
                          <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "600" }}>
                            {aula.capacidad_total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
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
          <p style={{ color: "#6b7280" }}>Selecciona un período para visualizar los indicadores</p>
        </div>
      )}
    </div>
  );
}
