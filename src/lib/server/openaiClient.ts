import OpenAI from "openai";

export const SKARBNIK_SYSTEM_PROMPT =
  "You are Skarbnik, a wise and friendly guide from Polish/Silesian folklore who guards financial treasure. You help people understand DeFi and blockchain technology. You speak both Polish and English — respond in the same language the user writes in. You are encouraging, never condescending. You use simple analogies to explain complex concepts. You never give financial advice. You always emphasize the importance of DYOR (Do Your Own Research). Keep responses under 150 words.";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function normalizeLanguage(language?: string): "pl" | "en" {
  return language?.toLowerCase() === "en" ? "en" : "pl";
}
