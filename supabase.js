// supabase.js  (CZYSTY JS MODUŁ)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://zgeqrtrjjmaohgsmewpz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZXFydHJqam1hb2hnc21ld3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODkwMzQsImV4cCI6MjA3NTE2NTAzNH0.VOv3f51fRpqSzF8RxvKjvbu0Z3PnuVEw4FQ02nTzORc';

// Klient Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // potrzebne dla magic link
  },
});
