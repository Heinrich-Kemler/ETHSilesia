import { NextResponse } from "next/server";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

// Odblokuj długie przetwarzanie jeśli Grok będzie zamulał
export const maxDuration = 30;
export const runtime = "nodejs";

/**
 * Feature flag — set AI_ENABLED=true in .env.local to resume the full
 * Grok + Gemini RAG pipeline. Off by default so we don't burn API
 * credits while the backend/DB layer is being iterated on.
 */
const AI_ENABLED = process.env.AI_ENABLED === "true";

type ChatBody = {
  message?: string;
  language?: string;
  userId?: string; // Tu frontend prześle użytkownika np. poświadczenia Privy
  sessionId?: string; // Losowo generowany identyfikator sesji z przeglądarki
};

function cannedChatResponse(language: "pl" | "en"): string {
  if (language === "pl") {
    return "Skarbnik odpoczywa — ulepszamy moją bazę wiedzy. Wróć wkrótce! Tymczasem — ruszaj na questy i ucz się praktycznie. Pamiętaj: DYOR (Do Your Own Research) i nigdy nie inwestuj więcej niż możesz stracić.";
  }
  return "Skarbnik is resting — my knowledge base is being upgraded. Come back soon! In the meantime — jump into the quests and learn by doing. Remember: DYOR (Do Your Own Research) and never invest more than you can afford to lose.";
}

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "ai-chat",
      maxRequests: 20,
      windowMs: 60 * 1000,
    });

    const body = (await request.json()) as ChatBody;
    const userQuery = body.message?.trim();
    const rawSessionId = body.sessionId?.trim();
    const validatedSessionId =
      rawSessionId && /^[A-Za-z0-9:_-]{1,120}$/.test(rawSessionId)
        ? rawSessionId
        : null;
    const userLang = body.language === "en" ? "English" : "Polish";
    const language: "pl" | "en" = body.language === "en" ? "en" : "pl";

    if (!userQuery) {
      throw new ApiError(400, "message is required.");
    }

    let authenticatedPrivyId: string | null = null;
    if (body.userId) {
      const auth = await requirePrivyAuth(request);
      assertPrivyOwnership(auth, body.userId);
      authenticatedPrivyId = auth.privyId;
    }

    const sessionId =
      authenticatedPrivyId && validatedSessionId
        ? validatedSessionId
        : "anonymous-session";

    // --- AI disabled path (default) ------------------------------------
    // Keeps the frontend UX seamless without calling Grok/Gemini.
    if (!AI_ENABLED) {
      return NextResponse.json({ response: cannedChatResponse(language) });
    }

    // --- AI enabled path: full RAG pipeline ----------------------------
    const supabase = getSupabaseAdminClient();

    // 1. Zidentyfikuj i wczytaj wewnętrzne ID usera na podstawie privy_id (jeśli został podany)
    let internalUserId: string | null = null;
    let userLevel = 1;

    if (authenticatedPrivyId) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id, level")
        .eq("privy_id", authenticatedPrivyId)
        .single();

      if (userRecord) {
        internalUserId = userRecord.id;
        userLevel = userRecord.level || 1;
      }
    }

    // 2. Pobierz historię (limit do 6 ostatnich wiadomości dla niezapapychania okna kontekstu)
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(6);

    const messages = [];

    // 3. RAG - Połącz się z Gemini aby sczytać wektory wiedzy usera (3072 z gemini-embedding-001)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const embedModel = genAI.getGenerativeModel({
      model: "models/gemini-embedding-001",
    });

    const embedRes = await embedModel.embedContent({
      content: { role: "user", parts: [{ text: userQuery }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    const { data: documents, error: rpcError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embedRes.embedding.values,
        match_threshold: 0.15,
        match_count: 2,
      },
    );

    if (rpcError) {
      console.error("RAG Error:", rpcError.message);
    }

    // Przepisanie kontekstu
    const context = (documents || [])
      .map(
        (doc: {
          question_en: string;
          answer_en: string;
          question_pl: string;
          answer_pl: string;
        }) => {
          if (userLang === "English") {
            return `[Context Question]: ${doc.question_en}\n[Context Answer]: ${doc.answer_en}`;
          }
          return `[Pytanie z bazy wiedzy]: ${doc.question_pl}\n[Odpowiedź z bazy wiedzy]: ${doc.answer_pl}`;
        },
      )
      .join("\n\n");

    // 4. Stworzenie System Promptu
    const systemInstruction = `Jesteś Skarbnikiem, wirtualnym opiekunem użytkownika na platformie ETH Silesia.
Dostosowujesz się do poziomu edukacji usera (jego poziom to: ${userLevel}). Twoi rozmówcy to początkujący, zwykli ludzie bez pojęcia o krypto (często totalni laicy).

Zasady, bezwzględnie:
1. Rozmawiaj ze "zwykłym człowiekiem z ulicy" - używaj bardzo prostych metafor z życia codziennego (np. sejf, cyfrowa gotówka).
2. Pamiętaj, absolutnie zero krypto slangu (żadnych skrótów typu DYOR, HODL, wagmi, DeFi, FUD itp.). Tłumacz wszystko po ludzku.
3. Nigdy nie polecaj ani nie wymieniaj giełdy Zonda/ZondaCrypto w swoich odpowiedziach.
4. Zawsze i bezwzględnie odpowiadaj JEDYNIE w języku polskim, niezależnie od tego, w jakim języku użytkownik ządał pytanie.

Poniżej znajduje się wstrzyknięta wiedza specjalistyczna:
---
${context}
---
Odpowiadaj konkretnie, krótko i po ludzku. Nigdy nie dawaj i nie sugeruj porad inwestycyjnych.`;

    messages.push({ role: "system", content: systemInstruction });

    // 5. Dopasowanie odwróconej chronologicznie historii z bazy pod Groka
    if (historyData && historyData.length > 0) {
      const history = historyData.reverse().map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.content,
      }));
      messages.push(...history);
    }

    messages.push({ role: "user", content: userQuery });

    // 6. Odpytanie Groka przez Fetch REST API
    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) throw new Error("Missing XAI_API_KEY");

    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning", // Taki model miałeś ustawiony w tescie
        messages: messages,
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!grokRes.ok) {
      const errorText = await grokRes.text();
      console.error("Grok Error Response:", errorText);
      throw new Error(`Grok API returned status ${grokRes.status}`);
    }

    const chatCompletion = await grokRes.json();
    const responseText = chatCompletion.choices?.[0]?.message?.content;

    if (!responseText) {
      // Fall back to canned — keeps UX seamless.
      return NextResponse.json({ response: cannedChatResponse(language) });
    }

    // 7. Zapisanie historii na spokojnie w tle, używamy waitUntil lub po prostu await
    if (internalUserId || sessionId !== "anonymous-session") {
      await supabase.from("chat_history").insert([
        {
          user_id: internalUserId, // null akceptowane jeśli anonimowy pod warunkiem ze schemat zezwala, lub jesli zrobiles w migracji
          session_id: sessionId,
          role: "user",
          content: userQuery,
        },
        {
          user_id: internalUserId,
          session_id: sessionId,
          role: "model",
          content: responseText,
        },
      ]);
    }

    // Odpowiedź dla ChatWidget.tsx
    return NextResponse.json({ response: responseText });
  } catch (error) {
    const apiError = toApiError(error, "AI chat request failed.");
    if (apiError.status >= 500) {
      logServerError("api/ai/chat", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "AI chat request failed.",
      },
      { status: apiError.status },
    );
  }
}
