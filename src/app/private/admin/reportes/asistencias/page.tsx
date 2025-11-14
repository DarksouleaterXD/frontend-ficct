"use client";

import { useEffect, useState } from "react";
import { FileText, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface ResumenData {
  por_estado: {
    presente: number;
    retardo: number;
    ausente: number;
    justificado: number;
  };
  pendientes_validacion: number;
  sesiones_total: number;
  sesiones_con_asistencia: number;
  porcentaje_cumplimiento: number;
}

interface EstadisticaDocente {
  docente_id: number;
  nombre_completo: string;
  total_asistencias: number;
  presente: number;
  retardo: number;
  ausente: number;
  justificado: number;
  pendientes_validacion: number;
  porcentaje_presente: number;
}

interface AsistenciaPendiente {
  id: number;
  docente: string;
  materia: string;
  fecha: string;
  hora_marcado: string;
  estado: string;
  metodo_registro: string;
  dias_pendiente: number;
}

export default function ReportesAsistenciasPage() {
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [estadisticasDocentes, setEstadisticasDocentes] = useState<EstadisticaDocente[]>([]);
  const [pendientes, setPendientes] = useState<AsistenciaPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1); // Primer día del mes
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    cargarDatos();
  }, [fechaDesde, fechaHasta]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      });

      // Cargar resumen
      const resumenRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/asistencias/resumen?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const resumenData = await resumenRes.json();
      if (resumenData.success) {
        setResumen(resumenData.data);
      }

      // Cargar estadísticas por docente
      const estadisticasRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/asistencias/estadisticas-docente?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const estadisticasData = await estadisticasRes.json();
      if (estadisticasData.success) {
        setEstadisticasDocentes(estadisticasData.data);
      }

      // Cargar asistencias pendientes
      const pendientesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/asistencias/pendientes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const pendientesData = await pendientesRes.json();
      if (pendientesData.success) {
        setPendientes(pendientesData.data);
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "presente":
        return "#10b981";
      case "retardo":
        return "#f59e0b";
      case "ausente":
        return "#ef4444";
      case "justificado":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "presente":
        return <CheckCircle className="w-5 h-5" />;
      case "retardo":
        return <Clock className="w-5 h-5" />;
      case "ausente":
        return <XCircle className="w-5 h-5" />;
      case "justificado":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Reportes de Asistencias
        </h1>
        <p className="text-gray-600 mt-2">
          Análisis y estadísticas de asistencias de docentes
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros de Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={cargarDatos}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Actualizar Reporte
            </button>
            <button
              onClick={async () => {
                const token = localStorage.getItem("token");
                const params = new URLSearchParams({
                  fecha_desde: fechaDesde,
                  fecha_hasta: fechaHasta,
                });
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/reportes/asistencias/pdf?${params}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `reporte_asistencias_${Date.now()}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Card: Presente */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Presente</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.por_estado.presente}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Card: Retardo */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retardo</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.por_estado.retardo}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          {/* Card: Ausente */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausente</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.por_estado.ausente}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Card: Pendientes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.pendientes_validacion}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por Docente */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Estadísticas por Docente
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Docente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Presente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Retardo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ausente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Justificado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Pendientes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  % Presente
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {estadisticasDocentes.map((docente) => (
                <tr key={docente.docente_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{docente.nombre_completo}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 font-semibold">
                    {docente.total_asistencias}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {docente.presente}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {docente.retardo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {docente.ausente}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {docente.justificado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      {docente.pendientes_validacion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${docente.porcentaje_presente}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {docente.porcentaje_presente}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asistencias Pendientes de Validación */}
      {pendientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              Asistencias Pendientes de Validación ({pendientes.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Docente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Materia
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Hora Marcado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Días Pendiente
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendientes.map((pendiente) => (
                  <tr key={pendiente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pendiente.docente}</div>
                    </td>
                    <td className="px-6 py-4">{pendiente.materia}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{pendiente.fecha}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{pendiente.hora_marcado}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1"
                        style={{
                          color: getEstadoColor(pendiente.estado),
                          backgroundColor: `${getEstadoColor(pendiente.estado)}20`,
                        }}
                      >
                        {getEstadoIcon(pendiente.estado)}
                        {pendiente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pendiente.dias_pendiente > 7
                            ? "bg-red-100 text-red-800"
                            : pendiente.dias_pendiente > 3
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {pendiente.dias_pendiente} {pendiente.dias_pendiente === 1 ? "día" : "días"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
