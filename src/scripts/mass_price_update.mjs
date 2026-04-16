const url = 'https://agbskncncrnzmutaubdn.supabase.co/rest/v1/products';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

async function massUpdatePrices() {
  const headers = { 
    'apikey': key, 
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  // 1. Fetch all products
  const fetchRes = await fetch(`${url}?select=id,name,version`, { headers });
  const products = await fetchRes.json();
  console.log(`Buscando ${products.length} produtos para atualização...`);

  let count = 0;
  for (const p of products) {
    const name = p.name.toLowerCase();
    const ver = p.version || '';
    let newPrice = 47.90; // Default: Torcedor/Fã

    if (ver === 'Retrô') {
      newPrice = 61.90;
    } else if (ver === 'Jogador') {
      if (name.includes('adidas')) newPrice = 57.90;
      else if (name.includes('nike')) newPrice = 61.90;
      else newPrice = 57.90; // Fallback jogador
    } else if (name.includes('infantil')) {
      if (name.includes('24') || name.includes('26') || name.includes('28')) newPrice = 44.90;
      else newPrice = 40.90;
    } else if (name.includes('kit adulto')) {
      newPrice = 57.90;
    } else if (name.includes('shorts')) {
      if (ver === 'Jogador') newPrice = 57.90;
      else newPrice = 36.95;
    } else if (name.includes('manga longa')) {
      newPrice = 48.90;
    } else if (name.includes('corta vento')) {
      newPrice = 126.90;
    } else if (ver === 'Torcedor') {
      newPrice = 47.90;
    }

    try {
      const updateRes = await fetch(`${url}?id=eq.${p.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ price: newPrice })
      });
      if (updateRes.ok) count++;
    } catch (e) {
      console.error(`Erro ao atualizar ID ${p.id}: ${e.message}`);
    }
  }

  console.log(`Sucesso: ${count} de ${products.length} preços atualizados.`);
}

massUpdatePrices();
