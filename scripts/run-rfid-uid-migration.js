import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const sqlPath = path.join(__dirname, "add-rfid-uid-to-users.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("Running RFID UID migration...");

    // Ensure exec_sql exists; if not, it will fail and user can apply scripts/create-exec-sql-function.sql
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    if (error) {
      console.error("Migration error:", error);
      console.error(
        "Tip: ensure exec_sql function exists (scripts/create-exec-sql-function.sql)."
      );
      process.exit(1);
    }

    console.log("RFID UID migration applied successfully");
  } catch (err) {
    console.error("Failed to run migration:", err);
    process.exit(1);
  }
}

run();
