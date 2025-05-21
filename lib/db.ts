import supabase from "./supabase";

interface QueryParams {
  table: string;
  action?: "select" | "insert" | "update" | "delete" | "upsert";
  data?: Record<string, any>;
  conditions?: Record<string, any>;
  columns?: string | string[];
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

// Legacy interface support for backward compatibility
interface LegacyQueryParams {
  query: string;
  values: any[];
}

// Combined type to support both new and legacy formats
type AnyQueryParams = QueryParams | LegacyQueryParams;

export async function executeQuery<T>(params: AnyQueryParams): Promise<T> {
  // Check if using legacy format
  if ("query" in params) {
    console.warn("Using legacy query format. Please update to the new format.");
    throw new Error(
      "Raw SQL queries are not supported in Supabase. Please use the db-adapter.ts module instead."
    );
  }

  // Using new format
  const {
    table,
    action = "select",
    data,
    conditions,
    columns = "*",
    limit,
    offset,
    orderBy,
  } = params as QueryParams;

  // Import the correct type from supabase-js if available
  // import { PostgrestFilterBuilder } from '@supabase/supabase-js';

  let query: any;

  switch (action) {
    case "select":
      query = supabase
        .from(table)
        .select(Array.isArray(columns) ? columns.join(",") : columns);
      break;
    case "insert":
      query = supabase.from(table).insert(data as any);
      break;
    case "update":
      query = supabase.from(table).update(data as any);
      break;
    case "delete":
      query = supabase.from(table).delete();
      break;
    case "upsert":
      query = supabase.from(table).upsert(data as any);
      break;
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  // Apply conditions
  if (conditions) {
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply limit
  if (limit) {
    query = query.limit(limit);
  }

  // Apply offset
  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, {
      ascending: orderBy.ascending !== false,
    });
  }

  const { data: result, error } = await query;
  if (error) throw new Error(error.message);
  return result as T;
}
export function initializeDatabase(): void | PromiseLike<void> {
  throw new Error("Function not implemented.");
}
