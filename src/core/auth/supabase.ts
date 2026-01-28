import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * 
 * This file initializes the Supabase client using environment variables.
 * Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. The client is initialized with placeholder values. ' +
    'Please check your environment variables.'
  );
}

// Initialize the client.
// If env vars are missing, we pass placeholder values to prevent crash.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);