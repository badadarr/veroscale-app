import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iuwjglizywsuojvqbueh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1d2pnbGl6eXdzdW9qdnFidWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjQzMzksImV4cCI6MjA2Njc0MDMzOX0.8Yc9TaBktDDlkdN-AQXETgJD5QKWZmCL8npI_WL9L-Y";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1d2pnbGl6eXdzdW9qdnFidWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE2NDMzOSwiZXhwIjoyMDY2NzQwMzM5fQ.Nrxl4eqZZy_n0SVwGc9CV0y-_hVHbQH8OXhY5w-adWs";

// Create clients for different authentication levels
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client with service role for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export default supabase;
