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
  range?: [number, number];
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
      range,    } = options;

    // Handle direct SQL execution for Supabase - convert to table operations instead of RPC
    if (options.query && !operationTable) {
      console.log("Converting SQL query to Supabase table operations...");
      
      // For now, we'll convert common SQL patterns to Supabase table operations
      // This is a temporary solution until we can set up proper SQL execution
      
      const query = options.query.trim();
      const values = options.values || [];
      
      // Handle SELECT queries
      if (query.toLowerCase().startsWith('select')) {
        // Extract table name from SQL
        const tableMatch = query.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          
          // Simple WHERE id = ? pattern
          if (query.includes('WHERE id = ?') && values.length > 0) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: { id: values[0] },
              single: options.single || false,
            });
          }
          
          // Simple WHERE email = ? pattern
          if (query.includes('WHERE email = ?') && values.length > 0) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: { email: values[0] },
              single: options.single || false,
            });
          }
          
          // Simple SELECT * FROM table
          if (query.includes('SELECT *') && !query.includes('WHERE')) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: {},
              single: false,
            });
          }
        }
      }
      
      // Handle INSERT queries with RETURNING
      if (query.toLowerCase().startsWith('insert')) {
        const tableMatch = query.match(/insert\s+into\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          
          // Extract column names and values
          const columnsMatch = query.match(/\(([^)]+)\)/);
          if (columnsMatch && values.length > 0) {
            const columns = columnsMatch[1].split(',').map(col => col.trim());
            const data: Record<string, any> = {};
            
            columns.forEach((col, index) => {
              if (index < values.length) {
                data[col] = values[index];
              }
            });
            
            return supabaseDB.insert<T>({
              table: tableName,
              data,
              returning: "*",
            });
          }
        }
      }
      
      // If we can't convert the SQL, throw an error with helpful message
      throw new Error(`SQL query conversion not implemented for: ${query}. Please use table-based operations instead.`);
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
