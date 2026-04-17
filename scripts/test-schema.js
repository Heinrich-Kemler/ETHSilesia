const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching 1 row to see actual columns in the database...");
  const { data, error } = await supabase.from('knowledge_base').select('*').limit(1);
  if (error) {
    console.error("Select Error:", error);
  } else {
    if (data && data.length > 0) {
      console.log("ACTUAL COLUMNS IN YOUR SUPABASE TABLE:");
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table is empty. Wait, I can try to fetch through a direct REST call if needed.");
    }
  }
}

test();
