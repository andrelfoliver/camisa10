-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele permite que usuários não logados (guests) consigam criar pedidos na tabela "orders",
-- corrigindo o erro RLS (Row Level Security) que bloqueava a criação do pedido antes/depois do pagamento.

DROP POLICY IF EXISTS "Permitir insercao anonima de pedidos" ON public.orders;

CREATE POLICY "Permitir insercao anonima de pedidos" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);
