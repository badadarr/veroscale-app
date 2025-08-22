import { supabase } from "../lib/supabase";

async function addExpectedWeightColumn() {
  try {
    // Check if expected_weight column exists
    const { data: columns, error: columnsError } = await supabase
      .from("samples_item")
      .select("*")
      .limit(1);

    if (columnsError) {
      console.error("Error checking table structure:", columnsError);
      return;
    }

    // If the first result exists, check if expected_weight is in the columns
    if (columns && columns.length > 0) {
      const hasExpectedWeight = "expected_weight" in columns[0];

      if (hasExpectedWeight) {
        console.log("✅ expected_weight column already exists");
        return;
      }
    }

    console.log("Adding expected_weight column manually...");

    // For now, let's try to add some samples with expected_weight data
    // We'll use the existing sample_weight as the expected_weight
    const { data: samples, error: samplesError } = await supabase
      .from("samples_item")
      .select("*");

    if (samplesError) {
      console.error("Error fetching samples:", samplesError);
      return;
    }

    console.log("Found", samples?.length || 0, "samples");
    console.log("Please run this SQL directly in your Supabase dashboard:");
    console.log(
      "ALTER TABLE public.samples_item ADD COLUMN IF NOT EXISTS expected_weight DECIMAL(10, 3);"
    );
    console.log(
      "UPDATE public.samples_item SET expected_weight = sample_weight WHERE expected_weight IS NULL;"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addExpectedWeightColumn();
