import { supabaseAdmin } from "./supabase.js";

// Helper functions for interacting with Supabase

// Generic query function
export async function query<T = any>({
  table,
  select = "*",
  filters = {},
  single = false,
}: {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  single?: boolean;
}): Promise<T> {
  try {
    // Just use the table name directly without adding schema prefix
    // This helps Supabase correctly establish relationships between tables
    const tableName = table.includes(".")
      ? table.split(".")[1] // Extract just the table name if schema is provided
      : table;

    let query = supabaseAdmin.from(tableName).select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }); // Execute query
    const { data, error } = single ? await query.single() : await query;

    if (error) throw error;

    // Check if this is aggregate result (common for count, sum, etc.)
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      select !== "*"
    ) {
      // For aggregate functions, wrap the result in an array to match MySQL behavior
      if (
        select.toLowerCase().includes("count(") ||
        select.toLowerCase().includes("sum(") ||
        select.toLowerCase().includes("avg(") ||
        select.toLowerCase().includes("min(") ||
        select.toLowerCase().includes("max(")
      ) {
        return [data] as unknown as T;
      }
    }

    return data as T;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error(`Database query failed for table ${table}`);
  }
}

// Insert function
export async function insert<T = any>({
  table,
  data,
  returning = "*",
}: {
  table: string;
  data: Record<string, any> | Record<string, any>[];
  returning?: string;
}): Promise<T> {
  try {
    // Just use the table name directly without adding schema prefix
    // This helps Supabase correctly establish relationships between tables
    const tableName = table.includes(".")
      ? table.split(".")[1] // Extract just the table name if schema is provided
      : table;

    console.log("Using table name for insert:", tableName);
    const { data: result, error } = await supabaseAdmin
      .from(tableName)
      .insert(data)
      .select(returning);

    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error("Database insert error:", error);
    throw new Error(`Database insert failed for table ${table}`);
  }
}

// Update function
export async function update<T = any>({
  table,
  data,
  filters = {},
  returning = "*",
}: {
  table: string;
  data: Record<string, any>;
  filters: Record<string, any>;
  returning?: string;
}): Promise<T> {
  try {
    // Just use the table name directly without adding schema prefix
    // This helps Supabase correctly establish relationships between tables
    const tableName = table.includes(".")
      ? table.split(".")[1] // Extract just the table name if schema is provided
      : table;

    console.log("Using table name for update:", tableName);
    let query = supabaseAdmin.from(tableName).update(data);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data: result, error } = await query.select(returning);

    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error("Database update error:", error);
    throw new Error(`Database update failed for table ${table}`);
  }
}

// Delete function
export async function remove<T = any>({
  table,
  filters = {},
  returning = "*",
}: {
  table: string;
  filters: Record<string, any>;
  returning?: string;
}): Promise<T> {
  try {
    // Just use the table name directly without adding schema prefix
    // This helps Supabase correctly establish relationships between tables
    const tableName = table.includes(".")
      ? table.split(".")[1] // Extract just the table name if schema is provided
      : table;

    console.log("Using table name for delete:", tableName);
    let query = supabaseAdmin.from(tableName).delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data: result, error } = await query.select(returning);

    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error("Database delete error:", error);
    throw new Error(`Database delete failed for table ${table}`);
  }
}

// Function to initialize the database
export async function initializeDatabase(): Promise<void> {
  console.log("Setting up Supabase tables and initial data...");

  try {
    // We'll use Supabase SQL editor or migrations for table creation
    // but we'll make sure default data is inserted here    // Check if admin user exists - use table name directly without schema prefix
    const { data: adminUsers } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "admin@example.com");

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin user found, creating default data..."); // First check if admin role exists
      const { data: roles } = await supabaseAdmin
        .from("roles")
        .select("*")
        .eq("name", "admin"); // Insert admin role if it doesn't exist
      if (!roles || roles.length === 0) {
        console.log("Creating roles...");
        await supabaseAdmin
          .from("roles")
          .insert([
            { name: "admin" },
            { name: "manager" },
            { name: "operator" },
          ]);
      } // Get the admin role ID
      const { data: adminRole } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", "admin")
        .single();
      if (adminRole) {
        console.log("Creating admin user..."); // Create default admin user (password needs to be hashed)
        await supabaseAdmin.from("users").insert({
          name: "Admin User",
          email: "admin@example.com",
          // This is just a placeholder - should be properly hashed in production
          password:
            "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm",
          role_id: adminRole.id,
        });
      }
    }
    console.log("Database setup complete!");
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}
