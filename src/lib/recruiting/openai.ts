import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getEnv, getOpenAIModel, requireEnv } from "@/lib/env";

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  }
  return openai;
}

export const candidateEvaluationSchema = z.object({
  candidate_name: z.string(),
  candidate_email: z.string().nullable(),
  candidate_phone: z.string().nullable(),
  overall_score: z.number().min(0).max(100),
  recommendation: z.enum(["advance", "review", "reject"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  criteria: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      weight: z.number().min(0).max(100),
      evidence: z.string(),
    }),
  ),
  interview_questions: z.array(z.string()),
  confidence_score: z.number().min(0).max(100),
});

export type CandidateEvaluationLLM = z.infer<typeof candidateEvaluationSchema>;

export async function evaluateCandidateWithOpenAI(input: {
  jobTitle: string;
  jobDescription: string;
  cvText: string;
}) {
  const client = getOpenAIClient();
  const response = await client.responses.parse({
    model: getOpenAIModel(),
    instructions:
      "Eres un analista de reclutamiento. No decides contratación; solo priorizas CVs contra un Job Description. Usa evidencia concreta del CV. Si falta información, márcala como brecha y no inventes.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Cargo: ${input.jobTitle}\n\nJob Description:\n${input.jobDescription}\n\nCV:\n${input.cvText}\n\nEvalúa con criterios: experiencia relevante, fit con responsabilidades, requisitos obligatorios, deseables, seniority, claridad de trayectoria, riesgos/brechas y señales destacadas.`,
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(candidateEvaluationSchema, "candidate_evaluation"),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    const raw = getEnv("NODE_ENV") === "development" ? response.output_text : "";
    throw new Error(`JSON inválido del LLM. ${raw}`);
  }

  return parsed;
}
