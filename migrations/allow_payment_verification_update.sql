-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele permite que o servidor de backend (API) consiga atualizar o status do pedido para 'paid' após o pagamento ser confirmado no Stripe, resolvendo a falha de segurança de RLS (Row Level Security).

DROP POLICY IF EXISTS "Permitir confirmacao de pagamento anonima" ON public.orders;

CREATE POLICY "Permitir confirmacao de pagamento anonima" 
ON public.orders 
FOR UPDATE 
USING (status = 'pending');
