import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  getOpenAIClient,
  getOpenAIModel,
  normalizeLanguage,
  SKARBNIK_SYSTEM_PROMPT,
} from "@/lib/server/openaiClient";
import { assertRateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

/**
 * Feature flag — set AI_ENABLED=true in .env.local to resume Grok/OpenAI
 * calls. Off by default to save API credits while the backend is being
 * iterated.
 */
const AI_ENABLED = process.env.AI_ENABLED === "true";

type ExplainBody = {
  question?: string;
  userAnswer?: string;
  correctAnswer?: string;
  language?: string;
};

function staticExplanation(
  language: "pl" | "en",
  correctAnswer: string,
  wasCorrect: boolean
): string {
  if (language === "pl") {
    return wasCorrect
      ? `Świetnie! Poprawna odpowiedź to: ${correctAnswer}.`
      : `Nie tym razem. Poprawna odpowiedź to: ${correctAnswer}.`;
  }
  return wasCorrect
    ? `Nice — the correct answer is: ${correctAnswer}.`
    : `Not quite. The correct answer is: ${correctAnswer}.`;
}

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "ai-explain",
      maxRequests: 30,
      windowMs: 60 * 1000,
    });

    const body = (await request.json()) as ExplainBody;

    const question = body.question?.trim();
    const userAnswer = body.userAnswer?.trim();
    const correctAnswer = body.correctAnswer?.trim();

    if (!question || !userAnswer || !correctAnswer) {
      throw new ApiError(
        400,
        "question, userAnswer, and correctAnswer are all required."
      );
    }

    const language = normalizeLanguage(body.language);
    const wasCorrect =
      userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    // --- AI disabled path (default) ------------------------------------
    if (!AI_ENABLED) {
      return NextResponse.json({
        explanation: staticExplanation(language, correctAnswer, wasCorrect),
      });
    }

    // --- AI enabled path ----------------------------------------------
    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: getOpenAIModel(),
      instructions:
        `${SKARBNIK_SYSTEM_PROMPT} ` +
        `Explain quiz answers in 2-3 concise sentences and keep the explanation practical. ` +
        `Reply in ${language === "pl" ? "Polish" : "English"}.`,
      input: `Question: ${question}\nUser answer: ${userAnswer}\nCorrect answer: ${correctAnswer}\nExplain why the correct answer is better and where the user answer goes wrong.`,
      max_output_tokens: 220,
    });

    const output = response.output_text?.trim();

    if (!output) {
      // Fall back to the static response rather than 502 — keeps UX clean.
      return NextResponse.json({
        explanation: staticExplanation(language, correctAnswer, wasCorrect),
      });
    }

    return NextResponse.json({ explanation: output });
  } catch (error) {
    const apiError = toApiError(error, "AI explain request failed.");
    if (apiError.status >= 500) {
      logServerError("api/ai/explain", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "AI explain request failed.",
      },
      { status: apiError.status }
    );
  }
}
