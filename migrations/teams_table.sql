-- Tabela para gestão dinâmica de clubes e escudos
CREATE TABLE IF NOT EXISTS public.teams (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de times" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Permitir que admins gerenciem times" ON public.teams ALL USING (true);

-- Inserir os times base (se não existirem)
INSERT INTO public.teams (name, logo)
VALUES 
('Athletico-PR', 'https://upload.wikimedia.org/wikipedia/pt/c/c7/Club_Athletico_Paranaense.png'),
('Atlético-GO', 'https://upload.wikimedia.org/wikipedia/pt/a/aa/Atletico_goianiense_2020.png'),
('Atlético-MG', 'https://upload.wikimedia.org/wikipedia/pt/f/f4/Atletico_mineiro_galo.png'),
('Bahia', 'https://upload.wikimedia.org/wikipedia/pt/4/46/Logo_do_Esporte_Clube_Bahia.svg'),
('Botafogo', 'https://upload.wikimedia.org/wikipedia/pt/f/f2/Botafogo_de_Futebol_e_Regatas_logo.svg'),
('Corinthians', 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.svg'),
('Coritiba', 'https://upload.wikimedia.org/wikipedia/pt/1/1b/Coritiba_Foot_Ball_Club_logo.svg'),
('Criciúma', 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Crici%C3%BAma_Esporte_Clube_logo.svg'),
('Cruzeiro', 'https://upload.wikimedia.org/wikipedia/pt/3/37/Cruzeiro_Esporte_Clube_%28logo%29.svg'),
('Cuiabá', 'https://upload.wikimedia.org/wikipedia/pt/c/cb/Cuiab%C3%A1_Esporte_Clube.svg'),
('Flamengo', 'https://upload.wikimedia.org/wikipedia/pt/2/2e/Flamengo_braz_logo.svg'),
('Fluminense', 'https://upload.wikimedia.org/wikipedia/pt/1/15/Fluminense_fc_logo.svg'),
('Fortaleza', 'https://upload.wikimedia.org/wikipedia/pt/b/bd/Fortaleza_Esporte_Clube_logo.svg'),
('Grêmio', 'https://upload.wikimedia.org/wikipedia/pt/f/f5/Gremio_logo.svg'),
('Internacional', 'https://upload.wikimedia.org/wikipedia/pt/1/14/Internacional_de_Porto_Alegre_logo.svg'),
('Juventude', 'https://upload.wikimedia.org/wikipedia/pt/0/08/Esporte_Clube_Juventude_%28logo%29.svg'),
('Mirassol', 'https://upload.wikimedia.org/wikipedia/pt/d/d5/Mirassol_FC.svg'),
('Palmeiras', 'https://upload.wikimedia.org/wikipedia/pt/1/10/Palmeiras_logo.svg'),
('Red Bull Bragantino', 'https://upload.wikimedia.org/wikipedia/pt/c/c4/Red_Bull_Bragantino_logo.svg'),
('São Paulo', 'https://upload.wikimedia.org/wikipedia/pt/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg'),
('Vasco da Gama', 'https://upload.wikimedia.org/wikipedia/pt/c/c9/Vasco_da_Gama_Cruz_de_Malta.svg'),
('Vitória', 'https://upload.wikimedia.org/wikipedia/pt/1/12/Esporte_Clube_Vit%C3%B3ria.svg')
ON CONFLICT (name) DO NOTHING;
