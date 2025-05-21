import { createClient } from '@supabase/supabase-js';

// Mendapatkan URL dan anon key dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Membuat Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
