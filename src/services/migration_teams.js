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
    
    const STORAGE_BASE = 'https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/team-logos';
    
    const highQualityTeams = [
        // Brasileiros (Supabase Storage - Oficiais e Permanentes)
        { name: 'Athletico-PR', league: 'Brasileirão', logo: `${STORAGE_BASE}/Athletico%20Paranaense.png` },
        { name: 'Atlético-MG', league: 'Brasileirão', logo: `${STORAGE_BASE}/Atletico%20Mineiro.png` },
        { name: 'Bahia', league: 'Brasileirão', logo: `${STORAGE_BASE}/Bahia.png` },
        { name: 'Botafogo', league: 'Brasileirão', logo: `${STORAGE_BASE}/Botafogo.png` },
        { name: 'Corinthians', league: 'Brasileirão', logo: `${STORAGE_BASE}/Corinthians.png` },
        { name: 'Cruzeiro', league: 'Brasileirão', logo: `${STORAGE_BASE}/Cruzeiro.png` },
        { name: 'Flamengo', league: 'Brasileirão', logo: `${STORAGE_BASE}/Flamengo.png` },
        { name: 'Fluminense', league: 'Brasileirão', logo: `${STORAGE_BASE}/Fluminense.png` },
        { name: 'Grêmio', league: 'Brasileirão', logo: `${STORAGE_BASE}/Gremio.png` },
        { name: 'Internacional', league: 'Brasileirão', logo: `${STORAGE_BASE}/Internacional.png` },
        { name: 'Mirassol', league: 'Brasileirão', logo: `${STORAGE_BASE}/Mirassol-SP.png` },
        { name: 'Palmeiras', league: 'Brasileirão', logo: `${STORAGE_BASE}/Palmeiras.png` },
        { name: 'Bragantino', league: 'Brasileirão', logo: `${STORAGE_BASE}/Red%20Bull%20Bragantino.png` },
        { name: 'São Paulo', league: 'Brasileirão', logo: `${STORAGE_BASE}/Sao%20Paulo.png` },
        { name: 'Vasco da Gama', league: 'Brasileirão', logo: `${STORAGE_BASE}/Vasco%20da%20Gama.png` },
        { name: 'Vitória', league: 'Brasileirão', logo: `${STORAGE_BASE}/Vitoria.png` },
        { name: 'Santos', league: 'Brasileirão', logo: `${STORAGE_BASE}/Santos.png` },

        // Brasileiros (LogoDownload URL de backup para times que faltam no bucket)
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
        { name: 'Uruguai', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c1/Uruguay_football_association.svg/200px-Uruguay_football_association.svg.png' },
        { name: 'Colômbia', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/e9/FCF-Logo-2023.svg/200px-FCF-Logo-2023.svg.png' },
        { name: 'Holanda', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/7/78/Netherlands_national_football_team_crest.svg/200px-Netherlands_national_football_team_crest.svg.png' },
        { name: 'Bélgica', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/e5/Royal_Belgian_FA_logo.svg/200px-Royal_Belgian_FA_logo.svg.png' },
        { name: 'Japão', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/8/8d/Japan_national_football_team_crest.svg/200px-Japan_national_football_team_crest.svg.png' },
        { name: 'Croácia', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/e/e5/Croatia_national_football_team_crest.svg/200px-Croatia_national_football_team_crest.svg.png' },
        { name: 'Marrocos', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Morocco_national_football_team_crest.svg/200px-Morocco_national_football_team_crest.svg.png' },
        { name: 'Estados Unidos', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/86/U.S._Soccer_federation_logo.svg/200px-U.S._Soccer_federation_logo.svg.png' },
        { name: 'Canadá', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/b/b3/Canada_Soccer_logo.svg/200px-Canada_Soccer_logo.svg.png' },
        { name: 'México', league: 'Seleções', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Mexico_national_football_team_crest_2021.svg/200px-Mexico_national_football_team_crest_2021.svg.png' },

        // NBA (Thumbnails Wikimedia via proxy)
        { name: 'Atlanta Hawks', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/2/24/Atlanta_Hawks_logo.svg/200px-Atlanta_Hawks_logo.svg.png' },
        { name: 'Boston Celtics', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/200px-Boston_Celtics.svg.png' },
        { name: 'Brooklyn Nets', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/44/Brooklyn_Nets_newlogo.svg/200px-Brooklyn_Nets_newlogo.svg.png' },
        { name: 'Charlotte Hornets', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c4/Charlotte_Hornets_%282014%29.svg/200px-Charlotte_Hornets_%282014%29.svg.png' },
        { name: 'Chicago Bulls', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/6/67/Chicago_Bulls_logo.svg/200px-Chicago_Bulls_logo.svg.png' },
        { name: 'Cleveland Cavaliers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cleveland_Cavaliers_logo.svg/200px-Cleveland_Cavaliers_logo.svg.png' },
        { name: 'Dallas Mavericks', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/9/97/Dallas_Mavericks_logo.svg/200px-Dallas_Mavericks_logo.svg.png' },
        { name: 'Denver Nuggets', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/7/76/Denver_Nuggets.svg/200px-Denver_Nuggets.svg.png' },
        { name: 'Detroit Pistons', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Detroit_Pistons_logo.svg/200px-Detroit_Pistons_logo.svg.png' },
        { name: 'Golden State Warriors', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/200px-Golden_State_Warriors_logo.svg.png' },
        { name: 'Houston Rockets', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/2/28/Houston_Rockets.svg/200px-Houston_Rockets.svg.png' },
        { name: 'Indiana Pacers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1b/Indiana_Pacers.svg/200px-Indiana_Pacers.svg.png' },
        { name: 'Los Angeles Clippers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Los_Angeles_Clippers_logo_2024.svg/200px-Los_Angeles_Clippers_logo_2024.svg.png' },
        { name: 'Los Angeles Lakers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/200px-Los_Angeles_Lakers_logo.svg.png' },
        { name: 'Memphis Grizzlies', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/f/f1/Memphis_Grizzlies.svg/200px-Memphis_Grizzlies.svg.png' },
        { name: 'Miami Heat', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/1c/Miami_Heat_logo.svg/200px-Miami_Heat_logo.svg.png' },
        { name: 'Milwaukee Bucks', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/4/4a/Milwaukee_Bucks_logo.svg/200px-Milwaukee_Bucks_logo.svg.png' },
        { name: 'Minnesota Timberwolves', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c2/Minnesota_Timberwolves_logo.svg/200px-Minnesota_Timberwolves_logo.svg.png' },
        { name: 'New Orleans Pelicans', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/11/New_Orleans_Pelicans.svg/200px-New_Orleans_Pelicans.svg.png' },
        { name: 'New York Knicks', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/2/25/New_York_Knicks_logo.svg/200px-New_York_Knicks_logo.svg.png' },
        { name: 'Oklahoma City Thunder', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/5/5d/Oklahoma_City_Thunder.svg/200px-Oklahoma_City_Thunder.svg.png' },
        { name: 'Orlando Magic', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/10/Orlando_Magic_logo.svg/200px-Orlando_Magic_logo.svg.png' },
        { name: 'Philadelphia 76ers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/0e/Philadelphia_76ers_logo.svg/200px-Philadelphia_76ers_logo.svg.png' },
        { name: 'Phoenix Suns', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c4/Phoenix_Suns_logo.svg/200px-Phoenix_Suns_logo.svg.png' },
        { name: 'Portland Trail Blazers', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/2/21/Portland_Trail_Blazers_logo.svg/200px-Portland_Trail_Blazers_logo.svg.png' },
        { name: 'Sacramento Kings', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/c/c7/Sacramento_Kings_logo.svg/200px-Sacramento_Kings_logo.svg.png' },
        { name: 'San Antonio Spurs', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/a/a4/San_Antonio_Spurs.svg/200px-San_Antonio_Spurs.svg.png' },
        { name: 'Toronto Raptors', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/3/36/Toronto_Raptors_logo.svg/200px-Toronto_Raptors_logo.svg.png' },
        { name: 'Utah Jazz', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Utah_Jazz_primary_logo_2022-present.svg/200px-Utah_Jazz_primary_logo_2022-present.svg.png' },
        { name: 'Washington Wizards', league: 'NBA', logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/0/02/Washington_Wizards_logo.svg/200px-Washington_Wizards_logo.svg.png' }
    ];

    let successCount = 0;
    
    // 1. Buscar times já existentes no banco de dados para evitar sobrescrever customizações do usuário
    const { data: existingTeams } = await supabase.from('teams').select('name, logo');
    const existingMap = new Map(existingTeams?.map(t => [t.name, t.logo]) || []);

    // 2. Loop para atualizar ou inserir cada time padrão
    for (const team of highQualityTeams) {
        if (existingMap.has(team.name)) {
            const currentLogo = existingMap.get(team.name);
            // Só atualiza se o logo atual estiver vazio, nulo ou for um placeholder genérico
            const isPlaceholder = !currentLogo || currentLogo.includes('placeholder') || currentLogo === '';
            
            if (isPlaceholder) {
                const { error } = await supabase
                    .from('teams')
                    .update({ logo: team.logo, league: team.league })
                    .eq('name', team.name);
                if (!error) successCount++;
            } else {
                // Já possui um escudo customizado, preservamos a escolha do usuário
                successCount++;
            }
        } else {
            // Time novo (como os da NBA), insere no banco
            const { error } = await supabase.from('teams').insert(team);
            if (!error) successCount++;
        }
    }

    return { 
        successCount, 
        message: `Sincronização concluída! ${successCount} escudos processados. Times novos adicionados e customizações de logos preservadas.` 
    };
}
