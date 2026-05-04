/**
 * infrastructure/supabase.js
 *
 * Creates and exports the single Supabase client instance.
 * Imported by both SupabaseRepository and auth.js.
 */

import { createClient }      from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../core/config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
