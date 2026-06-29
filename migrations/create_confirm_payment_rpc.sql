-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele recria a função confirm_stripe_payment para retornar a linha do pedido atualizado (SETOF public.orders),
-- permitindo que a API de verificação envie os e-mails com todos os detalhes do pedido sem ser bloqueada pelo RLS.

CREATE OR REPLACE FUNCTION public.confirm_stripe_payment(
  order_id_input UUID, 
  payment_intent_input TEXT
)
RETURNS SETOF public.orders -- Retorna o registro atualizado
LANGUAGE plpgsql
SECURITY DEFINER -- Ignora políticas de RLS e roda como administrador com segurança
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.orders
  SET status = 'paid',
      payment_id = payment_intent_input,
      paid_at = NOW()
  WHERE id = order_id_input
  RETURNING *;
END;
$$;
