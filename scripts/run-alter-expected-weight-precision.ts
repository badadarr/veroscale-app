import { executeQuery } from "../lib/db-adapter";
import fs from "fs";

async function run() {
  try {
    const sql = fs.readFileSync(
      "./scripts/alter-expected-weight-precision.sql",
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

    console.log("✅ Altered expected_weight precision to DECIMAL(10,3)");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

run();
