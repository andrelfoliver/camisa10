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
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/2901.png' },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/2903.png' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/86.png' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/83.png' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/20232.png' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/382.png' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/360.png' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/364.png' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/132.png' },
        
        // Seleções
        { name: 'Alemanha', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/481.png' },
        { name: 'Argentina', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/202.png' },
        { name: 'Brasil', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/205.png' },
        { name: 'Portugal', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/482.png' },
        { name: 'França', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/478.png' }
    ];

    const existingNames = new Set((existingTeams || []).map(t => t.name.toLowerCase()));
    
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
