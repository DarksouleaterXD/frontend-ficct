"use client";

export default function CarrerasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Gestión de Carreras
        </h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Nueva Carrera
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Módulo de Carreras - En desarrollo
        </p>
      </div>
    </div>
  );
}
