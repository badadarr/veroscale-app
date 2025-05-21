// filepath: d:\Documents\Skripsi Tugas Akhir Project\project-bolt-sb1-qkqzvvpk\project\lib\db-supabase.ts
import { supabaseAdmin } from './supabase';

// Helper functions for interacting with Supabase

// Generic query function
export async function query<T = any>({ 
  table, 
  select = '*',
  filters = {},
  single = false
}: { 
  table: string; 
  select?: string;
  filters?: Record<string, any>;
  single?: boolean
}): Promise<T> {
  try {
    // Make sure we're using the correct table name format with schema
    // Supabase requires fully qualified table names with schema
    // We'll keep the original table name if it includes a schema already
    const tableName = table.includes('.') ? table : `weightmanagementdb.${table}`;
    
    let query = supabaseAdmin
      .from(tableName)
      .select(select);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Execute query
    const { data, error } = single 
      ? await query.single()
      : await query;

    if (error) throw error;
    return data as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed for table ${table}`);
  }
}

// Insert function
export async function insert<T = any>({
  table,
  data,
  returning = '*'
}: {
  table: string;
  data: Record<string, any> | Record<string, any>[];
  returning?: string;
}): Promise<T> {
  try {
    // Make sure we're using the correct table name format with schema
    const tableName = table.includes('.') ? table : `weightmanagementdb.${table}`;
    
    const { data: result, error } = await supabaseAdmin
      .from(tableName)
      .insert(data)
      .select(returning);
    
    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error('Database insert error:', error);
    throw new Error(`Database insert failed for table ${table}`);
  }
}

// Update function
export async function update<T = any>({
  table,
  data,
  filters = {},
  returning = '*'
}: {
  table: string;
  data: Record<string, any>;
  filters: Record<string, any>;
  returning?: string;
}): Promise<T> {
  try {
    // Make sure we're using the correct table name format with schema
    const tableName = table.includes('.') ? table : `weightmanagementdb.${table}`;
    
    let query = supabaseAdmin
      .from(tableName)
      .update(data);
    
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
    console.error('Database update error:', error);
    throw new Error(`Database update failed for table ${table}`);
  }
}

// Delete function
export async function remove<T = any>({
  table,
  filters = {},
  returning = '*'
}: {
  table: string;
  filters: Record<string, any>;
  returning?: string;
}): Promise<T> {
  try {
    // Make sure we're using the correct table name format with schema
    const tableName = table.includes('.') ? table : `weightmanagementdb.${table}`;
    
    let query = supabaseAdmin
      .from(tableName)
      .delete();
    
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
    console.error('Database delete error:', error);
    throw new Error(`Database delete failed for table ${table}`);
  }
}

// Function to initialize the database
export async function initializeDatabase() {
  console.log('Setting up Supabase tables and initial data...');
  
  try {
    // We'll use Supabase SQL editor or migrations for table creation
    // but we'll make sure default data is inserted here
    
    // Check if admin user exists
    const { data: adminUsers } = await supabaseAdmin
      .from('weightmanagementdb.users')
      .select('*')
      .eq('email', 'admin@example.com');
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin user found, creating default data...');
      
      // First check if admin role exists
      const { data: roles } = await supabaseAdmin
        .from('weightmanagementdb.roles')
        .select('*')
        .eq('name', 'admin');
      
      // Insert admin role if it doesn't exist
      if (!roles || roles.length === 0) {
        console.log('Creating roles...');
        await supabaseAdmin.from('weightmanagementdb.roles').insert([
          { name: 'admin' },
          { name: 'manager' },
          { name: 'operator' }
        ]);
      }
      
      // Get the admin role ID
      const { data: adminRole } = await supabaseAdmin
        .from('weightmanagementdb.roles')
        .select('id')
        .eq('name', 'admin')
        .single();
      
      if (adminRole) {
        console.log('Creating admin user...');
        // Create default admin user (password needs to be hashed)
        await supabaseAdmin.from('weightmanagementdb.users').insert({
          name: 'Admin User',
          email: 'admin@example.com', 
          // This is just a placeholder - should be properly hashed in production
          password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',  
          role_id: adminRole.id
        });
      }
    }
    
    console.log('Database setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}
