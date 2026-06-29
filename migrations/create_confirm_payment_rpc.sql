-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele recria a função confirm_stripe_payment com uma checagem de idempotência (status = 'pending').
-- Isso garante que, mesmo se o frontend chamar a API em loop ou se a página for recarregada,
-- o pedido só será atualizado e os e-mails só serão enviados UMA ÚNICA VEZ.

DROP FUNCTION IF EXISTS public.confirm_stripe_payment(uuid, text);

CREATE OR REPLACE FUNCTION public.confirm_stripe_payment(
  order_id_input UUID, 
  payment_intent_input TEXT
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.orders
  SET status = 'paid',
      payment_id = payment_intent_input,
      paid_at = NOW()
  WHERE id = order_id_input AND status = 'pending' -- Só atualiza se ainda estiver pendente
  RETURNING *;
END;
$$;
