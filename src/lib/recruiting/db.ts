import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { canManage } from "@/lib/recruiting/auth";
import type {
  CalendarConnection,
  Candidate,
  CandidateEvaluation,
  CandidateFile,
  CandidateRankingRow,
  InterviewRequest,
  Job,
  JobFile,
  Profile,
  Team,
} from "@/lib/recruiting/types";

export async function listProfiles(companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, company_id, email, full_name, role")
    .eq("company_id", companyId)
    .order("role");
  if (error) throw new Error(error.message);
  return data as Profile[];
}

export async function listTeams(companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("teams")
    .select("id, company_id, name")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw new Error(error.message);
  return data as Team[];
}

export async function listJobs(profile: Profile) {
  const supabase = getSupabaseAdmin();

  if (canManage(profile)) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Job[];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", profile.id);
  if (membershipError) throw new Error(membershipError.message);

  const teamIds = (memberships ?? []).map((row) => row.team_id);
  if (!teamIds.length) return [];

  const { data: publications, error: publicationError } = await supabase
    .from("job_publications")
    .select("job_id")
    .in("team_id", teamIds);
  if (publicationError) throw new Error(publicationError.message);

  const jobIds = [...new Set((publications ?? []).map((row) => row.job_id))];
  if (!jobIds.length) return [];

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("status", "published")
    .in("id", jobIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Job[];
}

export async function getJob(jobId: string, profile: Profile) {
  const jobs = await listJobs(profile);
  return jobs.find((job) => job.id === jobId) ?? null;
}

export async function getManagedJob(jobId: string, profile: Profile) {
  if (!canManage(profile)) throw new Error("Sin permiso");
  const { data, error } = await getSupabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("id", jobId)
    .single();
  if (error) throw new Error(error.message);
  return data as Job;
}

export async function getJobFiles(jobId: string, companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("job_files")
    .select("*")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as JobFile[];
}

export async function getCandidatesForJob(jobId: string, companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("candidates")
    .select("*, candidate_evaluations(*), candidate_files(*)")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as CandidateRankingRow[];
}

export function evaluationFor(row: CandidateRankingRow) {
  const value = row.candidate_evaluations;
  if (Array.isArray(value)) return value[0] as CandidateEvaluation | undefined;
  return (value as CandidateEvaluation | null) ?? undefined;
}

export async function getCandidate(candidateId: string, profile: Profile) {
  const { data, error } = await getSupabaseAdmin()
    .from("candidates")
    .select("*, candidate_evaluations(*), candidate_files(*), jobs(*)")
    .eq("company_id", profile.company_id)
    .eq("id", candidateId)
    .single();
  if (error) throw new Error(error.message);

  const candidate = data as Candidate & {
    candidate_evaluations: CandidateEvaluation[];
    candidate_files: CandidateFile[];
    jobs: Job;
  };

  if (!canManage(profile)) {
    const publishedJobs = await listJobs(profile);
    if (!publishedJobs.some((job) => job.id === candidate.job_id)) return null;
  }

  return candidate;
}

export async function getCalendarConnection(userId: string, companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("calendar_connections")
    .select("*")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as CalendarConnection | null;
}

export async function listInterviewRequests(companyId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("interview_requests")
    .select("*, candidates(name,email), jobs(title), profiles!interview_requests_interviewer_user_id_fkey(full_name,email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as (InterviewRequest & {
    candidates: { name: string; email: string | null };
    jobs: { title: string };
    profiles: { full_name: string; email: string };
  })[];
}
