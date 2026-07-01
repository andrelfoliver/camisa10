-- ========================================================
-- POLÍTICAS DE SEGURANÇA (RLS) PARA A TABELA DE CUPONS (coupons)
-- Execute este script no SQL Editor do seu painel Supabase
-- ========================================================

-- 1. Garantir que a segurança RLS está habilitada na tabela
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas de cupons se existirem para evitar conflitos
DROP POLICY IF EXISTS "Permitir leitura pública de cupons" ON public.coupons;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.coupons;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.coupons;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON public.coupons;
DROP POLICY IF EXISTS "Allow public read" ON public.coupons;
DROP POLICY IF EXISTS "Allow admin delete" ON public.coupons;

-- 3. Permitir leitura (SELECT) pública para que o checkout consiga validar cupons
CREATE POLICY "Permitir leitura pública de cupons"
ON public.coupons FOR SELECT
USING (true);

-- 4. Permitir criação (INSERT) para administradores autenticados
CREATE POLICY "Permitir inserção para usuários autenticados"
ON public.coupons FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Permitir edição (UPDATE) para administradores autenticados
CREATE POLICY "Permitir atualização para usuários autenticados"
ON public.coupons FOR UPDATE
TO authenticated
USING (true);

-- 6. Permitir exclusão (DELETE) para administradores autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados"
ON public.coupons FOR DELETE
TO authenticated
USING (true);
