/**
 * Paleta de colores profesional para el sistema FICCT
 */

export const colors = {
  // Colores Principales
  primary: {
    slate: "#475569", // Azul Pizarra (Primary)
    dark: "#334155", // Azul Pizarra Oscuro
    accent: "#3b82f6", // Azul Acento
  },

  // Colores Neutrales
  neutral: {
    bgPrimary: "#0f172a", // Fondo Principal
    bgCards: "#1e293b", // Fondo Tarjetas
    borders: "#334155", // Bordes
    textPrimary: "#f1f5f9", // Texto Principal
    textSecondary: "#94a3b8", // Texto Secundario
  },

  // Colores de Estado
  states: {
    hover: "#64748b", // Hover
    infoBanner: "#1e40af", // Banner Info
    infoBg: "#1e3a8a", // Fondo del banner
  },

  // Colores adicionales para componentes
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

// Clases de Tailwind equivalentes
export const tailwindColors = {
  primary: {
    slate: "bg-slate-600 text-slate-600 border-slate-600",
    dark: "bg-slate-700 text-slate-700 border-slate-700",
    accent: "bg-blue-500 text-blue-500 border-blue-500",
  },
  neutral: {
    bgPrimary: "bg-slate-950",
    bgCards: "bg-slate-800",
    borders: "border-slate-700",
    textPrimary: "text-slate-50",
    textSecondary: "text-slate-400",
  },
  states: {
    hover: "hover:bg-slate-700",
    infoBanner: "bg-blue-900",
    infoBg: "bg-blue-950",
  },
};
