-- SQL para adicionar suporte a Pré-Venda / Lançamento ("Em Breve")
-- Execute este script no SQL Editor do seu painel Supabase

-- 1. Adiciona a coluna coming_soon na tabela de produtos se não existir
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN DEFAULT false;

-- 2. Cria a tabela de registro de interesse (pre_orders / product_interests)
CREATE TABLE IF NOT EXISTS public.product_interests (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    size TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ativa a segurança em nível de linha (RLS) na nova tabela
ALTER TABLE public.product_interests ENABLE ROW LEVEL SECURITY;

-- 4. Cria as políticas de segurança (Policies) para permitir operações
-- Permitir que qualquer visitante insira seu interesse no site
CREATE POLICY "Permitir inserção pública de interesses" 
ON public.product_interests FOR INSERT 
WITH CHECK (true);

-- Permitir leitura pública/admin
CREATE POLICY "Permitir leitura pública de interesses" 
ON public.product_interests FOR SELECT 
USING (true);

-- Permitir exclusão (para limpeza pelo painel admin)
CREATE POLICY "Permitir exclusão de interesses" 
ON public.product_interests FOR DELETE 
USING (true);
