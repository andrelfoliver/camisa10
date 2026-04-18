import { supabase } from './supabase';
import { BR_2026_TEAMS } from '../data/teams';

/**
 * Migra os times do arquivo estático para a tabela 'teams' no Supabase.
 * Nota: Requer que a tabela 'teams' já tenha sido criada via SQL.
 */
export async function migrateTeamsToSupabase() {
    console.log('Iniciando migração de times...');
    
    // 1. Mapeamento de logos de alta qualidade (Cartola/Globo para BR e ESPN para Internacionais)
    const highQualityTeams = [
        // Brasileirão (Links oficiais do Cartola/Globo - S3)
        { name: 'Athletico-PR', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CAP/60x60.png' },
        { name: 'Atlético-GO', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/ACG/60x60.png' },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CAM/60x60.png' },
        { name: 'Bahia', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/BAH/60x60.png' },
        { name: 'Botafogo', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/BOT/60x60.png' },
        { name: 'Corinthians', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/COR/60x60.png' },
        { name: 'Coritiba', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CFC/60x60.png' },
        { name: 'Criciúma', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CRI/60x60.png' },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CRU/60x60.png' },
        { name: 'Cuiabá', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/CUI/60x60.png' },
        { name: 'Flamengo', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/FLA/60x60.png' },
        { name: 'Fluminense', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/FLU/60x60.png' },
        { name: 'Fortaleza', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/FOR/60x60.png' },
        { name: 'Grêmio', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/GRE/60x60.png' },
        { name: 'Internacional', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/INT/60x60.png' },
        { name: 'Juventude', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/JUV/60x60.png' },
        { name: 'Mirassol', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/MIR/60x60.png' },
        { name: 'Palmeiras', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/PAL/60x60.png' },
        { name: 'Red Bull Bragantino', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/RBB/60x60.png' },
        { name: 'São Paulo', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/SAO/60x60.png' },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/VAS/60x60.png' },
        { name: 'Vitória', league: 'Brasileirão', logo: 'https://s3.glbimg.com/v1/AUTH_58d78b787ec34892b5aaa0c7a146155f/clubes_2026/escudos/VIT/60x60.png' },
        
        // Internacionais (ESPN PNG - Muito estável)
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/2901.png' },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/2903.png' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/86.png' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/83.png' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/20232.png' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/382.png' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/360.png' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/364.png' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/132.png' },
        
        // Seleções (ESPN PNG)
        { name: 'Alemanha', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/481.png' },
        { name: 'Argentina', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/202.png' },
        { name: 'Brasil', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/205.png' },
        { name: 'Portugal', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/482.png' },
        { name: 'França', league: 'Seleções', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/478.png' }
    ];

    let successCount = 0;
    
    // 2. Loop para atualizar ou inserir cada time
    for (const team of highQualityTeams) {
        // Tentamos atualizar primeiro (Upsert por nome)
        const { data, error } = await supabase
            .from('teams')
            .upsert(team, { onConflict: 'name' })
            .select();
            
        if (!error) {
            successCount++;
        } else {
            // Se falhar o upsert por conflito (ou falta de índice único), tentamos update manual por nome
            const { error: updateError } = await supabase
                .from('teams')
                .update({ logo: team.logo, league: team.league })
                .eq('name', team.name);
                
            if (!updateError) {
                successCount++;
            } else {
                console.error(`Erro ao sincronizar ${team.name}:`, updateError.message);
            }
        }
    }

    return { successCount, message: `Sincronização concluída! ${successCount} escudos atualizados com sucesso.` };
}
