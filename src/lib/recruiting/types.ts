export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type ProfileRole = "admin" | "gestor" | "team_user";
export type JobStatus = "draft" | "cv_selection" | "processing" | "ranking_ready" | "published" | "closed";
export type CandidateStatus =
  | "selected"
  | "processing"
  | "ranked"
  | "published"
  | "viewed_by_team"
  | "interview_requested"
  | "booking_opened"
  | "scheduled"
  | "interview_done"
  | "advanced"
  | "rejected";
export type Recommendation = "advance" | "review" | "reject";
export type InterviewStatus = "created" | "email_sent" | "booking_opened" | "scheduled" | "expired" | "cancelled" | "failed";

export type Profile = {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
};

export type Team = {
  id: string;
  company_id: string;
  name: string;
};

export type Job = {
  id: string;
  company_id: string;
  title: string;
  area: string;
  location: string;
  modality: string;
  seniority: string;
  description: string;
  job_description_text: string | null;
  job_description_file_path: string | null;
  status: JobStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Candidate = {
  id: string;
  company_id: string;
  job_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: CandidateStatus;
  created_at: string;
  updated_at: string;
};

export type CandidateFile = {
  id: string;
  company_id: string;
  candidate_id: string;
  drive_file_id: string | null;
  file_name: string;
  file_hash: string | null;
  storage_path: string;
  mime_type: string;
  created_at: string;
};

export type JobFile = {
  id: string;
  company_id: string;
  job_id: string;
  source: string;
  drive_file_id: string | null;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_role: "job_description" | "candidate_cv";
  created_at: string;
};

export type EvaluationCriterion = {
  name: string;
  score: number;
  weight: number;
  evidence: string;
};

export type CandidateEvaluation = {
  id: string;
  company_id: string;
  candidate_id: string;
  job_id: string;
  overall_score: number;
  recommendation: Recommendation;
  summary: string;
  strengths_json: string[];
  risks_json: string[];
  criteria_json: EvaluationCriterion[];
  interview_questions_json: string[];
  raw_llm_json: Json;
  confidence_score: number;
  created_at: string;
};

export type CandidateRankingRow = Candidate & {
  candidate_evaluations: CandidateEvaluation[] | CandidateEvaluation | null;
  candidate_files?: CandidateFile[];
};

export type AvailabilityRange = { start: string; end: string };
export type AvailabilityRules = {
  timezone: string;
  days: Record<string, AvailabilityRange[]>;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  minimum_notice_hours: number;
  max_days_ahead: number;
};

export type CalendarConnection = {
  id: string;
  company_id: string;
  user_id: string;
  google_email: string;
  google_calendar_id: string;
  encrypted_refresh_token: string | null;
  availability_rules_json: AvailabilityRules;
  created_at: string;
  updated_at: string;
};

export type InterviewRequest = {
  id: string;
  company_id: string;
  candidate_id: string;
  job_id: string;
  requested_by_user_id: string;
  interviewer_user_id: string;
  duration_minutes: number;
  interview_type: string;
  message: string | null;
  booking_token_hash: string;
  status: InterviewStatus;
  expires_at: string;
  email_sent_at: string | null;
  booking_opened_at: string | null;
  scheduled_at: string | null;
  calendar_event_id: string | null;
  google_meet_url: string | null;
  created_at: string;
  updated_at: string;
};
