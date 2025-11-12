"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  MapPin,
  Upload,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

// ============================================
// INTERFACES
// ============================================

interface Sesion {
  id: number;
  materia: string;
  grupo: string;
  aula: string;
  hora_inicio: string;
  hora_fin: string;
  estado_sesion: string;
  dentro_ventana: boolean;
  ventana_inicio: string;
  ventana_fin: string;
  asistencia_registrada: boolean;
  asistencia: Asistencia | null;
}

interface Asistencia {
  id: number;
  estado: "presente" | "ausente" | "retardo" | "justificado";
  metodo: "formulario" | "qr";
  hora_marcado: string;
  observacion: string;
  validado: boolean;
}

interface MisClasesResponse {
  success: boolean;
  data: Sesion[];
  total: number;
  hora_actual: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AsistenciasPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [horaActual, setHoraActual] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  // Modal de marcado
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<Sesion | null>(null);
  const [estadoAsistencia, setEstadoAsistencia] = useState<"presente" | "ausente" | "retardo" | "justificado">("presente");
  const [observacion, setObservacion] = useState("");
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Cargar clases al montar
  useEffect(() => {
    cargarClasesHoy();
    actualizarFechaHora();

    // Actualizar hora cada minuto
    const interval = setInterval(actualizarFechaHora, 60000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================

  const actualizarFechaHora = () => {
    const ahora = new Date();
    setFechaActual(
      ahora.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setHoraActual(ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
  };

  const cargarClasesHoy = async () => {
    setCargando(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mis-clases-hoy`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data: MisClasesResponse = await response.json();

      if (data.success) {
        setSesiones(data.data);
        setHoraActual(data.hora_actual);
      } else {
        setError("Error al cargar las clases");
      }
    } catch (err) {
      setError("Error de conexión. Por favor, intente nuevamente.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalMarcar = (sesion: Sesion) => {
    setSesionSeleccionada(sesion);
    setModalAbierto(true);
    setEstadoAsistencia("presente");
    setObservacion("");
    setEvidencia(null);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSesionSeleccionada(null);
    setEstadoAsistencia("presente");
    setObservacion("");
    setEvidencia(null);
  };

  const marcarAsistencia = async () => {
    if (!sesionSeleccionada) return;

    setEnviando(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("sesion_id", sesionSeleccionada.id.toString());
      formData.append("estado", estadoAsistencia);
      formData.append("metodo_registro", "formulario");
      if (observacion) formData.append("observacion", observacion);
      if (evidencia) formData.append("evidencia", evidencia);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/asistencias`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Asistencia registrada exitosamente\n\nEstado: ${data.data.estado}\nHora: ${data.data.hora_marcado}`);
        cerrarModal();
        cargarClasesHoy(); // Recargar lista
      } else {
        alert(`❌ Error: ${data.message || "No se pudo registrar la asistencia"}`);
      }
    } catch (err) {
      alert("❌ Error de conexión. Por favor, intente nuevamente.");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "presente":
        return "text-green-600 bg-green-50";
      case "retardo":
        return "text-yellow-600 bg-yellow-50";
      case "ausente":
        return "text-red-600 bg-red-50";
      case "justificado":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "presente":
        return <CheckCircle className="w-5 h-5" />;
      case "retardo":
        return <AlertTriangle className="w-5 h-5" />;
      case "ausente":
        return <XCircle className="w-5 h-5" />;
      case "justificado":
        return <Info className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Mis Clases de Hoy</h1>
        <p className="text-gray-600 capitalize">{fechaActual}</p>
        <div className="flex items-center gap-2 mt-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold text-blue-600">{horaActual}</span>
        </div>
      </div>

      {/* Botón Actualizar */}
      <button
        onClick={cargarClasesHoy}
        disabled={cargando}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
        Actualizar
      </button>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Lista de Sesiones */}
      {!cargando && sesiones.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No tienes clases programadas para hoy</p>
        </div>
      )}

      <div className="grid gap-4">
        {sesiones.map((sesion) => (
          <div
            key={sesion.id}
            className={`bg-white rounded-xl shadow-sm border-2 ${
              sesion.dentro_ventana ? "border-green-300" : "border-gray-200"
            } p-6 transition-all hover:shadow-md`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Materia y Grupo */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{sesion.materia}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                    Grupo {sesion.grupo}
                  </span>
                </div>

                {/* Aula y Horario */}
                <div className="flex flex-wrap gap-4 text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{sesion.aula}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {sesion.hora_inicio} - {sesion.hora_fin}
                    </span>
                  </div>
                </div>

                {/* Estado de Ventana */}
                {sesion.dentro_ventana && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">✅ Ventana de marcado abierta</span>
                    <span className="text-green-600 text-sm">
                      ({sesion.ventana_inicio} - {sesion.ventana_fin})
                    </span>
                  </div>
                )}

                {!sesion.dentro_ventana && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Ventana cerrada</span>
                    <span className="text-gray-500 text-sm">
                      (Disponible: {sesion.ventana_inicio} - {sesion.ventana_fin})
                    </span>
                  </div>
                )}

                {/* Asistencia Registrada */}
                {sesion.asistencia_registrada && sesion.asistencia && (
                  <div
                    className={`p-3 rounded-lg ${getEstadoColor(
                      sesion.asistencia.estado
                    )} flex items-center gap-3`}
                  >
                    {getEstadoIcon(sesion.asistencia.estado)}
                    <div>
                      <p className="font-semibold">Asistencia Registrada</p>
                      <p className="text-sm">
                        Estado: <span className="font-medium capitalize">{sesion.asistencia.estado}</span> •
                        Hora: {sesion.asistencia.hora_marcado}
                      </p>
                      {sesion.asistencia.observacion && (
                        <p className="text-sm mt-1">Observación: {sesion.asistencia.observacion}</p>
                      )}
                      <p className="text-sm mt-1">
                        {sesion.asistencia.validado ? "✅ Validado" : "⏳ Pendiente de validación"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Marcar */}
              <div>
                {!sesion.asistencia_registrada && (
                  <button
                    onClick={() => abrirModalMarcar(sesion)}
                    disabled={!sesion.dentro_ventana}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      sesion.dentro_ventana
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {sesion.dentro_ventana ? "Marcar Asistencia" : "Fuera de Ventana"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE MARCADO */}
      {modalAbierto && sesionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Marcar Asistencia</h2>

            {/* Info de la Sesión */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-blue-900">{sesionSeleccionada.materia}</p>
              <p className="text-blue-700 text-sm">
                Grupo {sesionSeleccionada.grupo} • {sesionSeleccionada.aula}
              </p>
              <p className="text-blue-600 text-sm">
                {sesionSeleccionada.hora_inicio} - {sesionSeleccionada.hora_fin}
              </p>
            </div>

            {/* Estado */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado *</label>
              <select
                value={estadoAsistencia}
                onChange={(e) =>
                  setEstadoAsistencia(e.target.value as "presente" | "ausente" | "retardo" | "justificado")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="presente">✅ Presente</option>
                <option value="retardo">⏰ Retardo</option>
                <option value="ausente">❌ Ausente</option>
                <option value="justificado">📝 Justificado</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                * El sistema detectará automáticamente retardos si marca después de la hora de inicio
              </p>
            </div>

            {/* Observación */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observación (opcional)
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ej: Clase normal, tema X completado..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{observacion.length}/500 caracteres</p>
            </div>

            {/* Evidencia */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Evidencia (opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setEvidencia(e.target.files?.[0] || null)}
                  className="hidden"
                  id="evidencia-input"
                />
                <label htmlFor="evidencia-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  {evidencia ? (
                    <p className="text-sm text-green-600 font-medium">{evidencia.name}</p>
                  ) : (
                    <p className="text-sm text-gray-600">Click para subir archivo (JPG, PNG, PDF • Max 5MB)</p>
                  )}
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={cerrarModal}
                disabled={enviando}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={marcarAsistencia}
                disabled={enviando}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
