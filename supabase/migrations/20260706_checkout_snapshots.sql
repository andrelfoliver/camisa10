-- Tabela para salvar snapshots do carrinho antes do pagamento
-- Garante que customizações não sejam perdidas se o pedido falhar ao salvar

CREATE TABLE IF NOT EXISTS public.checkout_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  visitor_id text,
  items jsonb NOT NULL,
  form_data jsonb,
  total_price numeric,
  payment_method text,
  paypal_order_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'expired')),
  created_at timestamptz DEFAULT now(),
  recovered_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS checkout_snapshots_session_id_idx ON public.checkout_snapshots(session_id);
CREATE INDEX IF NOT EXISTS checkout_snapshots_created_at_idx ON public.checkout_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS checkout_snapshots_status_idx ON public.checkout_snapshots(status);

-- RLS
ALTER TABLE public.checkout_snapshots ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir (anon ou autenticado)
CREATE POLICY "Permitir insert público de snapshots"
  ON public.checkout_snapshots FOR INSERT WITH CHECK (true);

-- Qualquer autenticado pode ler (admin irá usar)
CREATE POLICY "Permitir leitura de snapshots"
  ON public.checkout_snapshots FOR SELECT USING (true);

-- Qualquer autenticado pode atualizar (marcar como recovered)
CREATE POLICY "Permitir update de snapshots"
  ON public.checkout_snapshots FOR UPDATE USING (true);

-- Qualquer autenticado pode deletar (limpar snapshots antigos)
CREATE POLICY "Permitir delete de snapshots"
  ON public.checkout_snapshots FOR DELETE USING (true);

GRANT INSERT ON public.checkout_snapshots TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.checkout_snapshots TO authenticated;
