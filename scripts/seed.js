import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://agbskncncrnzmutaubdn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk2NDg5OSwiZXhwIjoyMDkxNTQwODk5fQ.KhzhUyD53jfZmTwMDlcBG5r8q3KJFsGg4b-KGrKbiDI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedDatabase() {
  console.log('Lendo yupoo_data.json com centenas de camisas...');
  const rawData = fs.readFileSync('yupoo_data.json');
  const products = JSON.parse(rawData);

  console.log('Limpando tabela antiga...');
  await supabase.from('products').delete().neq('id', 0); // deleta todos os itens para nao duplicar

  console.log(`Iniciando envio de ${products.length} itens para o Supabase...`);

  const mapData = products.map((item) => ({
    name: item.name,
    category: item.category,
    image: item.image,
    original_url: item.original_url,
    price: 109.99
  }));

  const chunkSize = 200;
  for (let i = 0; i < mapData.length; i += chunkSize) {
    const chunk = mapData.slice(i, i + chunkSize);
    const { error } = await supabase.from('products').insert(chunk);
    if (error) {
      console.error(`Erro ao inserir lote ${i}:`, error.message);
    } else {
      console.log(`Inserido lote de ${chunk.length} camisas.`);
    }
  }

  console.log('Banco de Dados carregado com SUCESSO absoluto!');
}

seedDatabase();
