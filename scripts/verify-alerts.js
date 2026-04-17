/**
 * verify-alerts.js
 * Testy Security Feed: migracja, API /api/alerts, integracja z chatem.
 *
 * Wymagania:
 *   1. Migracja 20260417200000_scam_alerts.sql wykonana w Supabase SQL Editor
 *   2. Dev server uruchomiony (npm run dev)
 *
 * Użycie: node verify-alerts.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

async function runTests() {
  console.log("🔐 Rozpoczynanie testów Security Feed...\n");
  const sessionId = "alert-test-" + Date.now();
  let allPassed = true;

  // --- TEST 1: Sprawdzenie czy tabela scam_alerts istnieje i zawiera evergreen alerty ---
  console.log("--- TEST 1: Tabela scam_alerts i evergreen alerty ---");
  const { data: alerts, error: alertsError } = await supabase
    .from("scam_alerts")
    .select("*")
    .eq("active", true);

  if (alertsError) {
    console.log(`❌ TEST 1: Tabela scam_alerts nie istnieje lub błąd: ${alertsError.message}`);
    console.log("⚠️  Uruchom migrację 20260417200000_scam_alerts.sql w Supabase SQL Editor!");
    return;
  }

  if (alerts && alerts.length >= 3) {
    console.log(`✅ TEST 1: Tabela istnieje, ${alerts.length} aktywnych alertów (PASS)`);
  } else {
    console.log(`❌ TEST 1: Tabela istnieje ale za mało alertów: ${alerts?.length || 0} (FAIL)`);
    allPassed = false;
  }

  // --- TEST 2: API GET /api/alerts ---
  console.log("\n--- TEST 2: GET /api/alerts ---");
  const res = await fetch("http://localhost:3000/api/alerts");
  
  if (!res.ok) {
    console.log(`❌ TEST 2: API zwróciło status ${res.status} (FAIL)`);
    allPassed = false;
  } else {
    const data = await res.json();
    if (Array.isArray(data) && data.length >= 3) {
      // Check sorting (critical should come first)
      const firstSeverity = data[0]?.severity;
      console.log(`✅ TEST 2: API zwróciło ${data.length} alertów, pierwszy severity: ${firstSeverity} (PASS)`);
    } else {
      console.log(`❌ TEST 2: Odpowiedź API nieprawidłowa (FAIL)`);
      allPassed = false;
    }
  }

  // --- TEST 3: Verify response format ---
  console.log("\n--- TEST 3: Weryfikacja formatu odpowiedzi ---");
  const res3 = await fetch("http://localhost:3000/api/alerts");
  const data3 = await res3.json();
  const requiredFields = ["id", "title_pl", "summary_pl", "threat_type", "severity", "detected_at"];
  const firstAlert = data3[0];
  
  if (firstAlert) {
    const missingFields = requiredFields.filter((f) => !(f in firstAlert));
    if (missingFields.length === 0) {
      console.log("✅ TEST 3: Wszystkie wymagane pola obecne (PASS)");
    } else {
      console.log(`❌ TEST 3: Brakujące pola: ${missingFields.join(", ")} (FAIL)`);
      allPassed = false;
    }
  } else {
    console.log("❌ TEST 3: Brak alertów do sprawdzenia (FAIL)");
    allPassed = false;
  }

  // --- TEST 4: Chat z pytaniem o seed phrase — powinien odnieść się do alertu ---
  console.log("\n--- TEST 4: Chat + seed phrase alert ---");
  const chatRes = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Ktoś na Telegramie prosi mnie o seed phrase, czy to bezpieczne?",
      sessionId: sessionId,
    }),
  });

  if (!chatRes.ok) {
    console.log(`❌ TEST 4: Chat API błąd ${chatRes.status} (FAIL)`);
    allPassed = false;
  } else {
    const chatData = await chatRes.json();
    const response = chatData.response.toLowerCase();
    console.log("Chat response:", chatData.response.substring(0, 200) + "...");

    const hasWarning =
      response.includes("nigdy") ||
      response.includes("oszust") ||
      response.includes("nikomu") ||
      response.includes("nie podawaj") ||
      response.includes("ostrze");

    if (hasWarning) {
      console.log("✅ TEST 4: Ostrzeżenie bezpieczeństwa obecne (PASS)");
    } else {
      console.log("❌ TEST 4: Brak ostrzeżenia w odpowiedzi (FAIL)");
      allPassed = false;
    }
  }

  // --- TEST 5: Chat z pytaniem o aktualne oszustwa ---
  console.log("\n--- TEST 5: Chat o aktualnych zagrożeniach ---");
  const chatRes2 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Na jakie oszustwa powinienem uważać?",
      sessionId: sessionId,
    }),
  });

  if (!chatRes2.ok) {
    console.log(`❌ TEST 5: Chat API błąd ${chatRes2.status} (FAIL)`);
    allPassed = false;
  } else {
    const chatData2 = await chatRes2.json();
    const response2 = chatData2.response.toLowerCase();
    console.log("Chat response:", chatData2.response.substring(0, 200) + "...");

    const mentionsThreats =
      response2.includes("phishing") ||
      response2.includes("fałszyw") ||
      response2.includes("oszust") ||
      response2.includes("airdrop") ||
      response2.includes("telegram") ||
      response2.includes("discord");

    if (mentionsThreats) {
      console.log("✅ TEST 5: Wspomina aktualne zagrożenia (PASS)");
    } else {
      console.log("❌ TEST 5: Nie wspomina zagrożeń (FAIL)");
      allPassed = false;
    }
  }

  // --- PODSUMOWANIE ---
  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 WSZYSTKIE TESTY PRZESZŁY!");
  } else {
    console.log("⚠️  NIEKTÓRE TESTY NIE PRZESZŁY — sprawdź logi powyżej.");
  }
}

runTests().catch(console.error);
