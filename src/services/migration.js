import { supabase } from './supabase';
import { brasil2025Products } from '../data/brasil2025';

export const migrateProductsToSupabase = async () => {
  console.log('Iniciando migração de produtos...');

  // 1. Gerar os produtos "Gerais" para migração
  const geralProducts = Array.from({ length: 418 }, (_, i) => ({
    name: `Camisa Geral #${i + 1}`,
    image: `/camisas/@carinhacriativo (${i + 1}).png`,
    price: 69.90,
    category: 'Brasileirão', // Mudado de Lançamentos para Brasileirão
    league: 'Geral',
    description: 'Camisa de alta performance importada.',
    inventory: 50
  }));

  // 2. Preparar produtos da Seleção
  const selecaoProducts = brasil2025Products.map(p => ({
    name: p.name,
    image: p.image,
    price: p.price,
    category: 'Seleções',
    league: 'Seleções',
    team: 'Brasil',
    description: 'Coleção Oficial da Seleção Brasileira 25/26.',
    inventory: 25
  }));

  const allToMigrate = [...geralProducts, ...selecaoProducts];

  // 3. Inserir no Supabase (em blocos de 50 para evitar timeout)
  const CHUNK_SIZE = 50;
  let successCount = 0;
  let errors = [];

  for (let i = 0; i < allToMigrate.length; i += CHUNK_SIZE) {
    const chunk = allToMigrate.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase.from('products').insert(chunk).select();
    
    if (error) {
      console.error(`Erro no bloco ${i}:`, error.message);
      errors.push(error.message);
    } else {
      successCount += chunk.length;
      console.log(`Progresso: ${successCount} produtos migrados...`);
    }
  }

  return { successCount, errors };
};
