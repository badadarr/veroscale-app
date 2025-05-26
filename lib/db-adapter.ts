import * as mysqlDB from "./db";
import * as supabaseDB from "./db-supabase";
import { supabaseAdmin } from "./supabase.js";
import * as supabaseAggregation from "./supabase-aggregation"; // Import fungsi-fungsi agregasi

// Determine which database implementation to use
// Use Supabase if the environment variables are set
const useSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generic function to handle database operations
 */
export async function executeQuery<T = any>(options: {
  // MySQL style options
  query?: string;
  values?: any[];
  // Supabase style options
  table?: string;
  action?: "select" | "insert" | "update" | "delete" | "upsert";
  data?: Record<string, any>;
  filters?: Record<string, any>;
  columns?: string | string[];
  single?: boolean;
  returning?: string;
}): Promise<T> {
  if (useSupabase) {
    let {
      table: operationTable,
      action,
      data,
      filters,
      columns,
      single,
      returning,
    } = options;

    if (options.query && !operationTable) {
      console.warn(
        "SQL query detected while using Supabase. Converting to table-based API if possible, but functionality may be limited."
      );
      const sqlLower = options.query.toLowerCase();
      const tableMatch = sqlLower.match(/from\s+(\w+)/);
      if (tableMatch && tableMatch[1]) {
        console.log(`Extracted table name from SQL: ${tableMatch[1]}`);
        operationTable = tableMatch[1];
      } else {
        throw new Error(
          "Cannot determine table name from SQL query. Please use the table-based API with Supabase."
        );
      }
    }

    if (!operationTable) {
      throw new Error("Table name is required when using Supabase");
    }

    // Hapus prefix skema dari nama tabel untuk konsistensi
    const tableNameWithoutSchema = operationTable.includes(".")
      ? operationTable.split(".")[1]
      : operationTable;

    if (action === "select" || !action) {
      const selectColumnsString =
        typeof columns === "string" ? columns.trim() : "*";

      // Penanganan COUNT menggunakan helper
      if (
        typeof columns === "string" &&
        columns.toLowerCase().startsWith("count(")
      ) {
        console.log(
          `Using getCount for ${columns} on ${tableNameWithoutSchema}`
        );
        return supabaseAggregation.getCount(
          tableNameWithoutSchema,
          filters || {}
        ) as unknown as T;
      }

      // Penanganan SUM menggunakan helper
      if (
        typeof columns === "string" &&
        columns.toLowerCase().startsWith("sum(")
      ) {
        const sumMatch = columns.match(
          /sum\s*\(\s*([\w_]+)\s*\)(?:\s+as\s+([\w_]+))?/i
        );
        if (sumMatch) {
          const fieldName = sumMatch[1];
          const resultKey = sumMatch[2] || "total"; // Alias default jika tidak disediakan
          console.log(
            `Using getSum for SUM(${fieldName}) as ${resultKey} on ${tableNameWithoutSchema}`
          );
          return supabaseAggregation.getSum(
            tableNameWithoutSchema,
            fieldName,
            resultKey,
            filters || {}
          ) as unknown as T;
        } else {
          console.warn(
            `Could not parse SUM correctly from columns: ${columns}. Falling back to standard query.`
          );
        }
      }

      // Kueri standar tanpa delegasi helper agregasi spesifik
      return supabaseDB.query<T>({
        table: tableNameWithoutSchema,
        select: selectColumnsString,
        filters: filters || {},
        single: single || false,
      });
    } else if (action === "insert") {
      return supabaseDB.insert<T>({
        table: tableNameWithoutSchema,
        data: data || {},
        returning: returning || "*",
      });
    } else if (action === "update") {
      return supabaseDB.update<T>({
        table: tableNameWithoutSchema,
        data: data || {},
        filters: filters || {},
        returning: returning || "*",
      });
    } else if (action === "delete") {
      return supabaseDB.remove<T>({
        table: tableNameWithoutSchema,
        filters: filters || {},
        returning: returning || "*",
      });
    }

    throw new Error(`Unsupported action: ${action}`);
  } else {
    // Implementasi MySQL
    const { query, values } = options;
    if (!query) {
      throw new Error("Query is required when using MySQL");
    }
    return mysqlDB.executeQuery<T>({ query, values: values ?? [] });
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<any> {
  if (useSupabase) {
    // db-supabase.ts akan menangani penghapusan skema jika ada "public.users"
    const users = await supabaseDB.query({
      table: "users",
      filters: { id },
      single: true,
    });
    return users;
  } else {
    const users = await mysqlDB.executeQuery({
      query: "SELECT * FROM users WHERE id = ? LIMIT 1",
      values: [id],
    });
    return Array.isArray(users) && users.length > 0 ? users[0] : null;
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  if (useSupabase) {
    // db-supabase.ts akan menangani penghapusan skema jika ada "public.users"
    const users = await supabaseDB.query({
      table: "users",
      filters: { email },
      single: true,
    });
    return users;
  } else {
    const users = await mysqlDB.executeQuery({
      query: "SELECT * FROM users WHERE email = ? LIMIT 1",
      values: [email],
    });
    return Array.isArray(users) && users.length > 0 ? users[0] : null;
  }
}

/**
 * Initialize database
 */
export async function initializeDatabase(): Promise<void> {
  if (useSupabase) {
    return supabaseDB.initializeDatabase();
  } else {
    return mysqlDB.initializeDatabase();
  }
}
