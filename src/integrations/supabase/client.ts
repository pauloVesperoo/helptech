import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gmkelnqffvktbdjgzkgo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VsbnFmZnZrdGJkamd6a2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjE0MTgsImV4cCI6MjA2MjI5NzQxOH0.sJnCpbeNvFRPHs6JDAZR47kQf-sLPgzC1NcAnlilcU4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        db: { schema: 'public' },
        auth: { persistSession: true}
    }
);