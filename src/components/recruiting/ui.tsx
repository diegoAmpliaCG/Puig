import Link from "next/link";
import { candidateStatusLabels, jobStatusLabels, recommendationLabels } from "@/lib/recruiting/constants";

const statusTone: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cv_selection: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-amber-50 text-amber-800 border-amber-200",
  ranking_ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  published: "bg-indigo-50 text-indigo-700 border-indigo-200",
  closed: "bg-zinc-200 text-zinc-700 border-zinc-300",
  advance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  review: "bg-amber-50 text-amber-800 border-amber-200",
  reject: "bg-rose-50 text-rose-700 border-rose-200",
  scheduled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview_requested: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone[value] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {jobStatusLabels[value] || candidateStatusLabels[value] || recommendationLabels[value] || value}
    </span>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-10 items-center justify-center rounded-md bg-[#2457a6] px-4 text-sm font-medium text-white hover:bg-[#153b75]"
          : "inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
      }
    >
      {children}
    </Link>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  const classes =
    variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "secondary"
        ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        : "bg-[#2457a6] text-white hover:bg-[#153b75]";
  return <button className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium ${classes}`}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#2457a6] focus:ring-2 focus:ring-blue-100";

export const textareaClass =
  "min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-[#2457a6] focus:ring-2 focus:ring-blue-100";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
