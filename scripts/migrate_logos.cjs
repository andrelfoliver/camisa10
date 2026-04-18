const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase (Pegando do .env que você já tem)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Nota: Para criar buckets/upload, a ANON_KEY precisa ter permissões de RLS ou usar a SERVICE_ROLE_KEY se disponível.

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'team-logos';

// Lista de times para migrar (Copiada do seu migration_teams.js)
const teamsToMigrate = [
    { name: 'Athletico-PR', logo: 'https://logodownload.org/wp-content/uploads/2016/10/athletico-paranaense-logo.png' },
    { name: 'Atlético-MG', logo: 'https://logodownload.org/wp-content/uploads/2016/10/atletico-mineiro-logo.png' },
    { name: 'Bahia', logo: 'https://logodownload.org/wp-content/uploads/2016/10/bahia-logo.png' },
    { name: 'Botafogo', logo: 'https://logodownload.org/wp-content/uploads/2016/10/botafogo-logo.png' },
    { name: 'Corinthians', logo: 'https://logodownload.org/wp-content/uploads/2016/10/corinthians-logo-1.png' },
    { name: 'Cruzeiro', logo: 'https://logodownload.org/wp-content/uploads/2016/10/cruzeiro-logo.png' },
    { name: 'Flamengo', logo: 'https://logodownload.org/wp-content/uploads/2016/09/flamengo-logo-0.png' },
    { name: 'Fluminense', logo: 'https://logodownload.org/wp-content/uploads/2016/09/fluminense-logo.png' },
    { name: 'Grêmio', logo: 'https://logodownload.org/wp-content/uploads/2016/09/gremio-logo.png' },
    { name: 'Internacional', logo: 'https://logodownload.org/wp-content/uploads/2016/09/inter-logo.png' },
    { name: 'Mirassol', logo: 'https://logodownload.org/wp-content/uploads/2016/11/mirassol-logo.png' },
    { name: 'Palmeiras', logo: 'https://logodownload.org/wp-content/uploads/2016/09/palmeiras-logo-1.png' },
    { name: 'Bragantino', logo: 'https://logodownload.org/wp-content/uploads/2020/01/red-bull-bragantino-logo.png' },
    { name: 'São Paulo', logo: 'https://logodownload.org/wp-content/uploads/2016/09/sao-paulo-logo-1.png' },
    { name: 'Vasco da Gama', logo: 'https://logodownload.org/wp-content/uploads/2016/10/vasco-logo.png' },
    { name: 'Vitória', logo: 'https://logodownload.org/wp-content/uploads/2016/10/vitoria-logo.png' },
    { name: 'Santos', logo: 'https://logodownload.org/wp-content/uploads/2016/09/santos-logo-1.png' },
    { name: 'Coritiba', logo: 'https://logodownload.org/wp-content/uploads/2016/10/coritiba-logo.png' },
    { name: 'Criciúma', logo: 'https://logodownload.org/wp-content/uploads/2017/02/criciuma-logo.png' },
    { name: 'Atlético-GO', logo: 'https://logodownload.org/wp-content/uploads/2017/02/atletico-go-logo.png' },
    { name: 'Cuiabá', logo: 'https://logodownload.org/wp-content/uploads/2021/03/cuiaba-logo.png' },
    { name: 'Fortaleza', logo: 'https://logodownload.org/wp-content/uploads/2016/10/fortaleza-logo.png' },
    { name: 'Juventude', logo: 'https://logodownload.org/wp-content/uploads/2021/02/juventude-logo.png' }
];

async function migrate() {
  console.log('🚀 Iniciando migração de logos para o Supabase Storage...');

  // Assumimos que o bucket 'team-logos' já foi criado manualmente pelo usuário
  for (const team of teamsToMigrate) {
    try {
      console.log(`\n⏳ Processando ${team.name}...`);
      
      // Gerar nome de arquivo seguro
      const fileName = `${team.name.toLowerCase().replace(/\s+/g, '-')}.png`;

      // 1. Download da imagem com User-Agent para evitar 404
      const response = await axios.get(team.logo, { 
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const buffer = Buffer.from(response.data, 'binary');

      // 2. Upload para o Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Erro no upload de ${team.name}:`, uploadError.message);
        continue;
      }

      // 3. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log(`✅ ${team.name} migrado! URL: ${publicUrl}`);

      // 4. Atualizar a tabela 'teams' no banco de dados
      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo: publicUrl })
        .eq('name', team.name);

      if (updateError) {
        console.error(`⚠️ Erro ao atualizar tabela 'teams' para ${team.name}:`, updateError.message);
      } else {
        console.log(`✨ Banco de dados atualizado para ${team.name}`);
      }

    } catch (err) {
      console.error(`💥 Erro crítico no time ${team.name}:`, err.message);
    }
  }

  console.log('\n🏁 Migração concluída!');
}

migrate();
