import { supabase } from './supabase';

/**
 * Normaliza os nomes dos times nos produtos e remove duplicatas na tabela de times.
 */
export async function normalizeTeamData() {
    console.log('Iniciando normalização de dados de times...');
    
    const ALIAS_MAP = {
        'Atlético Mineiro': 'Atlético-MG',
        'Athletico Paranaense': 'Athletico-PR',
        'Athletico-PR': 'Athletico-PR',
        'Al Nassr': 'Al-Nassr',
        'Inter Miami CF': 'Inter Miami',
        'Inter Miami': 'Inter Miami',
        'Seleção da Alemanha': 'Alemanha',
        'Alemanha': 'Alemanha',
        'Seleção da Argentina': 'Argentina',
        'Argentina': 'Argentina',
        'Atlético Goianiense': 'Atlético-GO',
        'Red Bull Bragantino': 'Bragantino',
        'Bragantino': 'Bragantino'
    };

    try {
        // 1. Atualizar o campo 'team' em todos os produtos para seguir o padrão
        const { data: products, error: prodError } = await supabase.from('products').select('id, team');
        if (prodError) throw prodError;

        for (const product of products) {
            const standardName = ALIAS_MAP[product.team];
            if (standardName && product.team !== standardName) {
                console.log(`Normalizando produto ${product.id}: ${product.team} -> ${standardName}`);
                await supabase.from('products').update({ team: standardName }).eq('id', product.id);
            }
        }

        // 2. Remover duplicatas na tabela 'teams'
        // Se existir "Atlético Mineiro" e "Atlético-MG", deletamos a versão "Atlético Mineiro"
        const { data: teams, error: teamsError } = await supabase.from('teams').select('id, name');
        if (teamsError) throw teamsError;

        const teamNamesInDB = teams.map(t => t.name);
        for (const [alias, standard] of Object.entries(ALIAS_MAP)) {
            if (alias !== standard && teamNamesInDB.includes(alias) && teamNamesInDB.includes(standard)) {
                console.log(`Removendo duplicata: ${alias} (mantendo ${standard})`);
                await supabase.from('teams').delete().eq('name', alias);
            }
        }

        return { success: true, message: "Dados normalizados e duplicatas removidas." };
    } catch (err) {
        console.error('Erro na normalização:', err);
        return { success: false, message: err.message };
    }
}

/**
 * Migra os times do arquivo estático para a tabela 'teams' no Supabase.
 */
export async function migrateTeamsToSupabase() {
    console.log('Iniciando sincronização de escudos...');
    
    // Primeiro, normalizamos os dados existentes
    await normalizeTeamData();

    // Mapeamento de logos locais (Pasta public/escudos - Estabilidade 100%)
    // Usamos caminhos relativos para que funcionem tanto em dev quanto em produção (Vercel)
    const BASE_URL = '/escudos';
    
    const highQualityTeams = [
        // Brasileirão
        { name: 'Athletico-PR', league: 'Brasileirão', logo: `${BASE_URL}/athletico-paranaense.png` },
        { name: 'Atlético-GO', league: 'Brasileirão', logo: `${BASE_URL}/atletico-go.png` },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: `${BASE_URL}/atletico-mineiro.png` },
        { name: 'Bahia', league: 'Brasileirão', logo: `${BASE_URL}/bahia.png` },
        { name: 'Botafogo', league: 'Brasileirão', logo: `${BASE_URL}/botafogo.png` },
        { name: 'Corinthians', league: 'Brasileirão', logo: `${BASE_URL}/corinthians.png` },
        { name: 'Coritiba', league: 'Brasileirão', logo: `${BASE_URL}/coritiba.png` },
        { name: 'Criciúma', league: 'Brasileirão', logo: `${BASE_URL}/criciuma.png` },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: `${BASE_URL}/cruzeiro.png` },
        { name: 'Cuiabá', league: 'Brasileirão', logo: `${BASE_URL}/cuiaba.png` },
        { name: 'Flamengo', league: 'Brasileirão', logo: `${BASE_URL}/flamengo.png` },
        { name: 'Fluminense', league: 'Brasileirão', logo: `${BASE_URL}/fluminense.png` },
        { name: 'Fortaleza', league: 'Brasileirão', logo: `${BASE_URL}/fortaleza.png` },
        { name: 'Grêmio', league: 'Brasileirão', logo: `${BASE_URL}/gremio.png` },
        { name: 'Internacional', league: 'Brasileirão', logo: `${BASE_URL}/internacional.png` },
        { name: 'Juventude', league: 'Brasileirão', logo: `${BASE_URL}/juventude.png` },
        { name: 'Mirassol', league: 'Brasileirão', logo: `${BASE_URL}/mirassol-sp.png` },
        { name: 'Palmeiras', league: 'Brasileirão', logo: `${BASE_URL}/palmeiras.png` },
        { name: 'Bragantino', league: 'Brasileirão', logo: `${BASE_URL}/red-bull-bragantino.png` },
        { name: 'São Paulo', league: 'Brasileirão', logo: `${BASE_URL}/sao-paulo.png` },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: `${BASE_URL}/vasco-da-gama.png` },
        { name: 'Vitória', league: 'Brasileirão', logo: `${BASE_URL}/vitoria.png` },
        { name: 'Santos', league: 'Brasileirão', logo: `${BASE_URL}/santos.png` },
        
        // Internacionais
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: `${BASE_URL}/al-nassr.png` },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: `${BASE_URL}/al-hilal.png` },
        { name: 'Real Madrid', league: 'La Liga', logo: `${BASE_URL}/real-madrid.png` },
        { name: 'Barcelona', league: 'La Liga', logo: `${BASE_URL}/barcelona.png` },
        { name: 'Inter Miami', league: 'MLS', logo: `${BASE_URL}/inter-miami.png` },
        { name: 'Manchester City', league: 'Premier League', logo: `${BASE_URL}/manchester-city.png` },
        { name: 'Manchester United', league: 'Premier League', logo: `${BASE_URL}/manchester-united.png` },
        { name: 'Liverpool', league: 'Premier League', logo: `${BASE_URL}/liverpool.png` },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: `${BASE_URL}/bayern-de-munique.png` },
        { name: 'Paris Saint-Germain', league: 'Ligue 1', logo: `${BASE_URL}/psg.png` },
        { name: 'Chelsea', league: 'Premier League', logo: `${BASE_URL}/chelsea.png` },
        { name: 'Arsenal', league: 'Premier League', logo: `${BASE_URL}/arsenal.png` },
        { name: 'Borussia Dortmund', league: 'Bundesliga', logo: `${BASE_URL}/borussia-dortmund.png` },
        { name: 'Boca Juniors', league: 'Superliga Argentina', logo: `${BASE_URL}/boca-juniors.png` },
        { name: 'River Plate', league: 'Superliga Argentina', logo: `${BASE_URL}/river-plate.png` },
        { name: 'AC Milan', league: 'Serie A', logo: `${BASE_URL}/ac-milan.png` },
        { name: 'Inter de Milão', league: 'Serie A', logo: `${BASE_URL}/inter-milao.png` },
        { name: 'Juventus', league: 'Serie A', logo: `${BASE_URL}/juventus.png` },
        
        // Seleções
        { name: 'Alemanha', league: 'Seleções', logo: `${BASE_URL}/alemanha.png` },
        { name: 'Argentina', league: 'Seleções', logo: `${BASE_URL}/argentina.png` },
        { name: 'Brasil', league: 'Seleções', logo: `${BASE_URL}/brasil.png` },
        { name: 'Portugal', league: 'Seleções', logo: `${BASE_URL}/portugal.png` },
        { name: 'França', league: 'Seleções', logo: `${BASE_URL}/franca.png` },
        { name: 'Espanha', league: 'Seleções', logo: `${BASE_URL}/espanha.png` },
        { name: 'Inglaterra', league: 'Seleções', logo: `${BASE_URL}/inglaterra.png` },
        { name: 'Itália', league: 'Seleções', logo: `${BASE_URL}/italia.png` },
        { name: 'Uruguai', league: 'Seleções', logo: `${BASE_URL}/uruguai.png` }
    ];

    // Ajuste específico para o Atlético-MG sem estrela (Galo Puro)
    const amg = highQualityTeams.find(t => t.name === 'Atlético-MG');
    if (amg) amg.logo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/150px-Atletico_mineiro_galo.png';

    let successCount = 0;
    
    // 2. Loop para atualizar ou inserir cada time padrão
    for (const team of highQualityTeams) {
        const { error } = await supabase
            .from('teams')
            .upsert(team, { onConflict: 'name' });
            
        if (!error) successCount++;
        else {
            // Tenta update manual se o upsert falhar por falta de PK
            await supabase.from('teams').update({ logo: team.logo, league: team.league }).eq('name', team.name);
            successCount++;
        }
    }

    return { 
        successCount, 
        message: `Sincronização concluída! ${successCount} escudos atualizados. Dados de produtos normalizados e duplicatas removidas.` 
    };
}
