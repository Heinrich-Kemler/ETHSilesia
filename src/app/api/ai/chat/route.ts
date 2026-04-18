import { NextResponse } from "next/server";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

// Odblokuj długie przetwarzanie jeśli Grok będzie zamulał
export const maxDuration = 30;
export const runtime = "nodejs";

/**
 * Feature flag — set AI_ENABLED=true in .env.local to resume the full
 * Grok + Gemini RAG pipeline. Off by default so we don't burn API
 * credits while the backend/DB layer is being iterated on.
 */
const AI_ENABLED = true;

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
    const body = (await request.json()) as ChatBody;
    const userQuery = body.message?.trim();
    const sessionId = body.sessionId || "anonymous-session";
    const userLang = body.language === "en" ? "English" : "Polish";
    const language: "pl" | "en" = body.language === "en" ? "en" : "pl";

    console.log("[chat] [1] Request received", {
      userQuery,
      sessionId,
      language,
      userId: body.userId,
    });

    if (!userQuery) {
      console.warn("[chat] [1] No message — returning 400");
      return NextResponse.json(
        { error: "message is required." },
        { status: 400 },
      );
    }

    // --- AI disabled path (default) ------------------------------------
    // Keeps the frontend UX seamless without calling Grok/Gemini.
    if (!AI_ENABLED) {
      console.log("[chat] [1] AI_ENABLED=false — returning canned response");
      return NextResponse.json({ response: cannedChatResponse(language) });
    }
    console.log("[chat] [1] AI_ENABLED=true — entering full RAG pipeline");

    // --- AI enabled path: full RAG pipeline ----------------------------
    const supabase = getSupabaseAdminClient();

    // 1. Zidentyfikuj i wczytaj wewnętrzne ID usera na podstawie privy_id
    let internalUserId: string | null = null;
    let userLevel = 1;
    let username = "Młody Górniku";
    let userTotalXp = 0;
    let userStreak = 0;

    if (body.userId) {
      console.log("[chat] [2] Looking up user by privy_id:", body.userId);
      const { data: userRecord, error: userErr } = await supabase
        .from("users")
        .select("id, level, username, total_xp, streak_days")
        .eq("privy_id", body.userId)
        .single();

      if (userErr)
        console.warn("[chat] [2] User lookup error:", userErr.message);

      if (userRecord) {
        internalUserId = userRecord.id;
        userLevel = userRecord.level || 1;
        username = userRecord.username || "Młody Górniku";
        userTotalXp = userRecord.total_xp || 0;
        userStreak = userRecord.streak_days || 0;
        console.log("[chat] [2] User found:", { internalUserId, userLevel });
      } else {
        console.warn(
          "[chat] [2] User not found in DB — proceeding as anonymous",
        );
      }
    }

    // 2. Pobierz historię (limit do 6 ostatnich wiadomości dla niezapapychania okna kontekstu)
    console.log("[chat] [3] Fetching chat history for session:", sessionId);
    const { data: historyData, error: histErr } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(6);

    if (histErr)
      console.warn("[chat] [3] History fetch error:", histErr.message);
    console.log(
      "[chat] [3] History messages loaded:",
      historyData?.length ?? 0,
    );

    const messages = [];

    // 3. RAG - Połącz się z Gemini aby sczytać wektory wiedzy usera
    console.log("[chat] [4] Starting Gemini embedding...");
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
    console.log(
      "[chat] [4] Gemini embedding done, vector length:",
      embedRes.embedding.values.length,
    );

    console.log("[chat] [5] Running match_documents RPC...");
    const { data: documents, error: rpcError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embedRes.embedding.values,
        match_threshold: 0.15,
        match_count: 2,
      },
    );

    if (rpcError) {
      console.error("[chat] [5] RAG RPC error:", rpcError.message);
    }
    console.log("[chat] [5] RAG docs retrieved:", documents?.length ?? 0);

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

    // 4b. Stworzenie System Promptu
    const systemInstruction = `Jesteś Skarbnikiem — mądrym i wyedukowanym przewodnikiem, który pomaga ludziom bezpiecznie poruszać się w świecie DeFi i Web3. Zostałeś nazwany na cześć legendarnego śląskiego ducha kopalni, który strzeże skarbów.

Oto kogo dzisiaj chronisz (profil Górnika):
- Imię/Pseudonim: ${username} (zwracaj się do niego po imieniu w cieplejszych momentach)
- Poziom górnika: ${userLevel} (1=totalny nowicjusz na przodku, 2=ciekawski czeladnik, 3=doświadczony sztygar)
- Punkty Doświadczenia (XP): ${userTotalXp} XP (możesz go pochwalić za pracowitość jeśli pyta o wiedzę)
- Dni na Szychcie (Streak): ${userStreak} Dni logowań (doceniaj systematyczność)
- Język: polski

Powiązana wiedza z naszej bazy danych:
${context}

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
    console.log(
      "[chat] [6] Calling Grok API, messages count:",
      messages.length,
    );
    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) throw new Error("Missing XAI_API_KEY");

    const grokPayload = {
      model: "grok-4-1-fast-non-reasoning",
      messages: messages,
      max_tokens: 300,
      temperature: 0.5,
    };
    console.log("[chat] [6] Grok payload model:", grokPayload.model);

    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify(grokPayload),
    });

    console.log("[chat] [6] Grok HTTP status:", grokRes.status);

    if (!grokRes.ok) {
      const errorText = await grokRes.text();
      console.error("[chat] [6] Grok error body:", errorText);
      throw new Error(
        `Grok API returned status ${grokRes.status}: ${errorText}`,
      );
    }

    const chatCompletion = await grokRes.json();
    console.log(
      "[chat] [6] Grok raw response:",
      JSON.stringify(chatCompletion).slice(0, 400),
    );
    const responseText = chatCompletion.choices?.[0]?.message?.content;

    if (!responseText) {
      console.warn(
        "[chat] [6] responseText is empty — falling back to canned response",
      );
      console.warn(
        "[chat] [6] Full Grok completion object:",
        JSON.stringify(chatCompletion),
      );
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
    console.log("[chat] [7] Returning response, length:", responseText.length);
    return NextResponse.json({ response: responseText });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat route error:", message);
    return NextResponse.json(
      { error: "AI chat request failed.", details: message },
      { status: 500 },
    );
  }
}
