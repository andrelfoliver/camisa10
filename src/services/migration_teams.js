import { supabase } from './supabase';
import { BR_2026_TEAMS } from '../data/teams';

/**
 * Migra os times do arquivo estático para a tabela 'teams' no Supabase.
 * Nota: Requer que a tabela 'teams' já tenha sido criada via SQL.
 */
export async function migrateTeamsToSupabase() {
    console.log('Iniciando migração de times...');
    
    // Buscamos os nomes dos times já existentes
    const { data: existingTeams, error: fetchError } = await supabase
        .from('teams')
        .select('name');
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found' / empty
        throw new Error('Erro ao verificar times existentes: ' + fetchError.message);
    }

    const existingNames = new Set((existingTeams || []).map(t => t.name.toLowerCase()));
    
    // Filtramos apenas os que NÃO estão no banco ainda
    const teamsToInsert = highQualityTeams.filter(t => !existingNames.has(t.name.toLowerCase()));

    if (teamsToInsert.length === 0) {
        return { successCount: 0, message: 'Todos os times da lista já estão no banco de dados.' };
    }

    // Mapeamento de logos de alta qualidade (Wikipedia/Wikimedia)
    const highQualityTeams = [
        // Brasileirão
        { name: 'Athletico-PR', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c7/Club_Athletico_Paranaense.png' },
        { name: 'Atlético-GO', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/aa/Atletico_goianiense_2020.png' },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f4/Atletico_mineiro_galo.png' },
        { name: 'Bahia', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/4/46/Logo_do_Esporte_Clube_Bahia.svg' },
        { name: 'Botafogo', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f2/Botafogo_de_Futebol_e_Regatas_logo.svg' },
        { name: 'Corinthians', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.svg' },
        { name: 'Coritiba', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/1b/Coritiba_Foot_Ball_Club_logo.svg' },
        { name: 'Criciúma', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Crici%C3%BAma_Esporte_Clube_logo.svg' },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/3/37/Cruzeiro_Esporte_Clube_%28logo%29.svg' },
        { name: 'Cuiabá', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/cb/Cuiab%C3%A1_Esporte_Clube.svg' },
        { name: 'Flamengo', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2e/Flamengo_braz_logo.svg' },
        { name: 'Fluminense', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/15/Fluminense_fc_logo.svg' },
        { name: 'Fortaleza', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/bd/Fortaleza_Esporte_Clube_logo.svg' },
        { name: 'Grêmio', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f5/Gremio_logo.svg' },
        { name: 'Internacional', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/14/Internacional_de_Porto_Alegre_logo.svg' },
        { name: 'Juventude', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/0/08/Esporte_Clube_Juventude_%28logo%29.svg' },
        { name: 'Mirassol', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/d/d5/Mirassol_FC.svg' },
        { name: 'Palmeiras', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/10/Palmeiras_logo.svg' },
        { name: 'Red Bull Bragantino', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c4/Red_Bull_Bragantino_logo.svg' },
        { name: 'São Paulo', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg' },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c9/Vasco_da_Gama_Cruz_de_Malta.svg' },
        { name: 'Vitória', league: 'Brasileirão', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/12/Esporte_Clube_Vit%C3%B3ria.svg' },
        
        // Internacionais & Saudi
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: 'https://upload.wikimedia.org/wikipedia/en/3/30/Al-Nassr_FC_logo.svg' },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al-Hilal_Saudi_FC_logo.svg' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Inter_Miami_CF_logo.svg' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/en/1/1b/FC_Bayern_München_logo_%282017%29.svg' }
    ];

    // Filtramos apenas os que NÃO estão no banco ainda
    const teamsToInsert = highQualityTeams.filter(t => !existingNames.has(t.name.toLowerCase()));

    if (teamsToInsert.length === 0) {
        return { successCount: 0, message: 'Todos os times da lista já estão no banco de dados.' };
    }

    const { data, error } = await supabase
        .from('teams')
        .insert(teamsToInsert);

    if (error) {
        throw new Error('Erro ao inserir times: ' + error.message);
    }

    return { successCount: teamsToInsert.length, message: `${teamsToInsert.length} novos times migrados com sucesso!` };
}
