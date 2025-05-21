/**
 * Database adapter to provide a unified interface for database access
 * regardless of whether we're using MySQL or Supabase
 */

import * as mysqlDB from './db';
import * as supabaseDB from './db-supabase';

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
  action?: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  data?: Record<string, any>;
  filters?: Record<string, any>;
  columns?: string | string[];
  single?: boolean;
  returning?: string;
}): Promise<T> {
  if (useSupabase) {
    // Use Supabase implementation
    const { query, values, table, action, data, filters, columns, single, returning } = options;
    
    if (query) {
      console.warn('SQL queries are not supported with Supabase. Please use the table-based API.');
    }
    
    if (!table) {
      throw new Error('Table name is required when using Supabase');
    }
    
    if (action === 'select' || !action) {
      return supabaseDB.query<T>({
        table,
        select: typeof columns === 'string' ? columns : '*',
        filters: filters || {},
        single: single || false
      });
    } else if (action === 'insert') {
      return supabaseDB.insert<T>({
        table,
        data: data || {},
        returning: returning || '*'
      });
    } else if (action === 'update') {
      return supabaseDB.update<T>({
        table,
        data: data || {},
        filters: filters || {},
        returning: returning || '*'
      });
    } else if (action === 'delete') {
      return supabaseDB.remove<T>({
        table,
        filters: filters || {},
        returning: returning || '*'
      });
    }
    
    throw new Error(`Unsupported action: ${action}`);
  } else {
    // Use MySQL implementation
    const { query, values } = options;
    
    if (!query) {
      throw new Error('Query is required when using MySQL');
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
      table: 'users',
      filters: { id },
      single: true
    });
    return users;
  } else {
    const users = await mysqlDB.executeQuery({
      query: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      values: [id]
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
      table: 'users',
      filters: { email },
      single: true
    });
    return users;
  } else {
    const users = await mysqlDB.executeQuery({
      query: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      values: [email]
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
