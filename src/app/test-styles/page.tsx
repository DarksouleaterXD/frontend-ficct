"use client";

export default function TestStyles() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Test de Estilos Tailwind</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Card 1 - Tailwind</h2>
            <p className="text-gray-600">Esto usa clases Tailwind</p>
          </div>
          
          <div style={{ padding: "1.5rem", backgroundColor: "#ffffff", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "0.5rem", margin: 0 }}>Card 2 - Inline Styles</h2>
            <p style={{ color: "#6b7280", margin: 0 }}>Esto usa estilos inline</p>
          </div>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <h3 className="text-lg font-semibold mb-2">Blue Section - Tailwind</h3>
          <p>Este debe tener fondo azul claro</p>
        </div>
      </div>
    </div>
  );
}
