import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://cnksuxyfqlbdkzzzpjgf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNua3N1eHlmcWxiZGt6enpwamdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTM3ODgsImV4cCI6MjEwNzYyOTc4OH0.TYvMVtnSXw7oFtjqr5Rw7VBSy3jMoAzO5abUg23hg-g';

// Retrieve credentials from environment variables or browser runtime config
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('SSJ_SUPABASE_URL') || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('SSJ_SUPABASE_ANON_KEY') || '' : '';

  const url = envUrl || storedUrl || DEFAULT_SUPABASE_URL;
  const key = envKey || storedKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    key,
    isConfigured: !!(url && key)
  };
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};
