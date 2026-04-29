"use client";

export default function BookingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-5">
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-amber-950">No se pudo cargar booking</h1>
        <p className="mt-2 text-sm text-amber-900">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white">
          Reintentar
        </button>
      </div>
    </main>
  );
}
