-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele cria uma função segura no banco de dados (RPC) com privilégios elevados (SECURITY DEFINER)
-- para permitir que a API de verificação do Stripe confirme o pagamento do pedido, contornando a proteção RLS com segurança.

CREATE OR REPLACE FUNCTION public.confirm_stripe_payment(
  order_id_input UUID, 
  payment_intent_input TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypassa as políticas de RLS de forma segura executando como Admin
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'paid',
      payment_id = payment_intent_input,
      paid_at = NOW()
  WHERE id = order_id_input;
END;
$$;
