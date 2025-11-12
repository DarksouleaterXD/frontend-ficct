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
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  X,
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
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("hoy");

  // Modal de marcado
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<Sesion | null>(null);
  const [estadoAsistencia, setEstadoAsistencia] = useState<"presente" | "ausente" | "retardo" | "justificado">("presente");
  const [observacion, setObservacion] = useState("");
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Días de la semana
  const diasSemana = [
    { id: "hoy", label: "Hoy", dia: new Date().toLocaleDateString('es-ES', { weekday: 'long' }) },
    { id: "lunes", label: "Lunes" },
    { id: "martes", label: "Martes" },
    { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" },
    { id: "viernes", label: "Viernes" },
    { id: "sabado", label: "Sábado" },
  ];

  // Agregar keyframes para animación de spin
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Cargar clases al montar y cuando cambie el día
  useEffect(() => {
    cargarClasesHoy();
    actualizarFechaHora();

    // Actualizar hora cada minuto
    const interval = setInterval(actualizarFechaHora, 60000);
    return () => clearInterval(interval);
  }, [diaSeleccionado]);

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
      
      // Usar el endpoint de mi-horario que ya devuelve todas las clases de la semana
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mi-horario`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Obtener el día de la semana según la selección
        let diaFiltro = "";
        const ahora = new Date();
        const diasMap: { [key: string]: string } = {
          "lunes": "Lunes",
          "martes": "Martes",
          "miercoles": "Miércoles",
          "jueves": "Jueves",
          "viernes": "Viernes",
          "sabado": "Sábado",
          "hoy": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][ahora.getDay()]
        };
        
        diaFiltro = diasMap[diaSeleccionado] || diasMap["hoy"];

        // Convertir la grilla de horarios a formato de sesiones
        const sesionesDelDia: Sesion[] = [];
        
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((fila: any) => {
            // Verificar si hay clase en el día seleccionado
            const claseDelDia = fila[diaFiltro];
            
            if (claseDelDia && claseDelDia.materia) {
              // Usar las horas del bloque (hora_inicio y hora_fin están en la raíz de fila)
              const horaInicio = fila.hora_inicio || claseDelDia.hora_inicio;
              const horaFin = fila.hora_fin || claseDelDia.hora_fin;
              
              // Crear sesión a partir de los datos del horario
              const sesion: Sesion = {
                id: claseDelDia.id,
                materia: claseDelDia.materia,
                grupo: claseDelDia.paralelo,
                aula: claseDelDia.aula || "N/A",
                hora_inicio: horaInicio,
                hora_fin: horaFin,
                estado_sesion: "programada",
                dentro_ventana: verificarVentanaHoraria(horaInicio, horaFin),
                ventana_inicio: calcularVentanaInicio(horaInicio),
                ventana_fin: calcularVentanaFin(horaInicio),
                asistencia_registrada: false,
                asistencia: null,
              };
              
              sesionesDelDia.push(sesion);
            }
          });
        }

        setSesiones(sesionesDelDia);
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

  // Función para verificar si estamos dentro de la ventana horaria
  const verificarVentanaHoraria = (horaInicio: string, horaFin: string): boolean => {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    // Parsear hora de inicio (formato puede ser HH:MM o timestamp)
    let inicioMinutos = 0;
    
    if (horaInicio.includes('T')) {
      // Formato timestamp
      const inicioDate = new Date(horaInicio);
      inicioMinutos = inicioDate.getHours() * 60 + inicioDate.getMinutes();
    } else {
      // Formato HH:MM
      const [h, m] = horaInicio.split(':').map(Number);
      inicioMinutos = h * 60 + m;
    }
    
    // Ventana: 30 minutos antes del inicio hasta 1 hora después del inicio
    const ventanaInicio = inicioMinutos - 30;
    const ventanaFin = inicioMinutos + 60;
    
    return horaActual >= ventanaInicio && horaActual <= ventanaFin;
  };

  const calcularVentanaInicio = (horaInicio: string): string => {
    let inicioMinutos = 0;
    
    if (horaInicio.includes('T')) {
      const inicioDate = new Date(horaInicio);
      inicioMinutos = inicioDate.getHours() * 60 + inicioDate.getMinutes();
    } else {
      const [h, m] = horaInicio.split(':').map(Number);
      inicioMinutos = h * 60 + m;
    }
    
    // 30 minutos antes del inicio
    const ventanaInicio = inicioMinutos - 30;
    const horas = Math.floor(ventanaInicio / 60);
    const minutos = ventanaInicio % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  const calcularVentanaFin = (horaInicio: string): string => {
    let inicioMinutos = 0;
    
    if (horaInicio.includes('T')) {
      const inicioDate = new Date(horaInicio);
      inicioMinutos = inicioDate.getHours() * 60 + inicioDate.getMinutes();
    } else {
      const [h, m] = horaInicio.split(':').map(Number);
      inicioMinutos = h * 60 + m;
    }
    
    // 1 hora después del inicio
    const ventanaFin = inicioMinutos + 60;
    const horas = Math.floor(ventanaFin / 60);
    const minutos = ventanaFin % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  // Función para formatear hora a HH:MM
  const formatearHora = (hora: string): string => {
    if (!hora) return "00:00";
    
    if (hora.includes('T')) {
      // Formato timestamp ISO: 2025-11-12T08:30:00.000000Z
      // Extraer la parte de tiempo directamente sin conversión de zona horaria
      const timePart = hora.split('T')[1];
      if (timePart) {
        const [hh, mm] = timePart.split(':');
        return `${hh}:${mm}`;
      }
    }
    
    // Ya está en formato HH:MM o HH:MM:SS
    if (hora.includes(':')) {
      const parts = hora.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    
    return hora.substring(0, 5);
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
        return { color: "#166534", backgroundColor: "#f0fdf4", border: "1px solid #86efac" };
      case "retardo":
        return { color: "#92400e", backgroundColor: "#fefce8", border: "1px solid #fde047" };
      case "ausente":
        return { color: "#991b1b", backgroundColor: "#fef2f2", border: "1px solid #fecaca" };
      case "justificado":
        return { color: "#1e40af", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" };
      default:
        return { color: "#4b5563", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" };
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: "bold", 
          color: "#1f2937", 
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <Calendar size={32} color="#3b82f6" />
          Mis Clases - Semana
        </h1>
        <p style={{ color: "#6b7280", textTransform: "capitalize", marginBottom: "0.75rem" }}>
          {fechaActual}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} color="#3b82f6" />
          <span style={{ fontSize: "1.125rem", fontWeight: "600", color: "#3b82f6" }}>
            {horaActual}
          </span>
        </div>
      </div>

      {/* Selector de Días */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "0.75rem",
        padding: "0.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        flexWrap: "wrap"
      }}>
        {diasSemana.map((dia) => (
          <button
            key={dia.id}
            onClick={() => setDiaSeleccionado(dia.id)}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              backgroundColor: diaSeleccionado === dia.id ? "#3b82f6" : "transparent",
              color: diaSeleccionado === dia.id ? "white" : "#6b7280",
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              if (diaSeleccionado !== dia.id) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (diaSeleccionado !== dia.id) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {dia.label}
            {dia.id === "hoy" && (
              <span style={{ 
                marginLeft: "0.5rem", 
                fontSize: "0.75rem",
                opacity: 0.8
              }}>
                ({dia.dia})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Botón Actualizar */}
      <button
        onClick={cargarClasesHoy}
        disabled={cargando}
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem",
          backgroundColor: cargando ? "#9ca3af" : "#3b82f6",
          color: "white",
          borderRadius: "0.5rem",
          border: "none",
          cursor: cargando ? "not-allowed" : "pointer",
          fontWeight: "600",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!cargando) e.currentTarget.style.backgroundColor = "#2563eb";
        }}
        onMouseLeave={(e) => {
          if (!cargando) e.currentTarget.style.backgroundColor = "#3b82f6";
        }}
      >
        <RefreshCw size={16} style={{ animation: cargando ? "spin 1s linear infinite" : "none" }} />
        Actualizar
      </button>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "1rem",
          padding: "1rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "#991b1b",
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          padding: "3rem 0" 
        }}>
          <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Lista de Sesiones */}
      {!cargando && sesiones.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <Calendar size={64} color="#9ca3af" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "#6b7280", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
            No tienes clases programadas para {diaSeleccionado === "hoy" ? "hoy" : diasSemana.find(d => d.id === diaSeleccionado)?.label.toLowerCase()}
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            Selecciona otro día de la semana para ver más clases
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {sesiones.length > 0 && (
          <div style={{
            backgroundColor: "#eff6ff",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem"
          }}>
            <Info size={18} color="#3b82f6" />
            <span style={{ color: "#1e40af", fontWeight: "600", fontSize: "0.875rem" }}>
              Mostrando clases de {diaSeleccionado === "hoy" ? "hoy" : diasSemana.find(d => d.id === diaSeleccionado)?.label}
              {" "}({sesiones.length} {sesiones.length === 1 ? "clase" : "clases"})
            </span>
          </div>
        )}
        {sesiones.map((sesion) => (
          <div
            key={sesion.id}
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: `2px solid ${sesion.dentro_ventana ? "#86efac" : "#e5e7eb"}`,
              padding: "1.5rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                {/* Materia y Grupo */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                    {sesion.materia}
                  </h3>
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}>
                    <Users size={14} />
                    Grupo {sesion.grupo}
                  </span>
                </div>

                {/* Aula y Horario */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", color: "#6b7280", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={16} color="#3b82f6" />
                    <span style={{ fontWeight: "500" }}>{sesion.aula}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock size={16} color="#3b82f6" />
                    <span style={{ fontWeight: "500" }}>
                      {formatearHora(sesion.hora_inicio)} - {formatearHora(sesion.hora_fin)}
                    </span>
                  </div>
                </div>

                {/* Estado de Ventana */}
                {sesion.dentro_ventana && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    border: "1px solid #86efac"
                  }}>
                    <CheckCircle size={20} color="#16a34a" />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#166534", fontWeight: "600" }}>
                        Ventana de marcado abierta
                      </span>
                      <span style={{ color: "#16a34a", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
                        ({sesion.ventana_inicio} - {sesion.ventana_fin})
                      </span>
                    </div>
                  </div>
                )}

                {!sesion.dentro_ventana && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    border: "1px solid #e5e7eb"
                  }}>
                    <AlertTriangle size={20} color="#6b7280" />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#4b5563", fontWeight: "600" }}>Ventana cerrada</span>
                      <span style={{ color: "#6b7280", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
                        (Disponible: {sesion.ventana_inicio} - {sesion.ventana_fin})
                      </span>
                    </div>
                  </div>
                )}

                {/* Asistencia Registrada */}
                {sesion.asistencia_registrada && sesion.asistencia && (
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      ...getEstadoColor(sesion.asistencia.estado),
                      display: "flex",
                      alignItems: "start",
                      gap: "0.75rem",
                    }}
                  >
                    {getEstadoIcon(sesion.asistencia.estado)}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Asistencia Registrada</p>
                      <p style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                        Estado:{" "}
                        <span style={{ fontWeight: "600", textTransform: "capitalize" }}>
                          {sesion.asistencia.estado}
                        </span>{" "}
                        • Hora: {sesion.asistencia.hora_marcado}
                      </p>
                      {sesion.asistencia.observacion && (
                        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                          Observación: {sesion.asistencia.observacion}
                        </p>
                      )}
                      <div style={{ 
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        {sesion.asistencia.validado ? (
                          <>
                            <CheckCircle2 size={16} color="#16a34a" />
                            <span style={{ fontSize: "0.875rem", color: "#166534", fontWeight: "600" }}>
                              Validado
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock size={16} color="#f59e0b" />
                            <span style={{ fontSize: "0.875rem", color: "#92400e", fontWeight: "600" }}>
                              Pendiente de validación
                            </span>
                          </>
                        )}
                      </div>
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
                    style={{
                      padding: "0.875rem 1.5rem",
                      borderRadius: "0.5rem",
                      fontWeight: "600",
                      border: "none",
                      cursor: sesion.dentro_ventana ? "pointer" : "not-allowed",
                      backgroundColor: sesion.dentro_ventana ? "#16a34a" : "#d1d5db",
                      color: sesion.dentro_ventana ? "white" : "#6b7280",
                      boxShadow: sesion.dentro_ventana ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => {
                      if (sesion.dentro_ventana) {
                        e.currentTarget.style.backgroundColor = "#15803d";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sesion.dentro_ventana) {
                        e.currentTarget.style.backgroundColor = "#16a34a";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                      }
                    }}
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
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "1rem",
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxWidth: "28rem",
            width: "100%",
            padding: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <CheckCircle size={28} color="#16a34a" />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                Marcar Asistencia
              </h2>
            </div>

            {/* Info de la Sesión */}
            <div style={{
              backgroundColor: "#eff6ff",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              border: "1px solid #bfdbfe"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <BookOpen size={16} color="#1e40af" />
                <p style={{ fontWeight: "600", color: "#1e3a8a", margin: 0 }}>
                  {sesionSeleccionada.materia}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <Users size={14} color="#3b82f6" />
                <p style={{ color: "#2563eb", fontSize: "0.875rem", margin: 0 }}>
                  Grupo {sesionSeleccionada.grupo} • {sesionSeleccionada.aula}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={14} color="#3b82f6" />
                <p style={{ color: "#3b82f6", fontSize: "0.875rem", margin: 0 }}>
                  {sesionSeleccionada.hora_inicio} - {sesionSeleccionada.hora_fin}
                </p>
              </div>
            </div>

            {/* Estado */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}>
                <FileText size={16} />
                Estado *
              </label>
              <select
                value={estadoAsistencia}
                onChange={(e) =>
                  setEstadoAsistencia(e.target.value as "presente" | "ausente" | "retardo" | "justificado")
                }
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="presente">✅ Presente</option>
                <option value="retardo">⏰ Retardo</option>
                <option value="ausente">❌ Ausente</option>
                <option value="justificado">📝 Justificado</option>
              </select>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                * El sistema detectará automáticamente retardos si marca después de la hora de inicio
              </p>
            </div>

            {/* Observación */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}>
                Observación (opcional)
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ej: Clase normal, tema X completado..."
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                {observacion.length}/500 caracteres
              </p>
            </div>

            {/* Evidencia */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
              }}>
                Evidencia (opcional)
              </label>
              <div style={{
                border: "2px dashed #d1d5db",
                borderRadius: "0.5rem",
                padding: "1rem",
                textAlign: "center",
              }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setEvidencia(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                  id="evidencia-input"
                />
                <label htmlFor="evidencia-input" style={{ cursor: "pointer" }}>
                  <Upload size={32} color="#9ca3af" style={{ margin: "0 auto 0.5rem" }} />
                  {evidencia ? (
                    <p style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: "600", margin: 0 }}>
                      {evidencia.name}
                    </p>
                  ) : (
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                      Click para subir archivo (JPG, PNG, PDF • Max 5MB)
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={cerrarModal}
                disabled={enviando}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: enviando ? "not-allowed" : "pointer",
                  backgroundColor: enviando ? "#f3f4f6" : "white",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "white";
                }}
              >
                Cancelar
              </button>
              <button
                onClick={marcarAsistencia}
                disabled={enviando}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  backgroundColor: enviando ? "#9ca3af" : "#16a34a",
                  color: "white",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: enviando ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "#15803d";
                }}
                onMouseLeave={(e) => {
                  if (!enviando) e.currentTarget.style.backgroundColor = "#16a34a";
                }}
              >
                {enviando ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
