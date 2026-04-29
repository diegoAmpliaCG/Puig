export function ConfigPending({ missing }: { missing: string[] }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-amber-950">Configuración pendiente</h2>
      <p className="mt-2 text-sm text-amber-900">
        Faltan variables de entorno en Vercel. Agregarlas y redeployar.
      </p>
      <ul className="mt-4 grid gap-2 text-sm font-medium text-amber-950">
        {missing.map((name) => (
          <li key={name} className="rounded-md bg-white/70 px-3 py-2 font-mono">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
