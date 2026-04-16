import { NextResponse } from "next/server";
import {
  getOpenAIClient,
  getOpenAIModel,
  normalizeLanguage,
  SKARBNIK_SYSTEM_PROMPT,
} from "@/lib/server/openaiClient";

export const runtime = "nodejs";

type ExplainBody = {
  question?: string;
  userAnswer?: string;
  correctAnswer?: string;
  language?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExplainBody;

    const question = body.question?.trim();
    const userAnswer = body.userAnswer?.trim();
    const correctAnswer = body.correctAnswer?.trim();

    if (!question || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        {
          error:
            "question, userAnswer, and correctAnswer are all required.",
        },
        { status: 400 }
      );
    }

    const language = normalizeLanguage(body.language);
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
      return NextResponse.json(
        { error: "AI did not return an explanation." },
        { status: 502 }
      );
    }

    return NextResponse.json({ explanation: output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "AI explain request failed.", details: message },
      { status: 500 }
    );
  }
}
