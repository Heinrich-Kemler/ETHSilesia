const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Embeddings cały czas robimy przy użyciu Gemini (baza wektorowa jest dostosowana do 3072 z Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({
  model: "models/gemini-embedding-001",
});

async function askSkarbnik(userQuery, userId, sessionId, userLevel = 1) {
  try {
    // 1. POBIERZ HISTORIĘ Z SUPABASE
    // Jeśli nie masz jeszcze tabeli chat_history w bazie, zignoruj błąd lub stwórz ją.
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(6);

    const messages = [];

    // 2. RAG - Szukanie wiedzy przy użyciu wektorów z Gemini
    const embedRes = await embedModel.embedContent({
      content: { parts: [{ text: userQuery }] },
      taskType: "RETRIEVAL_QUERY",
    });

    // Używamy funkcji "match_documents", bo tak nazwaliśmy ją z wcześniejszego SQL'a
    const { data: documents, error: rpcError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embedRes.embedding.values,
        match_threshold: 0.1, // Możesz dopasować (0.0 do 1.0)
        match_count: 2,
      },
    );

    if (rpcError) {
      console.error("RAG Error:", rpcError.message);
    }

    // Dopasowanie do zwrotek z naszej bazy wiedzy (kolumny z nowego SQL'a)
    const context = (documents || [])
      .map((doc) => `Pytanie: ${doc.question_pl}\nOdpowiedź: ${doc.answer_pl}`)
      .join("\n\n");

    // 3. SYSTEM PROMPT (kontekst idzie do system message)
    // UWAGA: Grok nie pozwala przesyłać pola role: "system" w środku, musi być najpierw.
    const systemInstruction = `Jesteś Skarbnikiem, wirtualnym opiekunem użytkownika na platformie. 
Poziom zaawansowania usera: ${userLevel}. 
Poniżej znajduje się wstrzyknięta wiedza specjalistyczna (z bazy wektorowej):
---
${context}
---
Odpowiadaj krótko i konkretnie w języku zadanym przez użytkownika. Bądź pomocny i używaj podanej wiedzy jeśli dotyczy tematu.`;

    messages.push({ role: "system", content: systemInstruction });

    // 4. MAPOWANIE HISTORII NA FORMAT OPENAI
    if (historyData && historyData.length > 0) {
      const history = historyData.reverse().map((h) => ({
        // xAI wymaga wartości: "assistant" (zamiast "model") lub "user"
        role: h.role === "model" ? "assistant" : "user",
        content: h.content,
      }));
      messages.push(...history);
    }

    // 5. DODANIE AKTUALNEGO PYTANIA
    messages.push({ role: "user", content: userQuery });
    console.log(`\n🗣️ [User (lvl ${userLevel})]: ${userQuery}`);

    // 6. URUCHOMIENIE CHATU Z GROKIEM (Przez wbudowany fetch, by nie instalować dodatkowych bibliotek)
    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-reasoning",
        messages: messages,
        max_tokens: 500,
        temperature: 0.5,
      }),
    });

    const chatCompletion = await grokRes.json();

    if (chatCompletion.error) {
      console.error("Grok błąd:", chatCompletion.error);
      return;
    }

    const response = chatCompletion.choices[0].message.content;
    console.log(`🤖 [Grok - Skarbnik]: ${response}`);

    // 7. ZAPISZ NOWĄ WIADOMOŚĆ DO BAZY (ignorujemy błędy dla testu jeśli nie masz tabeli)
    await supabase.from("chat_history").insert([
      {
        user_id: userId,
        session_id: sessionId,
        role: "user",
        content: userQuery,
      },
      {
        user_id: userId,
        session_id: sessionId,
        role: "model", // zostawiamy zapis jako model dla spójności Supabase
        content: response,
      },
    ]);

    return response;
  } catch (err) {
    console.error("Błąd ogólny czatu:", err);
  }
}

async function runTests() {
  console.log(
    "Rozpoczynam testy chatu w połączeniu Gemini (RAG) + Grok (Rozmowa)...",
  );

  // Testowe identyfikatory (najlepiej trzymać się UUID, jeśli tak zdefiniowano w bazie)
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testSessionId = "session-test1";

  // By logi wyglądały schludniej, używamy await by wywołać linijka po linijce
  await askSkarbnik("Czym jest portfel?", testUserId, testSessionId, 1);
}

runTests();
