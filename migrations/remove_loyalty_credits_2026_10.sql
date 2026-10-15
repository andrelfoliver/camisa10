-- ========================================================
-- REMOVER CRÉDITO FIDELIDADE ($14.90) DE TODOS OS CLIENTES
-- + REMOVER CRÉDITO DE DEFEITO DO RAPHAEL (radiniz@gmail.com)
-- ========================================================
-- STATUS (15/10/2026): os DELETEs abaixo JÁ FORAM EXECUTADOS com sucesso.
-- Restam em customer_credits só 4 linhas (mineiro11 + engenheirodofuturo defeito).
-- Falta apenas o passo 2 (recalcular profiles.store_credit).
--
-- Observação: mineiro11@hotmail.com JÁ USOU o crédito fidelidade
-- (lançamento -14.90 no pedido #eac0e4). O crédito dele foi mantido.

-- 1) [JÁ EXECUTADO] Remoção dos créditos
-- DELETE FROM public.customer_credits
-- WHERE type IN ('reactivation_campaign', 'loyalty_reward')
--   AND lower(trim(customer_email)) <> 'mineiro11@hotmail.com';
--
-- DELETE FROM public.customer_credits
-- WHERE type = 'defect_compensation'
--   AND lower(trim(customer_email)) = 'radiniz@gmail.com';

-- 2a) PRÉ-VISUALIZAÇÃO: perfis cujo saldo salvo difere do histórico de créditos
SELECT p.email,
       p.store_credit AS saldo_atual,
       GREATEST(0, COALESCE(c.total, 0)) AS saldo_novo
FROM public.profiles p
LEFT JOIN (
  SELECT lower(trim(customer_email)) AS email, SUM(amount) AS total
  FROM public.customer_credits
  GROUP BY 1
) c ON c.email = lower(trim(p.email))
WHERE COALESCE(p.store_credit, 0) <> GREATEST(0, COALESCE(c.total, 0));

-- 2b) Recalcula profiles.store_credit a partir do histórico de créditos
UPDATE public.profiles p
SET store_credit = GREATEST(0, COALESCE((
      SELECT SUM(c.amount)
      FROM public.customer_credits c
      WHERE lower(trim(c.customer_email)) = lower(trim(p.email))
    ), 0))
WHERE COALESCE(p.store_credit, 0) <> GREATEST(0, COALESCE((
      SELECT SUM(c.amount)
      FROM public.customer_credits c
      WHERE lower(trim(c.customer_email)) = lower(trim(p.email))
    ), 0));

-- 3) Conferência final
SELECT customer_email, type, amount, description
FROM public.customer_credits
ORDER BY customer_email, created_at;
