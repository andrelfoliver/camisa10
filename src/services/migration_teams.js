import { supabase } from './supabase';
import { BR_2026_TEAMS } from '../data/teams';

/**
 * Migra os times do arquivo estático para a tabela 'teams' no Supabase.
 * Nota: Requer que a tabela 'teams' já tenha sido criada via SQL.
 */
export async function migrateTeamsToSupabase() {
    console.log('Iniciando migração de times...');
    
    // 1. Mapeamento de logos de alta qualidade (Cartola/Globo para BR e Wikimedia PNG Thumbnails para Internacionais)
    const highQualityTeams = [
        // Brasileirão (Links oficiais e estáveis do Cartola FC SDE)
        { name: 'Athletico-PR', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2018/12/11/atletico-pr_60x60.png' },
        { name: 'Atlético-GO', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2020/07/02/atletico-go_60x60.png' },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/atletico_mg_60x60.png' },
        { name: 'Bahia', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/bahia_60x60.png' },
        { name: 'Botafogo', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/botafogo_60x60.png' },
        { name: 'Corinthians', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/corinthians_60x60.png' },
        { name: 'Coritiba', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/coritiba_60x60.png' },
        { name: 'Criciúma', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/criciuma_60x60.png' },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2015/04/29/cruzeiro_60x60.png' },
        { name: 'Cuiabá', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/cuiaba_60x60.png' },
        { name: 'Flamengo', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2018/03/10/flamengo_60x60.png' },
        { name: 'Fluminense', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/fluminense_60x60.png' },
        { name: 'Fortaleza', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2018/03/10/fortaleza_60x60.png' },
        { name: 'Grêmio', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/gremio_60x60.png' },
        { name: 'Internacional', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2016/05/03/internacional_60x60.png' },
        { name: 'Juventude', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/juventude_60x60.png' },
        { name: 'Mirassol', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/mirassol_60x60.png' },
        { name: 'Palmeiras', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/palmeiras_60x60.png' },
        { name: 'Red Bull Bragantino', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2020/01/17/bragantino_60x60.png' },
        { name: 'São Paulo', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/sao_paulo_60x60.png' },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/vasco_60x60.png' },
        { name: 'Vitória', league: 'Brasileirão', logo: 'https://s.glbimg.com/es/sde/f/equipes/2014/04/14/vitoria_60x60.png' },
        
        // Internacionais & Seleções (Wikimedia PNG Thumbnails - Estabilidade Máxima)
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Al_Nassr_FC_logo.svg/200px-Al_Nassr_FC_logo.svg.png' },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Al-Hilal_Saudi_FC_logo.svg/200px-Al_Hilal_Saudi_FC_logo.svg.png' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Inter_Miami_CF_logo.svg/200px-Inter_Miami_CF_logo.svg.png' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/200px-Liverpool_FC.svg.png' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
        { name: 'Alemanha', league: 'Seleções', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/Germany_national_football_team_crest.svg/200px-Germany_national_football_team_crest.svg.png' },
        { name: 'Argentina', league: 'Seleções', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Argentina_national_football_team_crest.svg/200px-Argentina_national_football_team_crest.svg.png' },
        { name: 'Brasil', league: 'Seleções', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Brazil_national_football_team_crest.svg/200px-Brazil_national_football_team_crest.svg.png' },
        { name: 'Portugal', league: 'Seleções', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Portuguese_Football_Federation.svg/200px-Portuguese_Football_Federation.svg.png' },
        { name: 'França', league: 'Seleções', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/France_national_football_team_crest.svg/200px-France_national_football_team_crest.svg.png' }
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
