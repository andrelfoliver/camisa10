import fs from 'fs';

const mappingFile = './src/data/shirt_mapping.json';
const outputFile = './update_products_massivo.sql';

if (!fs.existsSync(mappingFile)) {
    console.error('Mapping file not found!');
    process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

let sql = '-- Script de ATUALIZAÇÃO MASSIVA dos atributos das camisas\n\n';

for (const [filename, data] of Object.entries(mapping)) {
    const escTeam = (data.time || '').replace(/'/g, "''");
    let league = data.liga || '';
    
    // Calcula Version dinamicamente
    let version = 'Torcedor';
    const tipoLower = (data.tipo || '').toLowerCase();
    const tempLower = (data.temporada || '').toLowerCase();
    
    if (tipoLower.includes('jogador') || tipoLower.includes('player') || tempLower.includes('jogador')) version = 'Jogador';
    else if (tipoLower.includes('retrô') || tipoLower.includes('retro') || tempLower.includes('retrô') || tempLower.includes('retro')) version = 'Retrô';

    // Calcula Categoria baseada na lógica oficial
    let category = 'Internacionais';
    if (league === 'Brasileirão' || league === 'Seleções') {
        category = league;
    }

    const imagePath = `/camisas/${filename}`;
    
    sql += `UPDATE public.products SET team = '${escTeam}', league = '${league}', version = '${version}', category = '${category}' WHERE image = '${imagePath}';\n`;
}

fs.writeFileSync(outputFile, sql);
console.log(`SQL gerado com sucesso! Arquivo: ${outputFile}`);
