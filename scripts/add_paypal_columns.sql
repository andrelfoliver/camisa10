-- SQL para adicionar suporte a pagamentos via PayPal na tabela de orders
-- Execute este script no SQL Editor do seu painel Supabase

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Comentários opcionais para documentação
COMMENT ON COLUMN public.orders.payment_method IS 'Método de pagamento utilizado (whatsapp ou paypal)';
COMMENT ON COLUMN public.orders.payment_id IS 'ID da transação gerado pelo PayPal';
COMMENT ON COLUMN public.orders.paid_at IS 'Data e hora em que o pagamento foi confirmado';
