import { NextResponse } from "next/server";
import {
  getOpenAIClient,
  getOpenAIModel,
  normalizeLanguage,
  SKARBNIK_SYSTEM_PROMPT,
} from "@/lib/server/openaiClient";

export const runtime = "nodejs";

type ChatBody = {
  message?: string;
  language?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "message is required." },
        { status: 400 }
      );
    }

    const language = normalizeLanguage(body.language);
    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: getOpenAIModel(),
      instructions: `${SKARBNIK_SYSTEM_PROMPT} Reply in ${
        language === "pl" ? "Polish" : "English"
      } unless the user asks to switch language.`,
      input: message,
      max_output_tokens: 220,
    });

    const output = response.output_text?.trim();

    if (!output) {
      return NextResponse.json(
        { error: "AI did not return a response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "AI chat request failed.", details: message },
      { status: 500 }
    );
  }
}
