-- ========================================================
-- REGRAS AVANÇADAS DE CRÉDITO EM LOJA / STORE CREDIT
-- Execute este script no SQL Editor do Supabase
-- ========================================================

-- 1. Adicionar colunas de validade e pedido mínimo na tabela customer_credits
ALTER TABLE public.customer_credits 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10, 2) DEFAULT 75.00,
ADD COLUMN IF NOT EXISTS is_cumulative BOOLEAN DEFAULT false;

-- 2. Índice para consultas com filtro de validade
CREATE INDEX IF NOT EXISTS idx_customer_credits_expires_at ON public.customer_credits(expires_at);
