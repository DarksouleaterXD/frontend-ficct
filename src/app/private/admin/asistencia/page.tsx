"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  Calendar,
  Filter,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Download,
  Search,
  RefreshCw,
  TrendingUp,
  Users,
  X,
  BarChart3,
  PieChart,
  Activity,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";

// ============================================
// INTERFACES
// ============================================

interface AsistenciaPendiente {
  id: number;
  docente: string;
  materia: string;
  grupo: string;
  carrera: string;
  fecha: string;
  hora_clase: string;
  hora_marcado: string;
  estado: "presente" | "ausente" | "retardo" | "justificado";
  metodo: "formulario" | "qr";
  observacion: string | null;
  evidencia_url: string | null;
  es_retardo: boolean;
  validado_por: string | null;
  validado_en: string | null;
}

interface Estadisticas {
  total_pendientes: number;
  por_estado: {
    presente: number;
    retardo: number;
    ausente: number;
    justificado: number;
  };
  por_metodo: {
    formulario: number;
    qr: number;
  };
  tasa_puntualidad: number;
  tasa_asistencia: number;
}

interface PaginationData {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface PendientesResponse {
  success: boolean;
  data: AsistenciaPendiente[];
  pagination: PaginationData;
  estadisticas?: Estadisticas;
  message?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ValidarAsistenciasAdminPage() {
  const [asistencias, setAsistencias] = useState<AsistenciaPendiente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Filtros avanzados
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  const [vistaActual, setVistaActual] = useState<"lista" | "estadisticas">("lista");

  // Modal de validación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] = useState<AsistenciaPendiente | null>(null);
  const [accionValidacion, setAccionValidacion] = useState<"aprobar" | "rechazar">("aprobar");
  const [observacionValidacion, setObservacionValidacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Validación masiva
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [modoSeleccion, setModoSeleccion] = useState(false);

  // Cargar pendientes al montar
  useEffect(() => {
    cargarPendientes();
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================

  const cargarPendientes = async (pagina = 1) => {
    setCargando(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      if (filtroEstado !== "todos") params.append("estado", filtroEstado);
      if (filtroMetodo !== "todos") params.append("metodo", filtroMetodo);
      if (busqueda) params.append("busqueda", busqueda);
      params.append("page", pagina.toString());
      params.append("incluir_estadisticas", "true");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/asistencias/pendientes?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}`);
      }

      const data: PendientesResponse = await response.json();

      if (data.success) {
        setAsistencias(data.data);
        setPagination(data.pagination);
        if (data.estadisticas) {
          setEstadisticas(data.estadisticas);
        }
      } else {
        setError(data.message || "Error al cargar asistencias");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalValidar = (asistencia: AsistenciaPendiente, accion: "aprobar" | "rechazar") => {
    setAsistenciaSeleccionada(asistencia);
    setAccionValidacion(accion);
    setObservacionValidacion("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAsistenciaSeleccionada(null);
    setObservacionValidacion("");
  };

  const confirmarValidacion = async () => {
    if (!asistenciaSeleccionada) return;

    setEnviando(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/asistencias/${asistenciaSeleccionada.id}/validar`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            validado: accionValidacion === "aprobar",
            observacion_validacion: observacionValidacion,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        cerrarModal();
        cargarPendientes();
      } else {
        alert(`❌ Error: ${data.message || "No se pudo validar"}`);
      }
    } catch (err) {
      alert("❌ Error de conexión");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  const validarMasivo = async (accion: "aprobar" | "rechazar") => {
    if (seleccionados.length === 0) {
      alert("❌ Selecciona al menos una asistencia");
      return;
    }

    const confirmacion = confirm(
      `¿Seguro que deseas ${accion} ${seleccionados.length} asistencia(s)?`
    );

    if (!confirmacion) return;

    setCargando(true);

    try {
      const token = localStorage.getItem("token");
      
      const resultados = await Promise.all(
        seleccionados.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencias/${id}/validar`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              validado: accion === "aprobar",
              observacion_validacion: `Validación masiva: ${accion}`,
            }),
          }).then((r) => r.json())
        )
      );

      const exitosos = resultados.filter((r) => r.success).length;
      alert(`✅ ${exitosos}/${seleccionados.length} asistencias procesadas correctamente`);
      
      setSeleccionados([]);
      setModoSeleccion(false);
      cargarPendientes();
    } catch (err) {
      alert("❌ Error en validación masiva");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === asistencias.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(asistencias.map((a) => a.id));
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      if (filtroEstado !== "todos") params.append("estado", filtroEstado);

      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/asistencias/exportar/excel?${params.toString()}&token=${token}`,
        "_blank"
      );
    } catch (err) {
      alert("❌ Error al exportar");
    }
  };

  const aplicarFiltros = () => {
    cargarPendientes(1);
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setFiltroEstado("todos");
    setFiltroMetodo("todos");
    setBusqueda("");
    setTimeout(() => cargarPendientes(1), 100);
  };

  // ============================================
  // HELPERS
  // ============================================

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "presente":
        return "text-green-700 bg-green-100 border-green-200";
      case "retardo":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "ausente":
        return "text-red-700 bg-red-100 border-red-200";
      case "justificado":
        return "text-blue-700 bg-blue-100 border-blue-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "presente":
        return <CheckCircle className="w-4 h-4" />;
      case "retardo":
        return <AlertTriangle className="w-4 h-4" />;
      case "ausente":
        return <XCircle className="w-4 h-4" />;
      case "justificado":
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatearFechaCompleta = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0, marginBottom: "0.5rem" }}>
            Validar Asistencias
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Panel de administración para validación de asistencias docentes
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={exportarExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => cargarPendientes()}
            disabled={cargando}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              cursor: cargando ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              opacity: cargando ? 0.5 : 1,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs Vista */}
      <div style={{ display: "inline-flex", gap: "0.25rem", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.375rem", padding: "0.25rem" }}>
        <button
          onClick={() => setVistaActual("lista")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: vistaActual === "lista" ? "#3b82f6" : "transparent",
            color: vistaActual === "lista" ? "white" : "#374151",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <Activity className="w-4 h-4" />
          Lista de Asistencias
        </button>
        <button
          onClick={() => setVistaActual("estadisticas")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: vistaActual === "estadisticas" ? "#3b82f6" : "transparent",
            color: vistaActual === "estadisticas" ? "white" : "#374151",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas
        </button>
      </div>

      {/* Estadísticas Principales */}
      {estadisticas && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem", fontWeight: "500" }}>Total Pendientes</p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937" }}>{estadisticas.total_pendientes}</p>
              </div>
              <div style={{ backgroundColor: "#e0e7ff", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <Users style={{ width: "28px", height: "28px", color: "#6366f1" }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem", fontWeight: "500" }}>Presentes</p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: "#16a34a" }}>{estadisticas.por_estado.presente}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "0.25rem" }}>
                  {estadisticas.tasa_asistencia.toFixed(1)}% asistencia
                </p>
              </div>
              <div style={{ backgroundColor: "#dcfce7", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <CheckCircle style={{ width: "28px", height: "28px", color: "#16a34a" }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem", fontWeight: "500" }}>Retardos</p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: "#ca8a04" }}>{estadisticas.por_estado.retardo}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "0.25rem" }}>
                  {(100 - estadisticas.tasa_puntualidad).toFixed(1)}% llegadas tarde
                </p>
              </div>
              <div style={{ backgroundColor: "#fef3c7", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <AlertTriangle style={{ width: "28px", height: "28px", color: "#ca8a04" }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem", fontWeight: "500" }}>Ausentes</p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: "#dc2626" }}>{estadisticas.por_estado.ausente}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "0.25rem" }}>
                  {((estadisticas.por_estado.ausente / estadisticas.total_pendientes) * 100).toFixed(1)}% del total
                </p>
              </div>
              <div style={{ backgroundColor: "#fee2e2", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <XCircle style={{ width: "28px", height: "28px", color: "#dc2626" }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0.25rem", fontWeight: "500" }}>Registro QR</p>
                <p style={{ fontSize: "30px", fontWeight: "bold", color: "#9333ea" }}>{estadisticas.por_metodo.qr}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "0.25rem" }}>
                  {((estadisticas.por_metodo.qr / estadisticas.total_pendientes) * 100).toFixed(1)}% uso QR
                </p>
              </div>
              <div style={{ backgroundColor: "#f3e8ff", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <TrendingUp style={{ width: "28px", height: "28px", color: "#9333ea" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modo Selección Masiva */}
      {modoSeleccion && (
        <div style={{ backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Modo Selección Masiva: {seleccionados.length} seleccionado(s)
                </p>
                <p className="text-sm text-gray-600">
                  Selecciona las asistencias y luego elige una acción
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={seleccionarTodos}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-sm"
              >
                {seleccionados.length === asistencias.length ? "Deseleccionar Todo" : "Seleccionar Todo"}
              </button>
              <button
                onClick={() => validarMasivo("aprobar")}
                disabled={seleccionados.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm"
              >
                Aprobar Seleccionados
              </button>
              <button
                onClick={() => validarMasivo("rechazar")}
                disabled={seleccionados.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold text-sm"
              >
                Rechazar Seleccionados
              </button>
              <button
                onClick={() => {
                  setModoSeleccion(false);
                  setSeleccionados([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", overflow: "hidden" }}>
        <button
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Filtros Avanzados</h2>
            {(fechaDesde || fechaHasta || filtroEstado !== "todos" || filtroMetodo !== "todos" || busqueda) && (
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">
                Activos
              </span>
            )}
          </div>
          <div className={`transform transition-transform ${filtrosAbiertos ? "rotate-180" : ""}`}>
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {filtrosAbiertos && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Buscar Docente/Materia
                </label>
                <div style={{ position: "relative" }}>
                  <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#9ca3af" }} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar..."
                    style={{
                      width: "100%",
                      paddingLeft: "2.5rem",
                      paddingRight: "1rem",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                  }}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="presente">Presente</option>
                  <option value="retardo">Retardo</option>
                  <option value="ausente">Ausente</option>
                  <option value="justificado">Justificado</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Método
                </label>
                <select
                  value={filtroMetodo}
                  onChange={(e) => setFiltroMetodo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "14px",
                  }}
                >
                  <option value="todos">Todos los Métodos</option>
                  <option value="qr">QR</option>
                  <option value="formulario">Formulario</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={aplicarFiltros}
                disabled={cargando}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: cargando ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: cargando ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <Filter className="w-4 h-4" />
                Aplicar Filtros
              </button>
              <button
                onClick={limpiarFiltros}
                disabled={cargando}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  cursor: cargando ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
              <button
                onClick={() => setModoSeleccion(!modoSeleccion)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#9333ea",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Modo Selección
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-6 flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-bold text-lg">Error al cargar asistencias</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "3rem", textAlign: "center" }}>
          <Loader2 style={{ width: "64px", height: "64px", color: "#3b82f6", margin: "0 auto 1rem auto" }} className="animate-spin" />
          <p style={{ color: "#6b7280", fontSize: "18px", fontWeight: "600", margin: 0 }}>Cargando asistencias...</p>
        </div>
      )}

      {/* Lista de Asistencias */}
      {!cargando && !error && vistaActual === "lista" && (
        <>
          {asistencias.length === 0 ? (
            <div className="bg-white rounded border border-gray-300 p-12 text-center">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No hay asistencias pendientes
              </h3>
              <p className="text-gray-600 mb-4">
                Todas las asistencias han sido validadas o no hay registros con estos filtros.
              </p>
              {(fechaDesde || fechaHasta || filtroEstado !== "todos" || busqueda) && (
                <button
                  onClick={limpiarFiltros}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {asistencias.map((asistencia) => (
                <div
                  key={asistencia.id}
                  className={`bg-white rounded-xl border-2 hover:shadow-xl transition-all duration-200 overflow-hidden ${
                    seleccionados.includes(asistencia.id) ? "border-blue-500 shadow-lg" : "border-gray-200"
                  }`}
                >
                  {/* Header Moderno */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {modoSeleccion && (
                          <input
                            type="checkbox"
                            checked={seleccionados.includes(asistencia.id)}
                            onChange={() => toggleSeleccion(asistencia.id)}
                            className="w-5 h-5 cursor-pointer accent-blue-600 rounded"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{asistencia.docente}</h3>
                            <p className="text-sm text-gray-600 font-medium mt-0.5">
                              {asistencia.grupo} • {asistencia.carrera}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-600">
                          {new Date(asistencia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}
                        </span>
                        {asistencia.es_retardo && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg text-xs font-bold text-yellow-800 shadow-sm">
                            <AlertTriangle className="w-4 h-4" />
                            RETARDO
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
                            getEstadoColor(asistencia.estado)
                          }`}
                        >
                          {getEstadoIcon(asistencia.estado)}
                          {asistencia.estado.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido Principal */}
                  <div className="p-6">
                    {/* Materia Destacada */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 mb-5 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-md">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">{asistencia.materia}</h4>
                      </div>

                      {/* Grid de Información */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Fecha */}
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Fecha</span>
                          </div>
                          <p className="font-bold text-gray-900">{formatearFecha(asistencia.fecha)}</p>
                        </div>

                        {/* Hora Clase */}
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Hora Clase</span>
                          </div>
                          <p className="font-mono font-bold text-gray-900 text-lg">{asistencia.hora_clase}</p>
                        </div>

                        {/* Hora Marcado */}
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Marcado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`font-mono font-bold text-lg ${
                              asistencia.es_retardo ? "text-yellow-600" : "text-green-600"
                            }`}>
                              {asistencia.hora_marcado}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Método y Validación */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-600">Método:</span>
                          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-sm font-bold border border-purple-300 shadow-sm">
                            {asistencia.metodo === 'formulario' ? '📝 FORMULARIO' : '📱 QR'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-600">Validación:</span>
                          {asistencia.validado_por ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-bold bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1.5 rounded-lg border border-green-300 shadow-sm">
                              <CheckCircle className="w-4 h-4" />
                              Validado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-orange-700 font-bold bg-gradient-to-r from-orange-100 to-amber-100 px-3 py-1.5 rounded-lg border border-orange-300 shadow-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Observación del Docente */}
                    {asistencia.observacion && (
                      <div className="mb-5 p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-orange-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-bold text-gray-800 uppercase">Observación del Docente</p>
                        </div>
                        <p className="text-gray-900 italic leading-relaxed bg-white p-4 rounded-lg border border-orange-100">&ldquo;{asistencia.observacion}&rdquo;</p>
                      </div>
                    )}

                    {/* Evidencia Adjunta */}
                    {asistencia.evidencia_url && (
                      <div className="mb-5">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${asistencia.evidencia_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                          Ver Evidencia Adjunta
                        </a>
                      </div>
                    )}

                    {/* Botones de Acción */}
                    {!modoSeleccion && (
                      <div className="flex gap-3 pt-5 border-t-2 border-gray-200">
                        <button
                          onClick={() => abrirModalValidar(asistencia, "aprobar")}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => abrirModalValidar(asistencia, "rechazar")}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.last_page > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded p-4 border border-gray-300">
              <p className="text-sm text-gray-600 font-semibold">
                Mostrando <span className="font-bold text-gray-900">{asistencias.length}</span> de{" "}
                <span className="font-bold text-gray-900">{pagination.total}</span> asistencias
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => cargarPendientes(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1 || cargando}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded border border-blue-300">
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                  onClick={() => cargarPendientes(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page || cargando}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vista de Estadísticas */}
      {!cargando && !error && vistaActual === "estadisticas" && estadisticas && (
        <div className="bg-white rounded p-6 border border-gray-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-600" />
            Análisis Detallado de Asistencias
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded border border-green-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Tasa de Asistencia</h3>
              <div className="text-center">
                <p className="text-6xl font-bold text-green-600 mb-2">
                  {estadisticas.tasa_asistencia.toFixed(1)}%
                </p>
                <p className="text-gray-600">
                  {estadisticas.por_estado.presente} presentes de {estadisticas.total_pendientes} registros
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded border border-blue-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⏰ Tasa de Puntualidad</h3>
              <div className="text-center">
                <p className="text-6xl font-bold text-blue-600 mb-2">
                  {estadisticas.tasa_puntualidad.toFixed(1)}%
                </p>
                <p className="text-gray-600">
                  {estadisticas.por_estado.retardo} retardos registrados
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded border border-purple-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📱 Adopción de Tecnología QR</h3>
              <div className="text-center">
                <p className="text-6xl font-bold text-purple-600 mb-2">
                  {((estadisticas.por_metodo.qr / estadisticas.total_pendientes) * 100).toFixed(1)}%
                </p>
                <p className="text-gray-600">
                  {estadisticas.por_metodo.qr} de {estadisticas.total_pendientes} usan QR
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded border border-red-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Índice de Ausencias</h3>
              <div className="text-center">
                <p className="text-6xl font-bold text-red-600 mb-2">
                  {((estadisticas.por_estado.ausente / estadisticas.total_pendientes) * 100).toFixed(1)}%
                </p>
                <p className="text-gray-600">
                  {estadisticas.por_estado.ausente} ausencias totales
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Modal de Validación Mejorado */}
      {modalAbierto && asistenciaSeleccionada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div
              className={`p-8 border-b-2 ${
                accionValidacion === "aprobar" 
                  ? "bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-green-300" 
                  : "bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div
                    className={`p-4 rounded-2xl shadow-lg ${
                      accionValidacion === "aprobar" 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                        : "bg-gradient-to-br from-red-500 to-rose-600"
                    }`}
                  >
                    {accionValidacion === "aprobar" ? (
                      <ThumbsUp className="w-10 h-10 text-white" />
                    ) : (
                      <ThumbsDown className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                      {accionValidacion === "aprobar" ? "Aprobar Asistencia" : "Rechazar Asistencia"}
                    </h2>
                    <p className="text-base text-gray-600 font-medium">
                      {accionValidacion === "aprobar" 
                        ? "Confirma que esta asistencia es válida y debe ser aprobada" 
                        : "Indica el motivo del rechazo de esta asistencia"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarModal}
                  disabled={enviando}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-50 p-2.5 hover:bg-white/50 rounded-xl transition-all transform hover:scale-110 active:scale-95"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-blue-200 shadow-md">
                <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg shadow-md">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  Información de la Asistencia
                </h3>
                
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Docente</p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{asistenciaSeleccionada.docente}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Materia</p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{asistenciaSeleccionada.materia}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Grupo</p>
                    </div>
                    <p className="font-bold text-gray-900">{asistenciaSeleccionada.grupo}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Carrera</p>
                    </div>
                    <p className="font-bold text-blue-600">{asistenciaSeleccionada.carrera}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Fecha</p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatearFechaCompleta(asistenciaSeleccionada.fecha)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Método</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-sm font-bold border-2 border-purple-300 shadow-sm">
                      {asistenciaSeleccionada.metodo === 'formulario' ? '📝 FORMULARIO' : '📱 QR'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-5 border-t-2 border-blue-200">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Hora Clase</p>
                    </div>
                    <p className="font-bold text-gray-900 text-xl font-mono">{asistenciaSeleccionada.hora_clase}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Hora Marcado</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-bold text-xl font-mono ${
                          asistenciaSeleccionada.es_retardo ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {asistenciaSeleccionada.hora_marcado}
                      </p>
                      {asistenciaSeleccionada.es_retardo && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded border border-yellow-300">
                          RETARDO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600 font-bold uppercase">Estado</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold border-2 shadow-sm ${getEstadoColor(
                        asistenciaSeleccionada.estado
                      )}`}
                    >
                      {getEstadoIcon(asistenciaSeleccionada.estado)}
                      {asistenciaSeleccionada.estado.toUpperCase()}
                    </span>
                  </div>
                </div>

                {asistenciaSeleccionada.observacion && (
                  <div className="pt-5 border-t-2 border-blue-200 mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 uppercase">Observación del Docente</p>
                    </div>
                    <div className="text-gray-900 bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                      <p className="italic leading-relaxed">&ldquo;{asistenciaSeleccionada.observacion}&rdquo;</p>
                    </div>
                  </div>
                )}

                {asistenciaSeleccionada.evidencia_url && (
                  <div className="pt-5 border-t-2 border-blue-200 mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 uppercase">Evidencia Adjunta</p>
                    </div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${asistenciaSeleccionada.evidencia_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <Download className="w-5 h-5" />
                      Ver/Descargar Evidencia
                    </a>
                  </div>
                )}
              </div>

              {/* Observación de Validación */}
              <div className="mb-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                <label className="flex items-center gap-3 text-base font-bold text-gray-900 mb-4">
                  <div className={`p-2 rounded-lg shadow-md ${
                    accionValidacion === "aprobar" 
                      ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                      : "bg-gradient-to-br from-red-500 to-rose-600"
                  }`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span>
                    Observación de Validación
                    {accionValidacion === "rechazar" && <span className="text-red-600 ml-2">*Obligatorio</span>}
                  </span>
                </label>
                <textarea
                  value={observacionValidacion}
                  onChange={(e) => setObservacionValidacion(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder={
                    accionValidacion === "aprobar"
                      ? "Opcional: Agrega comentarios adicionales sobre la aprobación..."
                      : "Obligatorio: Explica detalladamente el motivo del rechazo de esta asistencia..."
                  }
                  className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-offset-2 resize-none transition-all font-medium bg-white shadow-sm ${
                    accionValidacion === "rechazar" && !observacionValidacion
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600 font-semibold">
                    <span className={observacionValidacion.length > 450 ? "text-orange-600" : ""}>
                      {observacionValidacion.length}
                    </span>
                    /500 caracteres
                  </p>
                  {accionValidacion === "rechazar" && !observacionValidacion && (
                    <p className="text-sm text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Campo obligatorio para rechazos
                    </p>
                  )}
                </div>
              </div>

              {/* Botones de Acción del Modal */}
              <div className="flex gap-4">
                <button
                  onClick={cerrarModal}
                  disabled={enviando}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  <span className="text-lg">Cancelar</span>
                </button>
                <button
                  onClick={confirmarValidacion}
                  disabled={enviando || (accionValidacion === "rechazar" && !observacionValidacion)}
                  className={`flex-1 px-8 py-4 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                    accionValidacion === "aprobar"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-lg">Procesando...</span>
                    </>
                  ) : accionValidacion === "aprobar" ? (
                    <>
                      <ThumbsUp className="w-6 h-6" />
                      <span className="text-lg">Confirmar Aprobación</span>
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-6 h-6" />
                      <span className="text-lg">Confirmar Rechazo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
