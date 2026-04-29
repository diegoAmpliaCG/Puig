import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, FileSearch, Settings, UsersRound } from "lucide-react";
import { switchUserAction } from "@/app/recruiting/actions";
import { getCurrentProfile } from "@/lib/recruiting/auth";
import { listProfiles } from "@/lib/recruiting/db";

const nav = [
  { href: "/recruiting/jobs", label: "Procesos", icon: BriefcaseBusiness },
  { href: "/recruiting/candidates", label: "Candidatos", icon: FileSearch },
  { href: "/recruiting/interviews", label: "Entrevistas", icon: CalendarDays },
  { href: "/recruiting/team/jobs", label: "Equipo", icon: UsersRound },
  { href: "/recruiting/settings/calendar", label: "Mi disponibilidad", icon: Settings },
];

export default async function RecruitingLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile().catch(() => null);
  const profiles = profile ? await listProfiles(profile.company_id) : [];

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <Link href="/recruiting/jobs" className="block">
          <p className="text-lg font-semibold text-slate-950">Recruiting</p>
          <p className="text-xs text-slate-500">Evaluación y entrevistas</p>
        </Link>
        <nav className="mt-8 grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Maqueta funcional</p>
            <h1 className="text-xl font-semibold text-slate-950">Coordinación de selección</h1>
          </div>
          {profile ? (
            <form action={switchUserAction} className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Usuario</span>
              <select name="user_id" defaultValue={profile.id} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
                {profiles.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} · {user.role}
                  </option>
                ))}
              </select>
              <button className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium">Cambiar</button>
            </form>
          ) : null}
        </header>
        <div className="mx-auto w-full max-w-7xl px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
