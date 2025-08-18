import { executeQuery } from "../lib/db-adapter";
import fs from "fs";

async function addExpectedWeightColumn() {
  try {
    const sql = fs.readFileSync(
      "./scripts/add-expected-weight-column.sql",
      "utf8"
    );
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.trim());
        await executeQuery({ query: statement.trim() });
      }
    }

    console.log("✅ Expected weight column added successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addExpectedWeightColumn();
