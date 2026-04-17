const fs = require("fs");
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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({
  model: "models/gemini-embedding-001",
});

async function ingest() {
  const content = fs.readFileSync("../knowledge-base/skarbnik-kb.json", "utf8");
  const items = JSON.parse(content);

  for (const item of items) {
    try {
      // Przygotowanie tekstu do wektoryzacji (Pytanie + Odpowiedź)
      const textToEmbed = `Pytanie: ${item.question_pl}\nOdpowiedź: ${item.answer_pl}`;

      // Generowanie wektora przez Gemini
      const result = await embedModel.embedContent(textToEmbed);
      const embedding = result.embedding.values;

      const { error } = await supabase
        .from("knowledge_base")
        .upsert({ ...item, embedding });

      if (error) throw error;
      console.log(`✅ Ingested: ${item.id}`);
    } catch (err) {
      console.error(`❌ Error with ${item.id}:`, err.message);
    }
  }
}
ingest();
