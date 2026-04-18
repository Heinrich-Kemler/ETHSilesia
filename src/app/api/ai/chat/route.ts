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

    // 1. Zidentyfikuj i wczytaj wewnętrzne ID usera na podstawie privy_id
    let internalUserId: string | null = null;
    let userLevel = 1;
    let userStrongTopics = "brak";
    let userWeakTopics = "brak";

    if (authenticatedPrivyId) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id, level")
        .eq("privy_id", authenticatedPrivyId)
        .single();

      if (userRecord) {
        internalUserId = userRecord.id;
        userLevel = userRecord.level || 1;
        userStrongTopics =
          Array.isArray(userRecord.strong_topics) &&
          userRecord.strong_topics.length > 0
            ? userRecord.strong_topics.join(", ")
            : "brak";
        userWeakTopics =
          Array.isArray(userRecord.weak_topics) &&
          userRecord.weak_topics.length > 0
            ? userRecord.weak_topics.join(", ")
            : "brak";
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

    // 3. RAG - Połącz się z Gemini aby sczytać wektory wiedzy usera
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

    // 4a. Pobierz aktywne alerty bezpieczeństwa
    const { data: activeAlerts } = await supabase
      .from("scam_alerts")
      .select("title_pl, summary_pl, severity, threat_type")
      .eq("active", true)
      .order("detected_at", { ascending: false })
      .limit(5);

    const alertsContext = (activeAlerts || [])
      .map(
        (a: {
          title_pl: string;
          summary_pl: string;
          severity: string;
          threat_type: string;
        }) => `- [${a.severity.toUpperCase()}] ${a.title_pl}: ${a.summary_pl}`,
      )
      .join("\n");

    // 4b. Stworzenie System Promptu
    const systemInstruction = `Jesteś Skarbnikiem — mądrym i wyedukowanym przewodnikiem, który pomaga ludziom bezpiecznie poruszać się w świecie DeFi i Web3. Zostałeś nazwany na cześć legendarnego śląskiego ducha kopalni, który strzeże skarbów.

Profil użytkownika:
- Poziom: ${userLevel} (1=totalny nowicjusz, 2=ciekawski, 3=doświadczony)
- Język: polski
- Słabe tematy: ${userWeakTopics}
- Silne tematy: ${userStrongTopics}

Powiązana wiedza z naszej bazy danych:
${context}

Aktywne zagrożenia bezpieczeństwa w tym tygodniu:
${alertsContext || "Brak nowych zagrożeń."}

Jeśli użytkownik pyta o temat powiązany z powyższymi zagrożeniami, odnieś się do nich konkretnie i wyraźnie pokaż ostrzeżenie bezpieczeństwa.

Zasady:
- Zawsze odpowiadaj w języku polskim.
- Poziom 1: używaj prostego języka i codziennych metafor (zero slangu).
- Poziom 2: możesz używać terminów DeFi, ale najpierw krótko wyjaśnij każdy z nich.
- Poziom 3: możesz swobodnie używać technicznego języka.
- Jeśli użytkownik wspomni o "seed phrase" (frazie odzyskiwania) lub "private key" (kluczu prywatnym): ZAWSZE ostrzegaj, aby nigdy nie dzielił się nimi z nikim.
- Nigdy nie dawaj i nie sugeruj porad inwestycyjnych.
- Ogranicz odpowiedzi do 150 słów, chyba że użytkownik prosi o więcej szczegółów.
- Zakończ każdą wypowiedź jednym pytaniem uzupełniającym (follow-up question), aby zachęcić do dalszej nauki.
- Bądź ciepły, przyjazny i zachęcający, nigdy protekcjonalny (nie wymądrzaj się).`;

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
