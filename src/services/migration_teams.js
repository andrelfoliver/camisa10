import { supabase } from './supabase';
import { BR_2026_TEAMS } from '../data/teams';

/**
 * Migra os times do arquivo estático para a tabela 'teams' no Supabase.
 * Nota: Requer que a tabela 'teams' já tenha sido criada via SQL.
 */
export async function migrateTeamsToSupabase() {
    console.log('Iniciando migração de times...');
    
    // Verificamos se já existem times para não duplicar
    const { count, error: countError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        throw new Error('Certifique-se de criar a tabela "teams" no SQL do Supabase primeiro: ' + countError.message);
    }

    if (count > 0) {
        return { successCount: 0, message: 'Os times já estão no banco de dados.' };
    }

    // Mapeamento de logos de alta qualidade (Wikipedia/Wikimedia)
    const highQualityTeams = [
        { name: 'Athletico-PR', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c7/Club_Athletico_Paranaense.png' },
        { name: 'Atlético-GO', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/aa/Atletico_goianiense_2020.png' },
        { name: 'Atlético-MG', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f4/Atletico_mineiro_galo.png' },
        { name: 'Bahia', logo: 'https://upload.wikimedia.org/wikipedia/pt/4/46/Logo_do_Esporte_Clube_Bahia.svg' },
        { name: 'Botafogo', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f2/Botafogo_de_Futebol_e_Regatas_logo.svg' },
        { name: 'Corinthians', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.svg' },
        { name: 'Coritiba', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/1b/Coritiba_Foot_Ball_Club_logo.svg' },
        { name: 'Criciúma', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Crici%C3%BAma_Esporte_Clube_logo.svg' },
        { name: 'Cruzeiro', logo: 'https://upload.wikimedia.org/wikipedia/pt/3/37/Cruzeiro_Esporte_Clube_%28logo%29.svg' },
        { name: 'Cuiabá', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/cb/Cuiab%C3%A1_Esporte_Clube.svg' },
        { name: 'Flamengo', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2e/Flamengo_braz_logo.svg' },
        { name: 'Fluminense', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/15/Fluminense_fc_logo.svg' },
        { name: 'Fortaleza', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/bd/Fortaleza_Esporte_Clube_logo.svg' },
        { name: 'Grêmio', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f5/Gremio_logo.svg' },
        { name: 'Internacional', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/14/Internacional_de_Porto_Alegre_logo.svg' },
        { name: 'Juventude', logo: 'https://upload.wikimedia.org/wikipedia/pt/0/08/Esporte_Clube_Juventude_%28logo%29.svg' },
        { name: 'Mirassol', logo: 'https://upload.wikimedia.org/wikipedia/pt/d/d5/Mirassol_FC.svg' },
        { name: 'Palmeiras', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/10/Palmeiras_logo.svg' },
        { name: 'Red Bull Bragantino', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c4/Red_Bull_Bragantino_logo.svg' },
        { name: 'São Paulo', logo: 'https://upload.wikimedia.org/wikipedia/pt/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg' },
        { name: 'Vasco da Gama', logo: 'https://upload.wikimedia.org/wikipedia/pt/c/c9/Vasco_da_Gama_Cruz_de_Malta.svg' },
        { name: 'Vitória', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/12/Esporte_Clube_Vit%C3%B3ria.svg' }
    ];

    const { data, error } = await supabase
        .from('teams')
        .insert(highQualityTeams);

    if (error) {
        throw new Error('Erro ao inserir times: ' + error.message);
    }

    return { successCount: highQualityTeams.length, message: 'Times migrados com sucesso!' };
}
