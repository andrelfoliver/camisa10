-- Rode este script no painel SQL Editor do Supabase ou no seu terminal Postgres

CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 109.99,
    category TEXT DEFAULT 'Catálogo',
    description TEXT DEFAULT 'Manto premium do catálogo oficial.',
    image TEXT NOT NULL,
    original_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar segurança em nível de linha (Para que ninguém da rua Delete seus produtos)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Criar política onde qualquer um pode VISUALIZAR as camisas na Home
CREATE POLICY "Permitir leitura publica" ON public.products FOR SELECT USING (true);
