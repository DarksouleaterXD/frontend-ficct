'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Asistencia {
  id: number;
  docente: string;
  docente_ci: string;
  materia: string;
  grupo: string;
  fecha: string;
  hora_clase: string;
  hora_marcado: string;
  aula: string;
  estado: string;
  metodo_registro: string;
  validado: boolean;
  observacion: string | null;
  ip_marcado: string | null;
}

export default function VerificacionAsistenciasPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    docente: '',
    estado: '',
    validado: '',
  });

  const cargarAsistencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (filtros.docente) params.append('docente', filtros.docente);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.validado) params.append('validado', filtros.validado);

      const response = await fetch(`/api/asistencias/verificar?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAsistencias(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar asistencias del día actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    setFiltros(prev => ({ ...prev, fecha_desde: hoy, fecha_hasta: hoy }));
  }, []);

  useEffect(() => {
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      cargarAsistencias();
    }
  }, [filtros]);

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      presente: { label: 'Presente', variant: 'default' },
      ausente: { label: 'Ausente', variant: 'destructive' },
      justificado: { label: 'Justificado', variant: 'secondary' },
    };

    const est = estados[estado] || { label: estado, variant: 'outline' };
    return <Badge variant={est.variant}>{est.label}</Badge>;
  };

  const getValidadoBadge = (validado: boolean) => {
    return validado ? (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="w-3 h-3" />
        Validado
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Pendiente
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Verificación de Asistencias Docentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Desde</label>
              <Input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hasta</label>
              <Input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Docente (CI)</label>
              <Input
                placeholder="Buscar por CI"
                value={filtros.docente}
                onChange={(e) => setFiltros({ ...filtros, docente: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros({ ...filtros, estado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="presente">Presente</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                  <SelectItem value="justificado">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Validación</label>
              <Select value={filtros.validado} onValueChange={(value) => setFiltros({ ...filtros, validado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Validados</SelectItem>
                  <SelectItem value="false">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={cargarAsistencias} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Cargando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Asistencias Registradas ({asistencias.length})
          </h2>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Cargando asistencias...</p>
            </CardContent>
          </Card>
        ) : asistencias.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron asistencias con los filtros aplicados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {asistencias.map((asistencia) => (
              <Card key={asistencia.id}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Docente */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{asistencia.docente}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">CI: {asistencia.docente_ci}</p>
                    </div>

                    {/* Materia y Grupo */}
                    <div>
                      <p className="font-medium">{asistencia.materia}</p>
                      <p className="text-sm text-muted-foreground">Grupo: {asistencia.grupo}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Aula: {asistencia.aula}</span>
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{asistencia.fecha}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Clase: {asistencia.hora_clase}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Marcado: {asistencia.hora_marcado}</span>
                      </div>
                    </div>

                    {/* Estado y Validación */}
                    <div className="space-y-2">
                      {getEstadoBadge(asistencia.estado)}
                      {getValidadoBadge(asistencia.validado)}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Método: </span>
                        <span className="font-medium">{asistencia.metodo_registro}</span>
                      </div>
                      {asistencia.ip_marcado && (
                        <div className="text-xs text-muted-foreground">
                          IP: {asistencia.ip_marcado}
                        </div>
                      )}
                    </div>
                  </div>

                  {asistencia.observacion && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Observación:</strong> {asistencia.observacion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
