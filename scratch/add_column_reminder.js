import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addSentColumn() {
  console.log('Tentando adicionar coluna is_notified...');
  // Nota: O Supabase JS não permite rodar DDL (ALTER TABLE) diretamente. 
  // O usuário precisará rodar no SQL Editor.
  console.log('Por favor, rode este comando no SQL Editor do Supabase:');
  console.log('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT FALSE;');
}

addSentColumn();
