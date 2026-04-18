#!/usr/bin/env node
/**
 * test_scam_data.js
 * 
 * Ten skrypt łączy się z bazą danych Supabase (tabela: scam_alerts) 
 * i w czytelny sposób wyświetla podział pobranych alertów na 
 * kategorie Web2 (np. bankowość tradycyjna, PKO BP) oraz Web3 (np. DeFi, krypto).
 * 
 * Uruchomienie:
 * node scripts/test_scam_data.js
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log("🔍 Pobieranie alertów z bazy danych...");

  // Pobierz wszystkie aktywne alerty
  const { data, error } = await supabase
    .from("scam_alerts")
    .select("title_pl, threat_type, severity, category, source_name, chains")
    .eq("active", true)
    .order("detected_at", { ascending: false });

  if (error) {
    console.error("❌ Błąd bazy danych:", error.message);
    process.exit(1);
  }

  // Grupowanie danych
  const web2Alerts = data.filter((a) => a.category === "web2");
  const web3Alerts = data.filter((a) => a.category === "web3");

  console.log("\n=======================================================");
  console.log(`🌍 WEB2: BANKOWOŚĆ I ZAGROŻENIA TRADYCYJNE (${web2Alerts.length})`);
  console.log("=======================================================");
  web2Alerts.forEach((alert, i) => {
    console.log(`${i + 1}. [${alert.severity.toUpperCase()}] ${alert.title_pl}`);
    console.log(`   - Typ: ${alert.threat_type}`);
    console.log(`   - Źródło: ${alert.source_name || "Brak"}`);
    console.log(`   - Domyślne sieci/banki: ${alert.chains?.join(", ") || "-"}`);
    console.log("");
  });

  console.log("=======================================================");
  console.log(`🔗 WEB3: DEFI, KRYPTOWALUTY I BLOCKCHAIN (${web3Alerts.length})`);
  console.log("=======================================================");
  web3Alerts.forEach((alert, i) => {
    console.log(`${i + 1}. [${alert.severity.toUpperCase()}] ${alert.title_pl}`);
    console.log(`   - Typ: ${alert.threat_type}`);
    console.log(`   - Źródło: ${alert.source_name || "Brak"}`);
    console.log(`   - Domyślne sieci/banki: ${alert.chains?.join(", ") || "-"}`);
    console.log("");
  });
}

main().catch(console.error);
