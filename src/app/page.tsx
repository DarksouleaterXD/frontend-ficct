"use client";

import { useState } from "react";
import { login } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.error || response.message || "Credenciales inválidas");
      }

      // Guardar token y redirigir
      if (response.token) {
        localStorage.setItem("token", response.token);
        // Guardar datos del usuario si los devuelve el backend
        if (response.data) {
          localStorage.setItem("user", JSON.stringify(response.data));
        }
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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg mb-4">
              <span className="text-white font-bold text-2xl">FC</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              FICCT
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Sistema de Gestión Académica
            </p>
          </div>

          {/* Subtítulo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Bienvenido
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Inicie sesión para acceder al sistema de gestión de horarios y asistencia
            </p>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-200 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo Institucional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.email@universidad.edu"
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Recordarme */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                Recuérdame en este dispositivo
              </label>
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
            <span className="px-3 text-xs text-slate-500 dark:text-slate-400">O</span>
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          {/* Links */}
          <div className="space-y-3 text-center text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              ¿Olvidaste tu contraseña?
            </a>
            <p className="text-slate-600 dark:text-slate-400">
              ¿Necesitas ayuda?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Contacta soporte
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            © 2025 Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            Sistema de Gestión Académica v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
