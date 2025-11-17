"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
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
  Calendar,
  UserCog,
  Shield,
  FileText,
} from "lucide-react";
import { isAdmin, isCoordinador, isAutoridad, isDocente } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Definir items según el rol
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { label: "Dashboard", href: "/private/admin", icon: <LayoutDashboard size={20} /> },
    ];

    // Admin ven opciones de gestión en /admin
    if (isAdmin()) {
      baseItems.push(
        { label: "Periodos", href: "/private/admin/periodos", icon: <Calendar size={20} /> },
        { label: "Materias", href: "/private/admin/materias", icon: <Book size={20} /> },
        { label: "Docentes", href: "/private/admin/docentes", icon: <Users2 size={20} /> },
        { label: "Aulas", href: "/private/admin/aulas", icon: <Building2 size={20} /> },
        { label: "Grupos", href: "/private/admin/grupos", icon: <Users size={20} /> },
        { label: "Horarios", href: "/private/admin/horarios", icon: <Clock size={20} /> },
        { label: "Bloques Horarios", href: "/private/admin/bloques-horarios", icon: <Clock size={20} /> }
      );
    }

    // Coordinador ven opciones de gestión en /coordinador
    if (isCoordinador()) {
      baseItems.push(
        { label: "Periodos", href: "/private/coordinador/periodos", icon: <Calendar size={20} /> },
        { label: "Materias", href: "/private/coordinador/materias", icon: <Book size={20} /> },
        { label: "Docentes", href: "/private/coordinador/docentes", icon: <Users2 size={20} /> },
        { label: "Aulas", href: "/private/coordinador/aulas", icon: <Building2 size={20} /> },
        { label: "Grupos", href: "/private/coordinador/grupos", icon: <Users size={20} /> },
        { label: "Horarios", href: "/private/coordinador/horarios", icon: <Clock size={20} /> },
        { label: "Bloques Horarios", href: "/private/coordinador/bloques-horarios", icon: <Clock size={20} /> },
        { label: "Carga Horaria", href: "/private/coordinador/carga-horaria", icon: <ClipboardList size={20} /> },
        { label: "Validar Asistencias", href: "/private/coordinador/validar-asistencias", icon: <CheckSquare size={20} /> }
      );
    }

    // Solo Admin
    if (isAdmin()) {
      baseItems.push(
        { label: "Carreras", href: "/private/admin/carreras", icon: <Award size={20} /> },
        { label: "Usuarios", href: "/private/admin/usuarios", icon: <UserCog size={20} /> },
        { label: "Roles", href: "/private/admin/roles", icon: <Shield size={20} /> },
        { label: "Validar Asistencias", href: "/private/admin/asistencia", icon: <CheckSquare size={20} /> },
        { label: "Reportes", href: "/private/admin/reportes", icon: <FileText size={20} /> },
        { label: "Bitácora", href: "/private/admin/bitacora", icon: <ClipboardList size={20} /> }
      );
    }

    // Autoridad - Solo lectura
    if (isAutoridad()) {
      baseItems.push(
        { label: "Periodos", href: "/private/autoridad/periodos", icon: <Calendar size={20} /> },
        { label: "Materias", href: "/private/autoridad/materias", icon: <Book size={20} /> },
        { label: "Docentes", href: "/private/autoridad/docentes", icon: <Users2 size={20} /> },
        { label: "Aulas", href: "/private/autoridad/aulas", icon: <Building2 size={20} /> },
        { label: "Grupos", href: "/private/autoridad/grupos", icon: <Users size={20} /> },
        { label: "Horarios", href: "/private/autoridad/horarios", icon: <Clock size={20} /> },
        { label: "Carreras", href: "/private/autoridad/carreras", icon: <Award size={20} /> },
        { label: "Bitácora", href: "/private/autoridad/bitacora", icon: <ClipboardList size={20} /> }
      );
    }

    // Docente
    if (isDocente()) {
      baseItems.push(
        { label: "Mi Horario", href: "/private/docente/mi-horario", icon: <Clock size={20} /> },
        { label: "Mis Asistencias", href: "/private/docente/asistencias", icon: <CheckSquare size={20} /> }
      );
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    localStorage.removeItem("permisos");
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
