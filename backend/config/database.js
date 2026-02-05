import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
let supabase = null;

export const initializeDatabase = () => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials. Please check SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
        }

        supabase = createClient(supabaseUrl, supabaseKey);

        console.log('✅ Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error.message);
        throw error;
    }
};

export const getSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Call initializeDatabase() first.');
    }
    return supabase;
};

export default {
    initializeDatabase,
    getSupabase
};
