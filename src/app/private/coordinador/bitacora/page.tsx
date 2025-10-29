'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
} from 'lucide-react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Bitacora {
  id: number;
  id_usuario: number;
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
  const [success, setSuccess] = useState('');

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
  const handleExportarCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (tabla) params.append('tabla', tabla);
      if (operacion) params.append('operacion', operacion);
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const res = await fetch(`http://localhost:8000/api/bitacoras/exportar/csv?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitacora_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Bitácora exportada exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    }
  };

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

  const getOperacionColor = (operacion: string) => {
    const colores: { [key: string]: string } = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      READ: 'bg-gray-100 text-gray-800',
    };
    return colores[operacion] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Bitácora de Auditoría</h1>
          <p className="text-gray-600">Registros de auditoría y exportación</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ {success}
          </div>
        )}

        {/* ZONA DE CARGA INICIAL */}
        {!stats && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <p className="font-semibold mb-2 text-lg">📌 Sin datos aún</p>
            <p className="mb-4">La bitácora está vacía. Ejecuta este comando para generar 50 registros de prueba:</p>
            <div className="bg-blue-100 border border-blue-300 text-blue-900 p-4 rounded font-mono text-sm mb-3 overflow-x-auto">
              GET /api/bitacoras/seed/datos-prueba
            </div>
            <p className="text-sm">O en Insomnia/Postman: <span className="font-mono">http://localhost:8000/api/bitacoras/seed/datos-prueba</span></p>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">📊 Total Registros</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total_registros.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">⏰ Últimas 24h</div>
              <div className="text-3xl font-bold text-blue-600">{stats.ultimas_24h}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">⚙️ Operaciones</div>
              <div className="text-3xl font-bold text-purple-600">{stats.por_operacion.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">📁 Tablas</div>
              <div className="text-3xl font-bold text-green-600">{stats.por_tabla.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">👥 Usuarios</div>
              <div className="text-3xl font-bold text-orange-600">{stats.por_usuario.length}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔍</span>
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Descripción, tabla..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tabla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tabla</label>
              <select
                value={tabla}
                onChange={(e) => {
                  setTabla(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Operación</label>
              <select
                value={operacion}
                onChange={(e) => {
                  setOperacion(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <select
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Per Page y Botones */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Registros por página</label>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <button
              onClick={handleResetearFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              🔄 Limpiar
            </button>
            <button
              onClick={handleExportarCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Tabla de Bitácoras */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600">⏳ Cargando registros...</p>
            </div>
          ) : bitacoras.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-600 font-semibold mb-2">No se encontraron registros</p>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o crea datos de prueba</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">⏰ Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">👤 Usuario</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">📁 Tabla</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">⚙️ Operación</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">🆔 ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">📝 Descripción</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">👁️</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bitacoras.map((bitacora) => (
                      <React.Fragment key={bitacora.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{formatearFecha(bitacora.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">{bitacora.usuario.nombre}</div>
                            <div className="text-xs text-gray-500">{bitacora.usuario.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {bitacora.tabla}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOperacionColor(bitacora.operacion)}`}>
                              {bitacora.operacion}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">{bitacora.id_registro}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {bitacora.descripcion}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setExpandedId(expandedId === bitacora.id ? null : bitacora.id)}
                              className="inline-flex items-center justify-center p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title={expandedId === bitacora.id ? 'Ocultar' : 'Ver detalles'}
                            >
                              {expandedId === bitacora.id ? (
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Fila expandida */}
                        {expandedId === bitacora.id && (
                          <tr className="bg-blue-50 border-b border-gray-200">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="font-semibold text-gray-700 mb-1">📝 Descripción completa:</p>
                                  <p className="text-gray-600 whitespace-pre-wrap bg-gray-100 p-3 rounded text-sm">
                                    {bitacora.descripcion}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="font-semibold text-gray-700">ID Bitácora:</p>
                                    <p className="text-gray-600">{bitacora.id}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700">Usuario ID:</p>
                                    <p className="text-gray-600">{bitacora.id_usuario}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700">Registro ID:</p>
                                    <p className="text-gray-600">{bitacora.id_registro}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700">Tabla:</p>
                                    <p className="text-gray-600">{bitacora.tabla}</p>
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
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * perPage) + 1} a {Math.min(currentPage * perPage, total)} de {total} registros
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>

                  <div className="flex items-center gap-1">
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
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
                    disabled={currentPage === lastPage}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
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
