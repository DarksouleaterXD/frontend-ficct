"use client";

import { useState, useEffect } from "react";
import { Search, AlertCircle, CheckCircle, Download } from "lucide-react";

interface Aula {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion?: string;
  piso?: number;
  disponible: boolean;
}

interface Bloque {
  id: number;
  numero: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  vigente?: boolean;
}

export default function AulasDisponiblesPage() {
  // Estados
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [diaSemana, setDiaSemana] = useState("1");
  const [idBloque, setIdBloque] = useState("");
  const [aforoMinimo, setAforoMinimo] = useState("0");
  const [tipo, setTipo] = useState("");
  const [idPeriodo, setIdPeriodo] = useState("");

  const diasSemana = [
    { valor: "1", nombre: "Lunes" },
    { valor: "2", nombre: "Martes" },
    { valor: "3", nombre: "Miércoles" },
    { valor: "4", nombre: "Jueves" },
    { valor: "5", nombre: "Viernes" },
  ];

  const tipos = [
    { valor: "", nombre: "Todos los tipos" },
    { valor: "teorica", nombre: "Teórica" },
    { valor: "practica", nombre: "Práctica" },
    { valor: "laboratorio", nombre: "Laboratorio" },
    { valor: "mixta", nombre: "Mixta" },
  ];

  // Cargar bloques y periodos
  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem("token");
      try {
        // Cargar bloques
        const responseBlockes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bloques-horarios`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (responseBlockes.ok) {
          const dataBlockes = await responseBlockes.json();
          setBloques(dataBlockes.data || []);
        }

        // Cargar periodos
        const responsePeriodos = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/periodos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (responsePeriodos.ok) {
          const dataPeriodos = await responsePeriodos.json();
          setPeriodos(dataPeriodos.data || []);
          // Seleccionar el vigente por defecto
          const vigente = dataPeriodos.data?.find(
            (p: Periodo) => p.vigente === true
          );
          if (vigente) setIdPeriodo(String(vigente.id));
        }
      } catch (err) {
        console.error("Error cargando datos", err);
      }
    };
    fetchDatos();
  }, []);

  // Buscar disponibilidad
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idBloque) {
      setError("Por favor selecciona un bloque horario");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        dia_semana: diaSemana,
        id_bloque: idBloque,
        aforo_minimo: aforoMinimo,
      });

      if (tipo) params.append("tipo", tipo);
      if (idPeriodo) params.append("id_periodo", idPeriodo);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/aulas-disponibilidad?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Error al buscar disponibilidad");
      }

      const data = await response.json();

      if (data.success) {
        setAulas(data.data || []);
        setSuccess(data.message || "Búsqueda completada");
      } else {
        setError(data.message || "Error en la búsqueda");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar");
    } finally {
      setLoading(false);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    const bloqueSeleccionado = bloques.find((b) => b.id === parseInt(idBloque));
    const diaSeleccionado = diasSemana.find((d) => d.valor === diaSemana);
    const tipoSeleccionado = tipos.find((t) => t.valor === tipo);

    const html = `
      <html>
        <head>
          <title>Disponibilidad de Aulas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .filtros { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #3b82f6; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <h1>Consulta de Disponibilidad de Aulas</h1>
          <div class="filtros">
            <p><span class="label">Día:</span> ${diaSeleccionado?.nombre}</p>
            <p><span class="label">Bloque:</span> ${bloqueSeleccionado?.nombre} (${bloqueSeleccionado?.hora_inicio} - ${bloqueSeleccionado?.hora_fin})</p>
            <p><span class="label">Aforo Mínimo:</span> ${aforoMinimo}</p>
            <p><span class="label">Tipo:</span> ${tipoSeleccionado?.nombre}</p>
            <p><span class="label">Total Aulas Disponibles:</span> ${aulas.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Piso</th>
              </tr>
            </thead>
            <tbody>
              ${aulas
                .map(
                  (aula) => `
                <tr>
                  <td>${aula.codigo}</td>
                  <td>${aula.nombre}</td>
                  <td>${aula.tipo}</td>
                  <td>${aula.capacidad}</td>
                  <td>${aula.ubicacion || "N/A"}</td>
                  <td>${aula.piso || "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <p style="text-align: right; color: #999; font-size: 12px;">
            Generado: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;

    const ventana = window.open("", "", "width=1000,height=600");
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
          Disponibilidad de Aulas
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Consulta aulas disponibles por día, bloque y criterios
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

      {/* Formulario de Filtros */}
      <form
        onSubmit={handleBuscar}
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Grilla de Filtros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {/* Día */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
              Día de la Semana *
            </label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            >
              {diasSemana.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Bloque */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
              Bloque Horario *
            </label>
            <select
              value={idBloque}
              onChange={(e) => setIdBloque(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            >
              <option value="">Selecciona un bloque...</option>
              {bloques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} ({b.hora_inicio} - {b.hora_fin})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
              Tipo de Aula
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            >
              {tipos.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Aforo Mínimo */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
              Capacidad Mínima
            </label>
            <input
              type="number"
              min="0"
              value={aforoMinimo}
              onChange={(e) => setAforoMinimo(e.target.value)}
              placeholder="0"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            />
          </div>

          {/* Período */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
              Período Académico
            </label>
            <select
              value={idPeriodo}
              onChange={(e) => setIdPeriodo(e.target.value)}
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
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#1e40af";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#3b82f6";
            }}
          >
            <Search size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
            {loading ? "Buscando..." : "Buscar"}
          </button>

          {aulas.length > 0 && (
            <button
              type="button"
              onClick={handleExportarPDF}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
            >
              <Download size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
              Exportar PDF
            </button>
          )}
        </div>
      </form>

      {/* Resultados */}
      {aulas.length > 0 ? (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ color: "#374151", fontWeight: "600", margin: 0 }}>
              {aulas.length} Aula{aulas.length !== 1 ? "s" : ""} Disponible{aulas.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Código
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Nombre
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Tipo
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Capacidad
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Ubicación
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#374151" }}>
                    Piso
                  </th>
                </tr>
              </thead>
              <tbody>
                {aulas.map((aula, idx) => (
                  <tr
                    key={aula.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "#1f2937",
                        fontWeight: "500",
                        backgroundColor: "#dbeafe",
                      }}
                    >
                      {aula.codigo}
                    </td>
                    <td style={{ padding: "1rem", color: "#1f2937" }}>{aula.nombre}</td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                      >
                        {aula.tipo}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#1f2937", fontWeight: "600" }}>
                      {aula.capacidad}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>{aula.ubicacion || "—"}</td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>{aula.piso || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
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
            <p style={{ color: "#6b7280" }}>
              {aulas.length === 0 && idBloque
                ? "No hay aulas disponibles con los criterios seleccionados"
                : "Selecciona los filtros y presiona 'Buscar'"}
            </p>
          </div>
        )
      )}
    </div>
  );
}
