export function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? (name === "OPENAI_API_KEY" ? process.env.OpenAI_API_KEY : undefined);
  return value || fallback || "";
}

export function requireEnv(name: string, fallback?: string) {
  const value = getEnv(name, fallback);
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

export function getAppUrl() {
  return getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").replace(/\/$/, "");
}

export function getOpenAIModel() {
  return getEnv("OPENAI_MODEL", "gpt-5.4-mini");
}
