/**
 * Database adapter to provide a unified interface for database access
 * regardless of whether we're using MySQL or Supabase
 */

import * as mysqlDB from "./db";
import * as supabaseDB from "./db-supabase";
import { supabaseAdmin } from "./supabase.js";

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
    // Use Supabase implementation
    const {
      query,
      values,
      table,
      action,
      data,
      filters,
      columns,
      single,
      returning,
    } = options;

    if (query) {
      console.warn(
        "SQL query detected while using Supabase. Converting to table-based API if possible, but functionality may be limited."
      );

      // For backward compatibility, attempt to determine the operation type and table from the SQL
      // This is a very simplified conversion and won't work for complex queries
      if (!table) {
        // Try to extract table name from SQL query
        const sqlLower = query.toLowerCase();
        const tableMatch = sqlLower.match(/from\s+(\w+)/);

        if (tableMatch && tableMatch[1]) {
          console.log(`Extracted table name from SQL: ${tableMatch[1]}`);
          options.table = tableMatch[1];
        } else {
          throw new Error(
            "Cannot determine table name from SQL query. Please use the table-based API with Supabase."
          );
        }
      }
    }

    if (!options.table) {
      throw new Error("Table name is required when using Supabase");
    }

    if (action === "select" || !action) {
      // Handle aggregation functions (COUNT, SUM, etc.)
      let selectColumns = typeof columns === "string" ? columns : "*"; // Check if we need to use a special approach for aggregation
      if (
        typeof columns === "string" &&
        (columns.toLowerCase().includes("sum(") ||
          columns.toLowerCase().includes("count(") ||
          columns.toLowerCase().includes("avg(") ||
          columns.toLowerCase().includes("min(") ||
          columns.toLowerCase().includes("max("))
      ) {
        // Extract table name without schema
        const tableName = options.table.includes(".")
          ? options.table.split(".")[1]
          : options.table;

        console.log(
          `Using special aggregation handling for ${columns} on ${tableName}`
        );

        // For count operations
        if (columns.toLowerCase().includes("count(")) {
          // Supabase has a specific API for count
          let countQuery = supabaseAdmin.from(tableName);

          // Apply filters if any
          if (filters && Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined) {
                countQuery = countQuery.eq(key, value);
              }
            });
          }

          const { count, error } = await countQuery.count();
          if (error) throw error;

          // Format result like MySQL would return it
          return [{ count }] as unknown as T;
        }

        // For sum operations
        if (columns.toLowerCase().includes("sum(")) {
          // Extract the field name from sum(fieldname)
          const match = columns.match(/sum\s*\(\s*([^)]+)\s*\)/i);
          if (match && match[1]) {
            const fieldName = match[1].trim();
            console.log(`Calculating sum of ${fieldName}`);

            // Get all records
            let sumQuery = supabaseAdmin.from(tableName).select(fieldName);

            // Apply filters if any
            if (filters && Object.keys(filters).length > 0) {
              Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                  sumQuery = sumQuery.eq(key, value);
                }
              });
            }

            const { data, error } = await sumQuery;
            if (error) throw error;

            // Calculate sum manually
            let total = 0;
            if (Array.isArray(data)) {
              total = data.reduce((sum, item) => {
                const value = parseFloat(item[fieldName]) || 0;
                return sum + value;
              }, 0);
            }

            // Format result like MySQL would return it
            const resultKey = columns.includes(" as ")
              ? columns.split(" as ")[1].trim()
              : "total";

            const result = { [resultKey]: total };
            return [result] as unknown as T;
          }
        }
      }

      // Standard query without aggregation
      return supabaseDB.query<T>({
        table: options.table!,
        select: selectColumns,
        filters: filters || {},
        single: single || false,
      });
    } else if (action === "insert") {
      return supabaseDB.insert<T>({
        table: options.table,
        data: data || {},
        returning: returning || "*",
      });
    } else if (action === "update") {
      return supabaseDB.update<T>({
        table: options.table,
        data: data || {},
        filters: filters || {},
        returning: returning || "*",
      });
    } else if (action === "delete") {
      return supabaseDB.remove<T>({
        table: options.table,
        filters: filters || {},
        returning: returning || "*",
      });
    }

    throw new Error(`Unsupported action: ${action}`);
  } else {
    // Use MySQL implementation
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
