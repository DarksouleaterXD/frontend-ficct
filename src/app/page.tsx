"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);

      if (!response.success) {
        throw new Error(response.message || response.error || "Credenciales inválidas");
      }

      if (response.data?.token) {
        window.location.href = "/private/admin";
      } else {
        throw new Error("No se recibió token de autenticación");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "32rem" }}>
        {/* Card Principal */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", padding: "2rem" }}>
          
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "64px", 
              height: "64px", 
              background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", 
              borderRadius: "0.5rem", 
              marginBottom: "1rem"
            }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "24px" }}>FC</span>
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
              FICCT
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Sistema de Gestión Académica
            </p>
          </div>

          {/* Subtítulo */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
              Bienvenido
            </h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Inicie sesión para acceder al sistema de gestión de horarios y asistencia
            </p>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: "0.5rem" }}>
              <p style={{ color: "#dc2626", fontSize: "14px", fontWeight: "500" }}>
                {error}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Correo Institucional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.email@universidad.edu"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f9fafb",
                  color: "#1f2937",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Contraseña
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f9fafb",
                    color: "#1f2937",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                  }}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                fontWeight: "600",
                borderRadius: "0.5rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? "0.5" : "1",
                transition: "all 0.3s ease",
                fontSize: "16px"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Separador */}
          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, borderTop: "1px solid #e5e7eb" }}></div>
            <span style={{ padding: "0 0.75rem", fontSize: "12px", color: "#9ca3af" }}>O</span>
            <div style={{ flex: 1, borderTop: "1px solid #e5e7eb" }}></div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "center", fontSize: "14px" }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        {/* Modal Olvidar Contraseña */}
        {showForgotPassword && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
            onClick={() => setShowForgotPassword(false)}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "0.75rem",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "2rem",
                maxWidth: "28rem",
                width: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>
                Recuperar Contraseña
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "1.5rem" }}>
                Ingresa tu correo institucional y te enviaremos las instrucciones para recuperar tu contraseña.
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Correo Institucional
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tu.email@universidad.edu"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail) {
                      alert(`Instrucciones de recuperación enviadas a: ${forgotEmail}`);
                      setShowForgotPassword(false);
                      setForgotEmail("");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
            © 2025 Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones
          </p>
          <p style={{ fontSize: "12px", color: "#d1d5db", marginTop: "0.5rem" }}>
            Sistema de Gestión Académica v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
