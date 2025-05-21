import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });

// Mendapatkan URL dan anon key dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log for debugging
console.log('Supabase URL:', supabaseUrl.substring(0, 10) + '...');
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

// Membuat Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
