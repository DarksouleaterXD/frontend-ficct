'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  RotateCcw,
  BarChart3,
  TrendingUp,
  Table,
  Users,
  Workflow,
  Hash,
  FileText,
  Globe,
} from 'lucide-react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Bitacora {
  id: number;
  id_usuario: number;
  ip_address: string;
  usuario: Usuario;
  tabla: string;
  operacion: string;
  id_registro: number;
  descripcion: string;
  created_at: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: Bitacora[];
}

interface Estadisticas {
  total_registros: number;
  ultimas_24h: number;
  por_operacion: Array<{ operacion: string; cantidad: number }>;
  por_tabla: Array<{ tabla: string; cantidad: number }>;
  por_usuario: Array<{ id_usuario: number; nombre: string; email: string; cantidad: number }>;
}

export default function BitacoraPage() {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [tabla, setTabla] = useState('');
  const [operacion, setOperacion] = useState('');
  const [usuario, setUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);

  // Estadísticas
  const [stats, setStats] = useState<Estadisticas | null>(null);

  // Expandir detalles
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Obtener bitácoras
  const fetchBitacoras = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      params.append('page', currentPage.toString());
      params.append('per_page', perPage.toString());

      if (search) params.append('search', search);
      if (tabla) params.append('tabla', tabla);
      if (operacion) params.append('operacion', operacion);
      if (usuario) params.append('id_usuario', usuario);
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const res = await fetch(`http://localhost:8000/api/bitacoras?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al cargar bitácoras');

      const data: PaginationData = await res.json();
      setBitacoras(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, tabla, operacion, usuario, fechaInicio, fechaFin]);

  // Obtener estadísticas
  const fetchEstadisticas = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/bitacoras/estadisticas/resumen', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al cargar estadísticas');

      const data = await res.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
    }
  }, []);

  // Exportar a CSV

  // Resetear filtros
  const handleResetearFiltros = () => {
    setSearch('');
    setTabla('');
    setOperacion('');
    setUsuario('');
    setFechaInicio('');
    setFechaFin('');
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchBitacoras();
  }, [fetchBitacoras]);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  const getOperacionColorInline = (operacion: string) => {
    const colores: { [key: string]: { backgroundColor: string; color: string } } = {
      CREATE: { backgroundColor: '#dcfce7', color: '#166534' },
      UPDATE: { backgroundColor: '#dbeafe', color: '#1e40af' },
      DELETE: { backgroundColor: '#fee2e2', color: '#991b1b' },
      READ: { backgroundColor: '#f3f4f6', color: '#374151' },
    };
    return colores[operacion] || { backgroundColor: '#f3f4f6', color: '#374151' };
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES');
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1.5rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Clock size={28} style={{ color: "#2563eb" }} />
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
              Bitácora de Auditoría
            </h1>
          </div>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Registros completos de todas las operaciones del sistema
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "0.5rem", color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ZONA DE CARGA INICIAL */}

        {/* Estadísticas */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "0.75rem" }}>
                <BarChart3 size={18} style={{ color: "#7c3aed" }} />
                Total Registros
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937" }}>
                {stats.total_registros.toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "0.75rem" }}>
                <TrendingUp size={18} style={{ color: "#2563eb" }} />
                Últimas 24h
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{stats.ultimas_24h}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "0.75rem" }}>
                <RotateCcw size={18} style={{ color: "#dc2626" }} />
                Operaciones
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>{stats.por_operacion.length}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "0.75rem" }}>
                <Table size={18} style={{ color: "#16a34a" }} />
                Tablas
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>{stats.por_tabla.length}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "14px", fontWeight: "500", marginBottom: "0.75rem" }}>
                <Users size={18} style={{ color: "#ea580c" }} />
                Usuarios
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ea580c" }}>{stats.por_usuario.length}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Search size={20} style={{ color: "#2563eb" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>Filtros</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            {/* Búsqueda */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Buscar</label>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: "0.75rem", top: "0.75rem", width: "16px", height: "16px", color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder="Descripción, tabla..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", paddingLeft: "2.5rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
                />
              </div>
            </div>

            {/* Tabla */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Tabla</label>
              <select
                value={tabla}
                onChange={(e) => {
                  setTabla(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: "100%", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
              >
                <option value="">Todas</option>
                {stats?.por_tabla.map((t) => (
                  <option key={t.tabla} value={t.tabla}>
                    {t.tabla} ({t.cantidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Operación */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Operación</label>
              <select
                value={operacion}
                onChange={(e) => {
                  setOperacion(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: "100%", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
              >
                <option value="">Todas</option>
                {stats?.por_operacion.map((o) => (
                  <option key={o.operacion} value={o.operacion}>
                    {o.operacion} ({o.cantidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Usuario */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Usuario</label>
              <select
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: "100%", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
              >
                <option value="">Todos</option>
                {stats?.por_usuario.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombre} ({u.cantidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Fecha Inicio</label>
              <div style={{ position: "relative" }}>
                <Calendar style={{ position: "absolute", left: "0.75rem", top: "0.75rem", width: "16px", height: "16px", color: "#9ca3af" }} />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", paddingLeft: "2.5rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Fecha Fin</label>
              <div style={{ position: "relative" }}>
                <Calendar style={{ position: "absolute", left: "0.75rem", top: "0.75rem", width: "16px", height: "16px", color: "#9ca3af" }} />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", paddingLeft: "2.5rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
                />
              </div>
            </div>
          </div>

          {/* Per Page y Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>Registros por página</label>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "14px" }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleResetearFiltros}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", backgroundColor: "#e5e7eb", color: "#1f2937", borderRadius: "0.5rem", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}
              >
                <RotateCcw size={16} />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Bitácoras */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ display: "inline-block", animation: "spin 1s linear infinite", width: "40px", height: "40px", borderRadius: "50%", borderBottom: "2px solid #2563eb", marginBottom: "0.75rem" }}></div>
              <p style={{ color: "#4b5563", marginTop: "0.75rem" }}>⏳ Cargando registros...</p>
            </div>
          ) : bitacoras.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "0.75rem" }}>📭</div>
              <p style={{ color: "#4b5563", fontWeight: "600", marginBottom: "0.5rem" }}>No se encontraron registros</p>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>Intenta con otros filtros o crea datos de prueba</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #d1d5db" }}>
                    <tr>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Clock size={16} style={{ color: "#6b7280" }} />
                        Fecha/Hora
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Users size={16} style={{ color: "#6b7280" }} />
                          Usuario
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Globe size={16} style={{ color: "#6b7280" }} />
                          IP
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Table size={16} style={{ color: "#6b7280" }} />
                          Tabla
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Workflow size={16} style={{ color: "#6b7280" }} />
                          Operación
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Hash size={16} style={{ color: "#6b7280" }} />
                          ID
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FileText size={16} style={{ color: "#6b7280" }} />
                          Descripción
                        </div>
                      </th>
                      <th style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        <Eye size={16} style={{ color: "#6b7280" }} />
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: "1px solid #d1d5db" }}>
                    {bitacoras.map((bitacora) => (
                      <React.Fragment key={bitacora.id}>
                        <tr style={{ borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px", color: "#111827", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Clock style={{ width: "16px", height: "16px", color: "#9ca3af", flexShrink: 0 }} />
                              <span>{formatearFecha(bitacora.created_at)}</span>
                            </div>
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px" }}>
                            <div style={{ fontWeight: "500", color: "#111827" }}>{bitacora.usuario.nombre}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{bitacora.usuario.email}</div>
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px" }}>
                            {bitacora.ip_address === 'LOCAL' ? (
                              <span style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "9999px", fontSize: "12px", fontWeight: "500" }}>
                                🌐 LOCAL
                              </span>
                            ) : (
                              <span style={{ fontFamily: "monospace", color: "#4b5563", fontSize: "13px" }}>{bitacora.ip_address || '-'}</span>
                            )}
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px" }}>
                            <span style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "9999px", fontSize: "12px", fontWeight: "500" }}>
                              {bitacora.tabla}
                            </span>
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px" }}>
                            <span style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: "500", ...getOperacionColorInline(bitacora.operacion) }}>
                              {bitacora.operacion}
                            </span>
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px", color: "#111827", fontFamily: "monospace" }}>{bitacora.id_registro}</td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "14px", color: "#4b5563", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {bitacora.descripcion}
                          </td>
                          <td style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", textAlign: "center" }}>
                            <button
                              onClick={() => setExpandedId(expandedId === bitacora.id ? null : bitacora.id)}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", backgroundColor: "transparent", border: "none", borderRadius: "0.5rem", cursor: "pointer", transition: "background-color 0.2s" }}
                              title={expandedId === bitacora.id ? 'Ocultar' : 'Ver detalles'}
                            >
                              {expandedId === bitacora.id ? (
                                <ChevronLeft style={{ width: "16px", height: "16px", color: "#374151" }} />
                              ) : (
                                <Eye style={{ width: "16px", height: "16px", color: "#374151" }} />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Fila expandida */}
                        {expandedId === bitacora.id && (
                          <tr style={{ backgroundColor: "#eff6ff", borderBottom: "1px solid #d1d5db" }}>
                            <td colSpan={7} style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div>
                                  <p style={{ fontWeight: "600", color: "#374151", marginBottom: "0.25rem", margin: 0 }}>📝 Descripción completa:</p>
                                  <p style={{ color: "#4b5563", whiteSpace: "pre-wrap", backgroundColor: "#f3f4f6", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "14px", margin: 0 }}>
                                    {bitacora.descripcion}
                                  </p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", fontSize: "14px" }}>
                                  <div>
                                    <p style={{ fontWeight: "600", color: "#374151", margin: 0 }}>ID Bitácora:</p>
                                    <p style={{ color: "#4b5563", margin: 0 }}>{bitacora.id}</p>
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: "600", color: "#374151", margin: 0 }}>Usuario ID:</p>
                                    <p style={{ color: "#4b5563", margin: 0 }}>{bitacora.id_usuario}</p>
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: "600", color: "#374151", margin: 0 }}>IP Address:</p>
                                    {bitacora.ip_address === 'LOCAL' ? (
                                      <p style={{ color: "#166534", margin: 0, fontWeight: "500" }}>🌐 LOCAL</p>
                                    ) : (
                                      <p style={{ color: "#4b5563", margin: 0, fontFamily: "monospace" }}>{bitacora.ip_address || '-'}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: "600", color: "#374151", margin: 0 }}>Registro ID:</p>
                                    <p style={{ color: "#4b5563", margin: 0 }}>{bitacora.id_registro}</p>
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: "600", color: "#374151", margin: 0 }}>Tabla:</p>
                                    <p style={{ color: "#4b5563", margin: 0 }}>{bitacora.tabla}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "space-between", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingTop: "1rem", paddingBottom: "1rem", borderTop: "1px solid #d1d5db", backgroundColor: "#f9fafb" }}>
                <div style={{ fontSize: "14px", color: "#4b5563" }}>
                  Mostrando {((currentPage - 1) * perPage) + 1} a {Math.min(currentPage * perPage, total)} de {total} registros
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", backgroundColor: currentPage === 1 ? "#f3f4f6" : "#ffffff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, transition: "all 0.2s" }}
                    title="Anterior"
                  >
                    <ChevronLeft style={{ width: "16px", height: "16px", color: "#374151" }} />
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                    {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                      let pageNum;
                      if (lastPage <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= lastPage - 2) {
                        pageNum = lastPage - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", borderRadius: "0.5rem", border: currentPage === pageNum ? "none" : "1px solid #d1d5db", backgroundColor: currentPage === pageNum ? "#2563eb" : "#ffffff", color: currentPage === pageNum ? "white" : "#374151", cursor: "pointer", fontSize: "14px", fontWeight: currentPage === pageNum ? "600" : "500", transition: "all 0.2s" }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
                    disabled={currentPage === lastPage}
                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", backgroundColor: currentPage === lastPage ? "#f3f4f6" : "#ffffff", cursor: currentPage === lastPage ? "not-allowed" : "pointer", opacity: currentPage === lastPage ? 0.5 : 1, transition: "all 0.2s" }}
                    title="Siguiente"
                  >
                    <ChevronRight style={{ width: "16px", height: "16px", color: "#374151" }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
