"use client";

import { useEffect, useState } from "react";

interface UserData {
  name?: string;
  email?: string;
  rol?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      const userRol = localStorage.getItem("rol");
      
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      }
      
      if (userRol) {
        setRol(userRol);
      }
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Bienvenido al Dashboard
        </h1>
        {user && (
          <div>
            <p className="text-slate-600 dark:text-slate-400">
              Hola, <span className="font-semibold text-blue-600">{user.name}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Rol: <span className="font-semibold capitalize">{rol}</span>
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Horarios
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="text-4xl opacity-20">⏰</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Aulas
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="text-4xl opacity-20">🏫</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Materias
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="text-4xl opacity-20">📚</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Docentes
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                0
              </p>
            </div>
            <div className="text-4xl opacity-20">👨‍🏫</div>
          </div>
        </div>
      </div>

      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Sistema de Gestión Académica</h2>
        <p className="text-blue-100">
          Utiliza el menú lateral para acceder a los diferentes módulos del sistema. 
          Gestiona horarios, aulas, materias, grupos, carreras, docentes, asistencia y más.
        </p>
      </div>
    </div>
  );
}
