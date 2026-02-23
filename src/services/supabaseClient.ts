import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL hoặc Anon Key chưa được cấu hình trong .env.local');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,
            storageKey: 'readbookai-auth',
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);
