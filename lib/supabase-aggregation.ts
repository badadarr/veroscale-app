/**
 * Helper functions for handling aggregations in Supabase
 */

import { supabaseAdmin } from "./supabase.js"; // Pastikan path ini benar

/**
 * Get count of records from a table
 */
export async function getCount(
  tableName: string,
  filters: Record<string, any> = {}
) {
  try {
    console.log(`Getting count for ${tableName} with filters:`, filters);

    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;

    let queryBuilder = supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true }); // Mengganti nama variabel agar lebih jelas

    // Terapkan filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryBuilder = queryBuilder.eq(key, value);
      }
    });

    // Ini mengasumsikan queryBuilder memiliki metode .count
    const { count, error } = await queryBuilder; // Tambahkan 'as any' jika error berlanjut

    if (error) {
      console.error(`Error getting count for ${tableName}:`, error);
      throw error;
    }

    console.log(`Count for ${tableName}:`, count);
    return [{ count }];
  } catch (error) {
    console.error(`Failed to get count for ${tableName}:`, error);
    return [{ count: 0 }]; // Kembalikan nilai default jika ada error
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

    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;

    let queryBuilder = supabaseAdmin.from(table).select(fieldName);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        // TypeScript mungkin masih error di sini jika tipe queryBuilder tidak benar
        queryBuilder = queryBuilder.eq(key, value); // Tambahkan 'as any' jika error berlanjut
      }
    });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error(
        `Error getting data for sum calculation on ${tableName}:`,
        error
      );
      throw error;
    }

    let total = 0;
    if (Array.isArray(data)) {
      total = data.reduce((sum, item: Record<string, any>) => {
        // Memberikan tipe eksplisit untuk item
        const fieldValue = item[fieldName];
        // Pastikan fieldValue adalah string atau number sebelum parseFloat
        const numericValue =
          typeof fieldValue === "string" || typeof fieldValue === "number"
            ? parseFloat(String(fieldValue))
            : 0;
        return sum + (isNaN(numericValue) ? 0 : numericValue);
      }, 0);
    }

    console.log(`Sum of ${fieldName} for ${tableName}:`, total);
    return [{ [resultKey]: total }];
  } catch (error) {
    console.error(`Failed to get sum for ${tableName}.${fieldName}:`, error);
    return [{ [resultKey]: 0 }]; // Kembalikan nilai default jika ada error
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

    const table = tableName.includes(".") ? tableName.split(".")[1] : tableName;
    const selectQuery = ["*", ...relations].join(", ");

    const { data, error } = await supabaseAdmin.from(table).select(selectQuery);

    if (error) {
      console.error(`Error getting related data for ${tableName}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to get related data for ${tableName}:`, error);
    return []; // Kembalikan array kosong jika ada error
  }
}
