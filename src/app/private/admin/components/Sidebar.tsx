"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Building2,
  Book,
  Users,
  Award,
  Users2,
  CheckSquare,
  ClipboardList,
  Power,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/private/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Gestión Académica", href: "/private/admin/gestion-academica", icon: <BookOpen size={20} /> },
    { label: "Horarios", href: "/private/admin/horarios", icon: <Clock size={20} /> },
    { label: "Aulas", href: "/private/admin/aulas", icon: <Building2 size={20} /> },
    { label: "Materias", href: "/private/admin/materias", icon: <Book size={20} /> },
    { label: "Grupos", href: "/private/admin/grupos", icon: <Users size={20} /> },
    { label: "Carreras", href: "/private/admin/carreras", icon: <Award size={20} /> },
    { label: "Docentes", href: "/private/admin/docentes", icon: <Users2 size={20} /> },
    { label: "Asistencia", href: "/private/admin/asistencia", icon: <CheckSquare size={20} /> },
    { label: "Bitácora", href: "/private/admin/bitacora", icon: <ClipboardList size={20} /> },
  ];

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
      {/* Sidebar */}
      <aside
        style={{
          width: isOpen ? "256px" : "80px",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          transition: "width 0.3s ease",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          borderRight: "1px solid #e5e7eb",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* Header del Sidebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {isOpen && (
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                FICCT
              </h1>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "0.25rem 0 0 0" }}>
                Sistema Académico
              </p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: "0.5rem",
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              color: "#374151",
              cursor: "pointer",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navegación */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  transition: "all 0.3s ease",
                  backgroundColor: isActive(item.href) ? "#dbeafe" : "transparent",
                  color: isActive(item.href) ? "#1e40af" : "#6b7280",
                  cursor: "pointer",
                  borderLeft: isActive(item.href) ? "4px solid #3b82f6" : "4px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", minWidth: "24px", color: isActive(item.href) ? "#3b82f6" : "inherit" }}>
                  {item.icon}
                </div>
                {isOpen && (
                  <span style={{ fontSize: "14px", fontWeight: isActive(item.href) ? "600" : "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer del Sidebar */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "1rem",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fee2e2";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fef2f2";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", minWidth: "24px" }}>
              <Power size={20} />
            </div>
            {isOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
