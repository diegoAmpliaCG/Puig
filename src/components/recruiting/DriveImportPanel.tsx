"use client";

import { useEffect, useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";

type DriveFile = { id: string; name: string; mimeType: string; modifiedTime?: string };

export function DriveImportPanel({ jobId }: { jobId: string }) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [connected, setConnected] = useState(false);
  const [jdId, setJdId] = useState("");
  const [cvIds, setCvIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/recruiting/google/drive/files")
      .then((res) => res.json())
      .then((data) => {
        setConnected(Boolean(data.connected));
        setFiles(data.files || []);
      })
      .catch(() => setMessage("No se pudo leer Drive."));
  }, []);

  const selectedJd = useMemo(() => files.find((file) => file.id === jdId) || null, [files, jdId]);
  const selectedCvs = useMemo(() => files.filter((file) => cvIds.includes(file.id)), [files, cvIds]);

  async function importFiles() {
    setMessage("Importando...");
    const res = await fetch("/api/recruiting/google/drive/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, jobDescription: selectedJd, cvs: selectedCvs }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Error importando.");
      return;
    }
    setMessage("Importado. Recarga la vista.");
  }

  if (!connected) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <a className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium" href="/api/recruiting/google/drive/connect">
          <UploadCloud size={16} />
          Conectar Google Drive
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Job Description desde Drive</label>
        <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={jdId} onChange={(event) => setJdId(event.target.value)}>
          <option value="">Sin seleccionar</option>
          {files.map((file) => (
            <option key={file.id} value={file.id}>{file.name}</option>
          ))}
        </select>
      </div>
      <div className="grid max-h-52 gap-2 overflow-auto rounded-md border border-slate-200 bg-white p-3">
        {files.map((file) => (
          <label key={file.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cvIds.includes(file.id)}
              onChange={(event) => setCvIds((current) => event.target.checked ? [...current, file.id] : current.filter((id) => id !== file.id))}
            />
            {file.name}
          </label>
        ))}
      </div>
      <button onClick={importFiles} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">
        Importar seleccionados
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
