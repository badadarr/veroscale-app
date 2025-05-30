import * as mysqlDB from "./db";
import * as supabaseDB from "./db-supabase";
import { supabaseAdmin } from "./supabase.js";
import * as supabaseAggregation from "./supabase-aggregation";

// Determine which database implementation to use
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
  order?: Record<string, "asc" | "desc">;
}): Promise<T> {
  if (useSupabase) {
    try {
      const {
        table: operationTable,
        action,
        data,
        filters,
        columns,
        single,
        returning,
        range,
        order,
      } = options;

      // Handle direct SQL execution for Supabase
      if (options.query && !operationTable) {
        console.log("Converting SQL query to Supabase table operations...");
        const query = options.query.trim();
        const values = options.values || [];

        // Handle JOIN queries - convert to separate queries with manual joining
        if (query.includes("JOIN") || query.includes("join")) {
          // Handle issues with users JOIN
          if (
            (query.includes("FROM issues") ||
              query.match(/FROM\s+issues\s+i\b/i)) &&
            (query.includes("JOIN users") || query.match(/JOIN\s+users\s+u\b/i))
          ) {
            const whereMatch = query.match(
              /WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|$)/i
            );
            const orderMatch = query.match(/ORDER BY\s+([\w\s,.]+)/i);

            let issuesFilters: Record<string, any> = {};
            let valueIndex = 0;
            let orderBy: Record<string, string> = {};

            if (whereMatch) {
              const whereClause = whereMatch[1].trim();
              const statusMatch = whereClause.match(/(?:i\.)?status\s*=\s*\?/i);
              if (statusMatch && values.length > valueIndex) {
                issuesFilters.status = values[valueIndex];
                valueIndex++;
              }

              const generalMatch = whereClause.match(/(?:i\.)?(\w+)\s*=\s*\?/i);
              if (generalMatch && !statusMatch && values.length > valueIndex) {
                const columnName = generalMatch[1];
                issuesFilters[columnName] = values[valueIndex];
                valueIndex++;
              }
            }

            if (orderMatch) {
              const orderClause = orderMatch[1].trim();
              const cleanOrderClause = orderClause.replace(/i\./g, "");
              const [field, direction] = cleanOrderClause.split(/\s+/);

              if (field) {
                orderBy[field] =
                  direction?.toLowerCase() === "desc" ? "desc" : "asc";
              }
            }

            const queryOptions: any = {
              table: "issues",
              select: "*, users!reporter_id(name)",
              filters: issuesFilters,
              single: false,
            };

            if (Object.keys(orderBy).length > 0) {
              queryOptions.order = orderBy;
            }

            return supabaseDB.query<T>(queryOptions).then((issues: any) => {
              if (Array.isArray(issues)) {
                return issues.map((issue) => ({
                  ...issue,
                  reporter_name: issue.users?.name || "Unknown User",
                  user_name: issue.users?.name || "Unknown User",
                }));
              }
              return issues;
            }) as Promise<T>;
          }

          // Handle weight_records with materials and users JOIN
          if (
            query.includes("FROM weight_records") &&
            query.includes("JOIN materials") &&
            query.includes("JOIN users")
          ) {
            const whereMatch = query.match(
              /WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|$)/i
            );

            let filters: Record<string, any> = {};
            let valueIndex = 0;

            if (whereMatch) {
              const whereClause = whereMatch[1].trim();

              if (whereClause !== "1=1") {
                const conditions = whereClause
                  .split(" AND ")
                  .map((cond) => cond.trim());

                conditions.forEach((condition) => {
                  if (condition === "1=1") return;

                  const match = condition.match(/(\w+)\s*=\s*\?/);
                  if (match && valueIndex < values.length) {
                    filters[match[1]] = values[valueIndex];
                    valueIndex++;
                  }
                });
              }
            }

            // Get weight records with related data
            return supabaseDB
              .query<T>({
                table: "weight_records",
                select:
                  "*, materials!weight_records_item_id_fkey(name), users!weight_records_user_id_fkey(name), approved_by_user:users!weight_records_approved_by_fkey(name)",
                filters,
                single: false,
              })
              .then((records: any) => {
                if (Array.isArray(records)) {
                  return records.map((record) => ({
                    ...record,
                    item_name: record.materials?.name || "Unknown Material",
                    user_name: record.users?.name || "Unknown User",
                    approved_by_name: record.approved_by_user?.name || null,
                  }));
                }
                return records;
              }) as Promise<T>;
          }
        }

        // Extract table name from SQL
        const tableMatch = query.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];

          // Handle COUNT queries with WHERE clause
          if (
            query.includes("COUNT(*)") &&
            query.includes("WHERE") &&
            values.length > 0
          ) {
            const whereMatch = query.match(
              /WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i
            );
            if (whereMatch) {
              const whereClause = whereMatch[1].trim();

              if (whereClause === "1=1") {
                return supabaseDB.query<T>({
                  table: tableName,
                  select: "count",
                  filters: {},
                  single: true,
                });
              }

              const filters: Record<string, any> = {};
              const conditions = whereClause.split(/\s+AND\s+/i);
              let valueIndex = 0;

              conditions.forEach((condition) => {
                const trimmedCondition = condition.trim();
                if (trimmedCondition === "1=1") return;

                const columnMatch = trimmedCondition.match(/(\w+)\s*=\s*\?/);
                if (columnMatch && valueIndex < values.length) {
                  filters[columnMatch[1]] = values[valueIndex];
                  valueIndex++;
                }

                const gteMatch = trimmedCondition.match(/(\w+)\s*>=\s*\?/);
                if (gteMatch && valueIndex < values.length) {
                  filters[`${gteMatch[1]}_gte`] = values[valueIndex];
                  valueIndex++;
                  return;
                }

                const lteMatch = trimmedCondition.match(/(\w+)\s*<=\s*\?/);
                if (lteMatch && valueIndex < values.length) {
                  filters[`${lteMatch[1]}_lte`] = values[valueIndex];
                  valueIndex++;
                  return;
                }
              });

              return supabaseDB.query<T>({
                table: tableName,
                select: "count",
                filters,
                single: true,
              });
            }
          }

          // Handle simple COUNT queries without WHERE
          if (query.includes("COUNT(*)") && !query.includes("WHERE")) {
            return supabaseDB.query<T>({
              table: tableName,
              select: "count",
              filters: {},
              single: true,
            });
          }

          // Simple WHERE id = ? pattern
          if (query.includes("WHERE id = ?") && values.length > 0) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: { id: values[0] },
              single: options.single || false,
            });
          }

          // Simple WHERE email = ? pattern
          if (query.includes("WHERE email = ?") && values.length > 0) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: { email: values[0] },
              single: options.single || false,
            });
          }

          // Handle other WHERE patterns with single column
          const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
          if (whereMatch && values.length > 0) {
            const whereColumn = whereMatch[1];
            const filters: Record<string, any> = {};
            filters[whereColumn] = values[0];

            return supabaseDB.query<T>({
              table: tableName,
              filters,
              single: options.single || false,
            });
          }

          // Handle LIKE/ILIKE queries with OR conditions
          if (query.includes("ILIKE") || query.includes("LIKE")) {
            const orMatch = query.match(
              /\((\w+)\s+(I?LIKE)\s*\?\s+OR\s+(\w+)\s+(I?LIKE)\s*\?\)/i
            );
            if (orMatch && values.length >= 2) {
              const field1 = orMatch[1];
              let searchValue = values[0];

              if (typeof searchValue === "string") {
                searchValue = searchValue.replace(/%/g, "");
              }

              const filters: Record<string, any> = {};
              filters[field1] = searchValue;

              return supabaseDB.query<T>({
                table: tableName,
                filters,
                single: options.single || false,
              });
            }

            const likeMatch = query.match(/WHERE\s+(\w+)\s+(I?LIKE)\s*\?/i);
            if (likeMatch && values.length > 0) {
              const whereColumn = likeMatch[1];
              let searchValue = values[0];

              if (typeof searchValue === "string") {
                searchValue = searchValue.replace(/%/g, "");
              }

              const filters: Record<string, any> = {};
              filters[whereColumn] = searchValue;

              return supabaseDB.query<T>({
                table: tableName,
                filters,
                single: options.single || false,
              });
            }
          }

          // Handle WHERE with multiple conditions (AND logic)
          if (query.includes("AND") && values.length >= 2) {
            const whereSection = query.match(
              /WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|$)/i
            );
            if (whereSection) {
              const conditions = whereSection[1]
                .split(" AND ")
                .map((cond) => cond.trim());
              const filters: Record<string, any> = {};
              let valueIndex = 0;

              conditions.forEach((condition) => {
                if (condition === "1=1") return;

                const match = condition.match(/(\w+)\s*=\s*\?/);
                if (match && valueIndex < values.length) {
                  filters[match[1]] = values[valueIndex];
                  valueIndex++;
                }
              });

              if (Object.keys(filters).length > 0) {
                return supabaseDB.query<T>({
                  table: tableName,
                  filters,
                  single: options.single || false,
                });
              }
            }
          }

          // Handle simple SELECT with ORDER BY
          if (query.includes("ORDER BY") && !query.includes("JOIN")) {
            const orderMatch = query.match(
              /ORDER BY\s+([\w_]+)(?:\s+(ASC|DESC))?/i
            );

            const orderBy: Record<string, "asc" | "desc"> = {};

            if (orderMatch) {
              const column = orderMatch[1];
              const direction =
                orderMatch[2]?.toLowerCase() === "desc" ? "desc" : "asc";
              orderBy[column] = direction;
            }

            return supabaseDB.query<T>({
              table: tableName,
              filters: {},
              order: orderBy,
              single: false,
            });
          }

          // Handle WHERE 1=1 (means no filters, select all)
          if (query.includes("WHERE 1=1") && !query.includes("AND")) {
            return supabaseDB.query<T>({
              table: tableName,
              filters: {},
              single: options.single || false,
            });
          }

          // Simple SELECT * FROM table pattern
          if (query.match(/^SELECT\s+[\w\s,]+\s+FROM\s+\w+$/i)) {
            const columnsMatch = query.match(/SELECT\s+([\w\s,]+)\s+FROM/i);
            const tableMatch = query.match(/FROM\s+(\w+)/i);

            if (columnsMatch && tableMatch) {
              const columns = columnsMatch[1].trim();
              const tableName = tableMatch[1];

              return supabaseDB.query<T>({
                table: tableName,
                select: columns,
                filters: {},
                single: false,
              });
            }
          }
        }

        // Handle INSERT queries with RETURNING
        if (query.toLowerCase().startsWith("insert")) {
          const tableMatch = query.match(/insert\s+into\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];

            if (tableName === "weight_records") {
              console.log("Handling weight_records INSERT");
              console.log("Query:", query);
              console.log("Values:", values);

              const columnsMatch = query.match(/\(([\s\S]*?)\)\s*VALUES/i);
              if (columnsMatch && values.length > 0) {
                const columnText = columnsMatch[1];
                const columns = columnText
                  .split(",")
                  .map((col: string) => col.trim());
                const data: Record<string, any> = {};

                console.log("Parsed columns:", columns);

                columns.forEach((col: string, index: number) => {
                  if (index < values.length) {
                    data[col] = values[index];
                  }
                });

                console.log("Data object:", data);

                return supabaseDB.insert<T>({
                  table: tableName,
                  data,
                  returning: "*",
                });
              }
            }

            const columnsMatch = query.match(/\(([^)]+)\)/);
            if (columnsMatch && values.length > 0) {
              const columns = columnsMatch[1]
                .split(",")
                .map((col: string) => col.trim());
              const data: Record<string, any> = {};

              columns.forEach((col: string, index: number) => {
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

        // Handle UPDATE queries with dynamic SET clauses
        if (query.toLowerCase().startsWith("update")) {
          const tableMatch = query.match(/update\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];

            if (query.includes("WHERE id = ?")) {
              const setSection = query.match(/set\s+(.*?)\s+where/i);
              if (setSection && values.length >= 1) {
                const setClauses = setSection[1]
                  .split(",")
                  .map((clause: string) => clause.trim());
                const data: Record<string, any> = {};
                let valueIndex = 0;

                setClauses.forEach((clause: string) => {
                  const columnMatch = clause.match(/(\w+)\s*=\s*\?/);
                  if (columnMatch && valueIndex < values.length - 1) {
                    data[columnMatch[1]] = values[valueIndex];
                    valueIndex++;
                  } else if (clause.includes("updated_at = NOW()")) {
                    data["updated_at"] = new Date().toISOString();
                  }
                });

                const idValue = values[values.length - 1];

                return supabaseDB.update<T>({
                  table: tableName,
                  data,
                  filters: { id: idValue },
                  returning: "*",
                });
              }
            }
          }
        }

        // Handle DELETE queries
        if (query.toLowerCase().startsWith("delete")) {
          const tableMatch = query.match(/delete\s+from\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];

            if (query.includes("WHERE id = ?") && values.length > 0) {
              return supabaseDB.remove<T>({
                table: tableName,
                filters: { id: values[0] },
                returning: "*",
              });
            }
          }
        }

        throw new Error(
          `SQL query conversion not implemented for: ${query}. Please use table-based operations instead.`
        );
      }

      if (!operationTable) {
        throw new Error("Table name is required when using Supabase");
      }

      const tableNameWithoutSchema = operationTable.includes(".")
        ? operationTable.split(".")[1]
        : operationTable;

      if (action === "select" || !action) {
        const selectColumnsString =
          typeof columns === "string" ? columns.trim() : "*";

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

        if (
          typeof columns === "string" &&
          columns.toLowerCase().startsWith("sum(")
        ) {
          const sumMatch = columns.match(
            /sum\s*\(\s*([\w_]+)\s*\)(?:\s+as\s+([\w_]+))?/i
          );
          if (sumMatch) {
            const fieldName = sumMatch[1];
            const resultKey = sumMatch[2] || "total";
            console.log(
              `Using getSum for SUM(${fieldName}) as ${resultKey} on ${tableNameWithoutSchema}`
            );
            return supabaseAggregation.getSum(
              tableNameWithoutSchema,
              fieldName,
              resultKey,
              filters || {}
            ) as unknown as T;
          }
        }

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
    } catch (error) {
      console.error("Database operation failed:", error);

      if (error instanceof Error) {
        if (error.message.includes("foreign key constraint")) {
          throw new Error(
            "Operation failed due to data dependencies. Please check related records."
          );
        } else if (error.message.includes("unique constraint")) {
          throw new Error(
            "Operation failed due to duplicate data. Record already exists."
          );
        } else if (error.message.includes("not found")) {
          throw new Error(
            "Record not found. It may have been deleted by another user."
          );
        } else if (error.message.includes("permission")) {
          throw new Error(
            "Permission denied. You don't have access to perform this operation."
          );
        }
      }

      throw error;
    }
  } else {
    // MySQL implementation
    try {
      const { query, values } = options;
      if (!query) {
        throw new Error("Query is required when using MySQL");
      }
      return mysqlDB.executeQuery<T>({ query, values: values ?? [] });
    } catch (error) {
      console.error("MySQL operation failed:", error);
      throw error;
    }
  }
}

export async function safeQuery<T>(
  options: Parameters<typeof executeQuery>[0]
): Promise<T> {
  try {
    const result = await executeQuery<T>(options);

    if (options.table && !options.single && result === null) {
      return [] as unknown as T;
    }

    if (
      typeof options.columns === "string" &&
      options.columns.toLowerCase().includes("count") &&
      result === null
    ) {
      return { count: 0 } as unknown as T;
    }

    return result;
  } catch (error) {
    console.error(`Error querying ${options.table || options.query}:`, error);
    if (options.single === true) {
      return null as unknown as T;
    } else {
      return [] as unknown as T;
    }
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
