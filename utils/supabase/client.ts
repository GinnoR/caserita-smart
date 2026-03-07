
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

// Instancia única (singleton) para el service layer
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Factory function para auth en componentes React
// (compatible con el patrón que usan AuthScreen y page.tsx)
export function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
