/**
 * Helper functions for handling aggregations in Supabase
 */

import { supabaseAdmin } from "./supabase.js";

/**
 * Get count of records from a table
 */
export async function getCount(
  tableName: string,
  filters: Record<string, any> = {}
) {
  try {
    console.log(`Getting count for ${tableName} with filters:`, filters);

    // Remove schema prefix if present
    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;

    let query = supabaseAdmin.from(table);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { count, error } = await query.count();

    if (error) {
      console.error(`Error getting count for ${tableName}:`, error);
      throw error;
    }

    console.log(`Count for ${tableName}:`, count);
    return [{ count }];
  } catch (error) {
    console.error(`Failed to get count for ${tableName}:`, error);
    return [{ count: 0 }];
  }
}

/**
 * Calculate sum of a field in a table
 */
export async function getSum(
  tableName: string,
  fieldName: string,
  resultKey: string = "total",
  filters: Record<string, any> = {}
) {
  try {
    console.log(
      `Getting sum of ${fieldName} for ${tableName} with filters:`,
      filters
    );

    // Remove schema prefix if present
    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;

    let query = supabaseAdmin.from(table).select(fieldName);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;

    if (error) {
      console.error(
        `Error getting data for sum calculation on ${tableName}:`,
        error
      );
      throw error;
    }

    // Calculate sum manually
    let total = 0;
    if (Array.isArray(data)) {
      total = data.reduce((sum, item) => {
        const value = parseFloat(item[fieldName]) || 0;
        return sum + value;
      }, 0);
    }

    console.log(`Sum of ${fieldName} for ${tableName}:`, total);
    return [{ [resultKey]: total }];
  } catch (error) {
    console.error(`Failed to get sum for ${tableName}.${fieldName}:`, error);
    return [{ [resultKey]: 0 }];
  }
}

/**
 * Get related data with proper formatting for Supabase nested queries
 */
export async function getRelatedData(tableName: string, relations: string[]) {
  try {
    console.log(
      `Getting related data for ${tableName} with relations:`,
      relations
    );

    // Remove schema prefix if present
    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;

    // Format the select string properly for Supabase
    // For example: "*, items(*), users(*)"
    const selectQuery = ["*", ...relations].join(", ");

    const { data, error } = await supabaseAdmin.from(table).select(selectQuery);

    if (error) {
      console.error(`Error getting related data for ${tableName}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to get related data for ${tableName}:`, error);
    return [];
  }
}
