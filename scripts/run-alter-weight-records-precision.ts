import { executeQuery } from "../lib/db-adapter";
import fs from "fs";

async function run() {
  try {
    const sql = fs.readFileSync(
      "./scripts/alter-weight-records-precision.sql",
      "utf8"
    );
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      console.log("Executing:", statement);
      await executeQuery({ query: statement });
    }

    console.log("✅ Altered weight_records precision to DECIMAL(10,3)");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

run();
