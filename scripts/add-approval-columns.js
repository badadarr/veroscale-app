import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addApprovalColumns() {
  try {
    console.log("Adding approval columns to weight_records table...");

    // Add the columns if they don't exist
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
          -- Add approved_by column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'weight_records' 
            AND column_name = 'approved_by'
          ) THEN
            ALTER TABLE public.weight_records ADD COLUMN approved_by INTEGER NULL;
          END IF;
          
          -- Add approved_at column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'weight_records' 
            AND column_name = 'approved_at'
          ) THEN
            ALTER TABLE public.weight_records ADD COLUMN approved_at TIMESTAMP NULL;
          END IF;
          
          -- Add foreign key constraint if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_weight_records_approved_by'
          ) THEN
            ALTER TABLE public.weight_records 
            ADD CONSTRAINT fk_weight_records_approved_by 
            FOREIGN KEY (approved_by) REFERENCES public.users(id);
          END IF;
        END
        $$;
      `,
    });

    if (error) {
      console.error("Error adding approval columns:", error);
      return false;
    }

    console.log("Successfully added approval columns to weight_records table");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Run the migration
addApprovalColumns()
  .then((success) => {
    if (success) {
      console.log("Migration completed successfully");
    } else {
      console.log("Migration failed");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });
