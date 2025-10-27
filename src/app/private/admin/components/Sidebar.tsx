"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/private/admin", icon: "📊" },
  { label: "Gestión Académica", href: "/private/admin/gestion-academica", icon: "🎓" },
  {
    label: "Horarios",
    href: "/private/admin/horarios",
    icon: "⏰",
  },
  {
    label: "Aulas",
    href: "/private/admin/aulas",
    icon: "🏫",
  },
  {
    label: "Materias",
    href: "/private/admin/materias",
    icon: "📚",
  },
  {
    label: "Grupos",
    href: "/private/admin/grupos",
    icon: "👥",
  },
  {
    label: "Carreras",
    href: "/private/admin/carreras",
    icon: "🎯",
  },
  {
    label: "Docentes",
    href: "/private/admin/docentes",
    icon: "👨‍🏫",
  },
  {
    label: "Asistencia",
    href: "/private/admin/asistencia",
    icon: "✅",
  },
  {
    label: "Bitácora",
    href: "/private/admin/bitacora",
    icon: "📋",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/private/admin") {
      return pathname === "/private/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-50 ${
          isOpen ? "w-64" : "w-20"
        } md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header del Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {isOpen && (
            <div>
              <h1 className="text-xl font-bold">FICCT</h1>
              <p className="text-xs text-blue-200">Sistema Académico</p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex p-2 hover:bg-blue-700 rounded-lg transition"
          >
            {isOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.href)
                    ? "bg-blue-600 shadow-lg"
                    : "hover:bg-blue-700"
                }`}
              >
                <span className="text-xl min-w-max">{item.icon}</span>
                {isOpen && (
                  <span className="font-medium text-sm truncate">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer del Sidebar */}
        <div className="border-t border-blue-700 p-4 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-red-600 transition-all"
          >
            <span className="text-xl min-w-max">🚪</span>
            {isOpen && <span className="font-medium text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Botón toggle para móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 md:hidden z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        ☰
      </button>
    </>
  );
}
