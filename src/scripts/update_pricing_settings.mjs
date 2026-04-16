const url = 'https://agbskncncrnzmutaubdn.supabase.co/rest/v1/store_settings';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

const pricing = {
  nameNumber: 11.90,
  patch: 3.90,
  size2XL3XL: 7.90,
  size4XL: 11.90,
  discounts: [
    { qty: 2, percent: 8 },
    { qty: 3, percent: 12 },
    { qty: 5, percent: 15 },
    { qty: 10, percent: 20 }
  ]
};

async function updatePricing() {
  const headers = { 
    'apikey': key, 
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };
  
  const body = {
    key: 'pricing',
    value: JSON.stringify(pricing)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  console.log(`Update status: ${res.status}`);
}

updatePricing();
