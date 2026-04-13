const fs = require('fs');
const files = fs.readdirSync('public/camisas').filter(f => f.endsWith('.png') || f.endsWith('.webp'));
let products = [
  { id: 114, name: "Camisa Seleção Brasileira - Oficial", price: 119.99, category: "Seleções", image: "/camisas/@carinhacriativo (114).png", description: "A clássica amarelinha." },
  { id: 85, name: "Camisa Flamengo 2024 - Titular", price: 109.99, category: "Clubes Nacionais", image: "/camisas/@carinhacriativo (85).png", description: "O Manto Rubro-negro." },
  { id: 81, name: "Camisa Palmeiras 2024 - Titular", price: 109.99, category: "Clubes Nacionais", image: "/camisas/@carinhacriativo (81).png", description: "A torcida que canta e vibra." },
  { id: 1, name: "Camisa Real Madrid 2022/23 - Home", price: 119.99, category: "Internacionais", image: "/camisas/@carinhacriativo (1).png", description: "A elegância Merengue." }
];
let existingIds = new Set([114, 85, 81, 1]);
files.forEach(f => {
  const m = f.match(/\((\d+)\)/);
  if(m) {
    let id = parseInt(m[1]);
    if(!existingIds.has(id)) {
      products.push({ id: id, name: `Modelo Coleção Ref#${id}`, price: 99.99, category: "Catálogo", image: `/camisas/${f}`, description: "Camisa premium importada." });
      existingIds.add(id);
    }
  }
});
fs.writeFileSync('src/data/products.js', 'export const products = ' + JSON.stringify(products, null, 2) + ';\n');
