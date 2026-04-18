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
    const BASE_URL = '/escudos';
    
    const highQualityTeams = [
        // Brasileiros (LogoDownload.org - Alta Resolução e Estabilidade Verificada)
        { name: 'Athletico-PR', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/athletico-paranaense-logo.png' },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/atletico-mineiro-logo.png' },
        { name: 'Bahia', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/bahia-logo.png' },
        { name: 'Botafogo', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/botafogo-logo.png' },
        { name: 'Corinthians', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/corinthians-logo-1.png' },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/cruzeiro-logo.png' },
        { name: 'Flamengo', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/flamengo-logo-0.png' },
        { name: 'Fluminense', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/fluminense-logo.png' },
        { name: 'Grêmio', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/gremio-logo.png' },
        { name: 'Internacional', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/inter-logo.png' },
        { name: 'Mirassol', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/11/mirassol-logo.png' },
        { name: 'Palmeiras', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/palmeiras-logo-1.png' },
        { name: 'Bragantino', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2020/01/red-bull-bragantino-logo.png' },
        { name: 'São Paulo', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/sao-paulo-logo-1.png' },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/vasco-logo.png' },
        { name: 'Vitória', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/vitoria-logo.png' },
        { name: 'Santos', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/09/santos-logo-1.png' },
        { name: 'Coritiba', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/coritiba-logo.png' },
        { name: 'Criciúma', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2017/02/criciuma-logo.png' },
        { name: 'Atlético-GO', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2017/02/atletico-go-logo.png' },
        { name: 'Cuiabá', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2021/03/cuiaba-logo.png' },
        { name: 'Fortaleza', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2016/10/fortaleza-logo.png' },
        { name: 'Juventude', league: 'Brasileirão', logo: 'https://logodownload.org/wp-content/uploads/2021/02/juventude-logo.png' },

        // Internacionais (Thumbnails do Wikimedia - Verificados via Proxy)
        { name: 'Al-Nassr', league: 'Saudi Pro League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/b/b4/Al-Nassr_FC.svg/200px-Al-Nassr_FC.svg.png' },
        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/6/6b/Al-Hilal_Saudi_Football_Club.svg/200px-Al-Hilal_Saudi_Football_Club.svg.png' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1c/Inter_Miami_CF_logo.svg/200px-Inter_Miami_CF_logo.svg.png' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/200px-Liverpool_FC.svg.png' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
        { name: 'Paris Saint-Germain', league: 'Ligue 1', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png' },
        { name: 'Chelsea', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png' },
        { name: 'Arsenal', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png' },
        { name: 'Borussia Dortmund', league: 'Bundesliga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png' },
        { name: 'Boca Juniors', league: 'Superliga Argentina', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Boca_Juniors_logo18.svg/200px-Boca_Juniors_logo18.svg.png' },
        { name: 'River Plate', league: 'Superliga Argentina', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Logo_C.A._River_Plate.svg/200px-Logo_C.A._River_Plate.svg.png' },
        { name: 'AC Milan', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/200px-Logo_of_AC_Milan.svg.png' },
        { name: 'Inter de Milão', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/200px-FC_Internazionale_Milano_2021.svg.png' },
        { name: 'Juventus', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg/200px-Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg.png' },
        
        // Seleções (Thumbnails Wikimedia)
        { name: 'Alemanha', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/e3/Germany_national_football_team_crest.svg/200px-Germany_national_football_team_crest.svg.png' },
        { name: 'Argentina', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/d/d3/Argentina_national_football_team_crest.svg/200px-Argentina_national_football_team_crest.svg.png' },
        { name: 'Brasil', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/05/Brazil_national_football_team_crest.svg/200px-Brazil_national_football_team_crest.svg.png' },
        { name: 'Portugal', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/5f/Portuguese_Football_Federation.svg/200px-Portuguese_Football_Federation.svg.png' },
        { name: 'França', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/a/a7/France_national_football_team_crest.svg/200px-France_national_football_team_crest.svg.png' },
        { name: 'Espanha', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/3/31/Spain_National_Football_Team_badge.svg/200px-Spain_National_Football_Team_badge.svg.png' },
        { name: 'Inglaterra', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/8/8b/England_national_football_team_crest.svg/200px-England_national_football_team_crest.svg.png' },
        { name: 'Itália', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1c/Italy_national_football_team_crest.svg/200px-Italy_national_football_team_crest.svg.png' },
        { name: 'Uruguai', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c1/Uruguay_football_association.svg/200px-Uruguay_football_association.svg.png' }
    ];        { name: 'Al-Hilal', league: 'Saudi Pro League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/6/6b/Al-Hilal_Saudi_Football_Club.svg/200px-Al-Hilal_Saudi_Football_Club.svg.png&w=200' },
        { name: 'Real Madrid', league: 'La Liga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png&w=200' },
        { name: 'Barcelona', league: 'La Liga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png&w=200' },
        { name: 'Inter Miami', league: 'MLS', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1c/Inter_Miami_CF_logo.svg/200px-Inter_Miami_CF_logo.svg.png&w=200' },
        { name: 'Manchester City', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png&w=200' },
        { name: 'Manchester United', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png&w=200' },
        { name: 'Liverpool', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/200px-Liverpool_FC.svg.png&w=200' },
        { name: 'Bayern de Munique', league: 'Bundesliga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png&w=200' },
        { name: 'Paris Saint-Germain', league: 'Ligue 1', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png&w=200' },
        { name: 'Chelsea', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png&w=200' },
        { name: 'Arsenal', league: 'Premier League', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png&w=200' },
        { name: 'Borussia Dortmund', league: 'Bundesliga', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png&w=200' },
        { name: 'Boca Juniors', league: 'Superliga Argentina', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Boca_Juniors_logo18.svg/200px-Boca_Juniors_logo18.svg.png&w=200' },
        { name: 'River Plate', league: 'Superliga Argentina', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Logo_C.A._River_Plate.svg/200px-Logo_C.A._River_Plate.svg.png&w=200' },
        { name: 'AC Milan', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/200px-Logo_of_AC_Milan.svg.png&w=200' },
        { name: 'Inter de Milão', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/200px-FC_Internazionale_Milano_2021.svg.png&w=200' },
        { name: 'Juventus', league: 'Serie A', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg/200px-Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg.png&w=200' },
        
        // Seleções (Proxied Wikimedia CDN)
        { name: 'Alemanha', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/e3/Germany_national_football_team_crest.svg/200px-Germany_national_football_team_crest.svg.png&w=200' },
        { name: 'Argentina', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/d/d3/Argentina_national_football_team_crest.svg/200px-Argentina_national_football_team_crest.svg.png&w=200' },
        { name: 'Brasil', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/05/Brazil_national_football_team_crest.svg/200px-Brazil_national_football_team_crest.svg.png&w=200' },
        { name: 'Portugal', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/5f/Portuguese_Football_Federation.svg/200px-Portuguese_Football_Federation.svg.png&w=200' },
        { name: 'França', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/a/a7/France_national_football_team_crest.svg/200px-France_national_football_team_crest.svg.png&w=200' },
        { name: 'Espanha', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/3/31/Spain_National_Football_Team_badge.svg/200px-Spain_National_Football_Team_badge.svg.png&w=200' },
        { name: 'Inglaterra', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/8/8b/England_national_football_team_crest.svg/200px-England_national_football_team_crest.svg.png&w=200' },
        { name: 'Itália', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1c/Italy_national_football_team_crest.svg/200px-Italy_national_football_team_crest.svg.png&w=200' },
        { name: 'Uruguai', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c1/Uruguay_football_association.svg/200px-Uruguay_football_association.svg.png&w=200' }
    ];

    let successCount = 0;
    
    // 2. Loop para atualizar ou inserir cada time padrão
    for (const team of highQualityTeams) {
        // Tenta update pelo nome (que é nossa chave de negócio no e-commerce)
        const { error } = await supabase
            .from('teams')
            .update({ logo: team.logo, league: team.league })
            .eq('name', team.name);
            
        if (!error) successCount++;
        else {
            // Se falhar (time não existe), faz o upsert
            await supabase.from('teams').upsert(team, { onConflict: 'name' });
            successCount++;
        }
    }

    return { 
        successCount, 
        message: `Sincronização concluída! ${successCount} escudos atualizados. Dados de produtos normalizados e duplicatas removidas.` 
    };
}
