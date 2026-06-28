import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://sua_url_vem_aqui.supabase.co').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua_chave_anon_aqui').trim();

// Cliente Principal da Loja
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-agbskncncrnzmutaubdn-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Cliente Isolado para o Rebrand
export const supabaseRebrand = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-rebrand-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
