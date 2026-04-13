import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Quando criar o banco no Supabase, pegue a URL e a CHAVE no painel deles
// Adicione-as criando um arquivo .env na pasta raiz com:
// VITE_SUPABASE_URL=sua_url
// VITE_SUPABASE_ANON_KEY=sua_chave

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua_url_vem_aqui.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua_chave_anon_aqui';

export const supabase = createClient(supabaseUrl, supabaseKey);
