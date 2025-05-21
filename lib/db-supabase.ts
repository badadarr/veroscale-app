import supabase from './supabase';

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
    let query = supabase
      .from(table)
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
    const { data: result, error } = await supabase
      .from(table)
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
    let query = supabase
      .from(table)
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
    let query = supabase
      .from(table)
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
    // This is just a placeholder for any initialization code we might need
    
    // Check if admin user exists
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com');
    
    // Add admin user if it doesn't exist
    if (!users || users.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // First check if admin role exists
      const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'admin');
      
      let adminRoleId: number;
      
      // Insert admin role if it doesn't exist
      if (!roles || roles.length === 0) {
        const { data: newRole } = await supabase
          .from('roles')
          .insert({ name: 'admin' })
          .select();
        
        adminRoleId = newRole ? newRole[0].id : 1;
        
        // Also add other roles
        await supabase.from('roles').insert([
          { name: 'manager' },
          { name: 'operator' }
        ]);
      } else {
        adminRoleId = roles[0].id;
      }
      
      // Insert admin user
      await supabase.from('users').insert({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role_id: adminRoleId
      });
      
      console.log('Default admin user created');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}
