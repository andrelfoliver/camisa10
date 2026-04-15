import fs from 'fs';
import path from 'path';

const mappingFile = './src/data/shirt_mapping.json';
const outputFile = './seed_products.sql';

if (!fs.existsSync(mappingFile)) {
    console.error('Mapping file not found!');
    process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

let sql = '-- Script de inserção dos produtos mapeados\n\n';
sql += 'INSERT INTO public.products (name, price, category, description, image) VALUES\n';

const entries = Object.entries(mapping);

const values = entries.map(([filename, data], index) => {
    const time = data.time || 'Time Desconhecido';
    const temporada = data.temporada || '';
    const tipo = data.tipo || 'Camisa';
    
    const name = `${time} ${temporada} - ${tipo}`.trim();
    const image = `/camisas/${filename}`;
    const price = 109.90; // Preço padrão
    const category = data.liga || 'Catálogo';
    const description = `Manto premium do ${time}, temporada ${temporada}. Tecido de alta qualidade e acabamento impecável.`;

    const escapedName = name.replace(/'/g, "''");
    const escapedDescription = description.replace(/'/g, "''");
    
    return `('${escapedName}', ${price}, '${category}', '${escapedDescription}', '${image}')`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync(outputFile, sql);
console.log(`SQL gerado com sucesso em ${outputFile}`);
