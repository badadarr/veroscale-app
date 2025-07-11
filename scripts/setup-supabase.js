import bcrypt from 'bcryptjs';
import supabase from '../lib/supabase.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: envFile });

async function setupSupabase() {
  console.log('Setting up Supabase database...');

  try {
    console.log('Connecting to Supabase...');
    
    // Check connection
    const { data: connectionTest, error: connectionError } = await supabase.from('roles').select('count').limit(1);
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError);
      console.log('Make sure your Supabase URL and API key are correctly set in .env.local');
      console.log('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    
    // Check if admin user exists
    const { data: adminUsers, error: adminCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com');
    
    if (adminCheckError) {
      console.error('Error checking for admin user:', adminCheckError);
      return;
    }
    
    // Create admin user if it doesn't exist
    if (!adminUsers || adminUsers.length === 0) {
      console.log('Creating admin user...');
      
      // Check for admin role
      const { data: adminRoles, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'admin');
      
      if (roleError) {
        console.error('Error checking for admin role:', roleError);
        return;
      }
      
      let adminRoleId;
      
      if (!adminRoles || adminRoles.length === 0) {
        // Insert admin role
        const { data: newRole, error: insertRoleError } = await supabase
          .from('roles')
          .insert({ name: 'admin' })
          .select();
        
        if (insertRoleError) {
          console.error('Error creating admin role:', insertRoleError);
          return;
        }
        
        adminRoleId = newRole[0].id;
        
        // Insert other roles
        const { error: otherRolesError } = await supabase
          .from('roles')
          .insert([
            { name: 'manager' },
            { name: 'operator' },
            { name: 'marketing' }
          ]);
        
        if (otherRolesError) {
          console.error('Error creating other roles:', otherRolesError);
          // Continue anyway
        }
      } else {
        adminRoleId = adminRoles[0].id;
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role_id: adminRoleId
        });
      
      if (userInsertError) {
        console.error('Error creating admin user:', userInsertError);
        return;
      }
      
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
    
    // Check and insert sample data
    const { data: samples, error: samplesError } = await supabase
      .from('samples_item')
      .select('count');
    
    if (samplesError) {
      console.error('Error checking for samples:', samplesError);
    } else if (samples && samples.length === 0) {
      console.log('Inserting sample data...');
      
      // Insert sample ref_items
      const { error: refItemsError } = await supabase
        .from('ref_items')
        .insert([
          { name: 'Steel Bar', weight: 5.75 },
          { name: 'Aluminum Sheet', weight: 2.3 },
          { name: 'Copper Wire', weight: 1.25 },
          { name: 'Iron Pipe', weight: 8.5 },
          { name: 'Plastic Granules', weight: 0.85 }
        ]);
      
      if (refItemsError) {
        console.error('Error inserting ref_items data:', refItemsError);
      }
      
      // Insert sample samples_item
      const { error: samplesItemError } = await supabase
        .from('samples_item')
        .insert([
          { category: 'Metal', item: 'Steel', sample_weight: 7.8 },
          { category: 'Metal', item: 'Aluminum', sample_weight: 2.7 },
          { category: 'Metal', item: 'Copper', sample_weight: 8.96 },
          { category: 'Plastic', item: 'PVC', sample_weight: 1.3 },
          { category: 'Plastic', item: 'Polypropylene', sample_weight: 0.9 },
          { category: 'Wood', item: 'Oak', sample_weight: 0.7 },
          { category: 'Wood', item: 'Pine', sample_weight: 0.5 },
          { category: 'Rubber', item: 'Natural Rubber', sample_weight: 0.92 },
          { category: 'Glass', item: 'Soda-lime Glass', sample_weight: 2.5 },
          { category: 'Ceramic', item: 'Porcelain', sample_weight: 2.4 }
        ]);
      
      if (samplesItemError) {
        console.error('Error inserting samples_item data:', samplesItemError);
      } else {
        console.log('Sample data inserted successfully!');
      }
    } else {
      console.log('Sample data already exists.');
    }
    
    console.log('Supabase setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
}

// Run the setup
setupSupabase();
