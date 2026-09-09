-- ========================================================
-- SISTEMA DE CRÉDITOS EM LOJA / STORE CREDIT (CARTEIRA)
-- Execute este script no SQL Editor do Supabase
-- ========================================================

-- 1. Adicionar coluna de saldo de crédito na tabela profiles (se não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_credit NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Criar a tabela de movimentações de crédito (customer_credits)
CREATE TABLE IF NOT EXISTS public.customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL, -- Positivo (+) para entrada de crédito, Negativo (-) para débito/uso
    type TEXT NOT NULL DEFAULT 'defect_compensation', -- 'defect_compensation', 'manual_grant', 'order_redemption', 'refund'
    description TEXT NOT NULL,
    order_id TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_customer_credits_email ON public.customer_credits(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_credits_user_id ON public.customer_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_credits_created_at ON public.customer_credits(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
-- Permitir que o cliente consulte seus próprios créditos
DROP POLICY IF EXISTS "Permitir leitura dos proprios creditos" ON public.customer_credits;
CREATE POLICY "Permitir leitura dos proprios creditos"
ON public.customer_credits FOR SELECT
USING (
    customer_email = auth.jwt() ->> 'email' 
    OR user_id = auth.uid()
    OR auth.role() = 'authenticated'
);

-- Permitir inserção para usuários autenticados e checkout
DROP POLICY IF EXISTS "Permitir insercao de creditos" ON public.customer_credits;
CREATE POLICY "Permitir insercao de creditos"
ON public.customer_credits FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Permitir leitura pública/anon para checkout com e-mail do cliente
DROP POLICY IF EXISTS "Permitir leitura anon para checkout" ON public.customer_credits;
CREATE POLICY "Permitir leitura anon para checkout"
ON public.customer_credits FOR SELECT
TO anon
USING (true);
