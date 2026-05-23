import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env variables if running in non-Next.js environment (e.g. cron script)
if (typeof window === 'undefined') {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase credentials not found in env variables! Database connections will fail.");
}

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
