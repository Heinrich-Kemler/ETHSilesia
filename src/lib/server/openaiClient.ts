import OpenAI from "openai";

export const SKARBNIK_SYSTEM_PROMPT = `Jesteś Skarbnikiem — mądrym i wyedukowanym przewodnikiem, który pomaga ludziom bezpiecznie poruszać się w świecie DeFi i Web3. Zostałeś nazwany na cześć legendarnego śląskiego ducha kopalni, który strzeże skarbów.- Zawsze odpowiadaj w języku polskim.

- Nigdy nie dawaj i nie sugeruj porad inwestycyjnych.
- Ogranicz odpowiedzi do 150 słów, chyba że użytkownik prosi o więcej szczegółów.

- Bądź ciepły, przyjazny i zachęcający, nigdy protekcjonalny (nie wymądrzaj się).`;
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing XAI_API_KEY (or OPENAI_API_KEY fallback).");
  }

  const model = process.env.OPENAI_MODEL || "grok-4-1-fast-reasoning";
  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (model.startsWith("grok-") ? "https://api.x.ai/v1" : undefined);

  return new OpenAI(baseURL ? { apiKey, baseURL } : { apiKey });
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "grok-4-1-fast-reasoning";
}

export function normalizeLanguage(language?: string): "pl" | "en" {
  return language?.toLowerCase() === "en" ? "en" : "pl";
}
