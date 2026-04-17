require("dotenv").config({ path: "../.env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function runTests() {
  console.log("Rozpoczynanie testów API...");
  const sessionId = "test-session-" + Date.now();
  
  // We need a privy_id that belongs to a Level 1 user or just use a mock user,
  // If we don't send userId, it falls back to Level 1 anonymous.
  const payload1 = {
    message: "Czym jest portfel?",
    sessionId: sessionId,
  };

  let pass = true;

  console.log("\n--- TEST 1: Pytanie Czym jest portfel? (Lvl 1) ---");
  const res1 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1)
  });

  if (!res1.ok) {
    console.error("❌ API Call 1 Failed", await res1.text());
    return;
  }
  const data1 = await res1.json();
  const response1 = data1.response;
  console.log("Response:\n", response1);

  // Test 2: Verify it's in Polish - simple heuristic checking for Polish characters or common words
  if (response1.includes("jest") || response1.includes("to") || response1.includes("ł") || response1.includes("ś")) {
    console.log("✅ TEST 2: Po polsku (PASS)");
  } else {
    console.log("❌ TEST 2: Po polsku (FAIL)");
  }

  // Test 3: Verify knowledge from DB was used (Mentioning digital cash, safe, or related concepts from knowledgebase)
  if (response1.toLowerCase().includes("sejf") || response1.toLowerCase().includes("portfel") || response1.toLowerCase().includes("cyfrow")) {
    console.log("✅ TEST 3: Użyto wiedzy i metafor z promptu (PASS)");
  } else {
    console.log("❌ TEST 3: Użyto wiedzy i metafor z promptu (FAIL - no keywords found)");
  }

  // Test 4: Verify chat_history was saved
  const { data: history } = await supabase
    .from("chat_history")
    .select("*")
    .eq("session_id", sessionId);

  if (history && history.length >= 2) {
    console.log("✅ TEST 4: Zapisano chat_history w bazie (PASS)");
  } else {
    console.log("❌ TEST 4: Zapisano chat_history w bazie (FAIL)");
  }

  // Test 5: Follow up question verifying memory
  console.log("\n--- TEST 5: Pamięć z sesji ---");
  const payload2 = {
    message: "O czym przed chwilą rozmawialiśmy?",
    sessionId: sessionId,
  };

  const res2 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload2)
  });
  
  const data2 = await res2.json();
  const response2 = data2.response;
  console.log("Response:\n", response2);

  if (response2.toLowerCase().includes("portfel")) {
    console.log("✅ TEST 5: Pamięć działa (PASS)");
  } else {
    console.log("❌ TEST 5: Pamięć działa (FAIL)");
  }

  // Test 6: Seed phrase warning
  console.log("\n--- TEST 6: Ostrzeżenie Seed Phrase ---");
  const payload3 = {
    message: "A co to jest seed phrase?",
    sessionId: sessionId,
  };

  const res3 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload3)
  });
  
  const data3 = await res3.json();
  const response3 = data3.response;
  console.log("Response:\n", response3);

  if (response3.toLowerCase().includes("nigdy") && response3.toLowerCase().includes("nie podawaj") || response3.toLowerCase().includes("ostrz") || response3.toLowerCase().includes("dziel") || response3.toLowerCase().includes("nikomu")) {
    console.log("✅ TEST 6: Ostrzeżenie Seed Phrase na miejscu (PASS)");
  } else {
    console.log("❌ TEST 6: Brak ostrzeżenia o Seed Phrase (FAIL)");
  }
}

runTests();
