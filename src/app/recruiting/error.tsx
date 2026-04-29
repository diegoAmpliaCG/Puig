"use client";

export default function RecruitingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-amber-950">Configuración pendiente</h2>
      <p className="mt-2 text-sm text-amber-900">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white">
        Reintentar
      </button>
    </div>
  );
}
